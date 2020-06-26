import {Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Subject, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';

import {PlaceholderDirective} from '../../shared/placeholder/placeholder.directive';
import {WorkerSelectDialogListComponent} from './worker-select-dialog/worker-select-dialog-list-component';
import {WorkerData} from '../../workers/worker-list/worker-data.model';
import * as TabelActions from '../store/tabel.actions';
import * as fromApp from '../../store/app.reducer';
import {getMachineList, getSmensFromState, getWorkers} from '../../store/selectors/app.selector';
import {takeUntil} from 'rxjs/operators';
import {Smena} from '../smen-list/smena.model';

@Component({
  selector: 'app-smen-edit',
  templateUrl: './smen-edit.component.html',
  styleUrls: ['./smen-edit.component.css']
})
export class SmenEditComponent implements OnInit, OnDestroy {
  id: number;
  editMode = false;
  smenForm: FormGroup;
  @ViewChild(PlaceholderDirective, {static: false}) dialogHost: PlaceholderDirective;
  workerList: WorkerData[];
  public machineList: string[];
  private ngUnsubscribe$ = new Subject();
  workerList$ = this.store.pipe(select(getWorkers)).pipe(
    takeUntil(this.ngUnsubscribe$)
  ).subscribe(workerList => this.workerList = workerList
  );
  machineList$ = this.store.pipe(select(getMachineList)).pipe(
    takeUntil(this.ngUnsubscribe$)
  ).subscribe(list => this.machineList = list);

  private closeSub: Subscription;
  private selectSub: Subscription;
  private selectedWorker: WorkerData = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentFactoryResolver: ComponentFactoryResolver,
    private store: Store<fromApp.AppState>
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.id = +params.id;
        this.editMode = params.id != null;
        this.initForm();
      }
    );
  }

  onCancel() {
    this.router.navigate(['..'], {relativeTo: this.route});
  }

  onSubmit() {
    if (this.editMode) {
      this.store.dispatch(new TabelActions.UpdateSmena({index: this.id, newSmena: this.smenForm.value}));
    } else {
      this.store.dispatch(new TabelActions.AddSmena(this.smenForm.value));
    }
    this.onCancel();
  }

  onAddWorkerTime() {
    this.showWorkerSelectDialog();

  }

  getControls() {
    return (this.smenForm.get('workersTime') as FormArray).controls;
  }

  onDeleteWorkTime(index: number) {
    (this.smenForm.get('workersTime') as FormArray).removeAt(index);
  }

  showWorkerSelectDialog() {
    const dialogCmpFactoty = this.componentFactoryResolver.resolveComponentFactory(WorkerSelectDialogListComponent);
    const hostViewContainerRef = this.dialogHost.viewContainerRef;
    hostViewContainerRef.clear();
    const componentRef = hostViewContainerRef.createComponent(dialogCmpFactoty);

    this.closeSub = componentRef.instance.closeDialog.subscribe(
      () => {
        this.closeSub.unsubscribe();
        this.selectSub.unsubscribe();
        hostViewContainerRef.clear();
      }
    );

    this.selectSub = componentRef.instance.selectedWorker.subscribe(
      (wrkr: WorkerData) => {
        this.selectSub.unsubscribe();
        this.closeSub.unsubscribe();
        this.selectedWorker = wrkr;

        hostViewContainerRef.clear();
        (this.smenForm.get('workersTime') as FormArray).push(
          new FormGroup({
            tbNum: new FormControl(wrkr.tabelNum, [
              Validators.required,
              Validators.pattern(/^\d\d\d\d$/),
              this.tabelNumNotExitstValidator()
            ]),
            grade: new FormControl(wrkr.grade, [
              Validators.required,
              Validators.min(1),
              Validators.max(6)
            ]),
            sdelTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
            nightTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
            prostTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
            prikTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
            srednTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
            pprTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
            doublePayTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)])
          })
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
    if (this.closeSub) {
      this.closeSub.unsubscribe();
    }
    if (this.selectSub) {
      this.selectSub.unsubscribe();
    }

  }

  onUpdateTbNum(event: Event) {
    console.log(event);
  }

  tabelNumNotExitstValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if (this.getWorkerByTN(control.value)) {
        return null;
      } else {
        return {tabelNumNotExist: true};
      }
    };
  }

  getWorkerByTN(tabelNum: string) {
    return this.workerList.find((item) => {
        return item.tabelNum === tabelNum;
      }
    );
  }

  private initForm() {
    let dateSmen = '';
    let mashine = '';
    let numSmen = '';
    const workersTime = new FormArray([]);

    if (this.editMode) {
      let smena: Smena;
      this.store.pipe(select(getSmensFromState)).pipe(
        takeUntil(this.ngUnsubscribe$)
      ).subscribe(smens => smena = smens[this.id]);
      // const smena = this.smenListService.getSmenById(this.id);
      dateSmen = smena.dateSmen;
      mashine = smena.mashine;
      numSmen = smena.numSmen;
      if (smena.workersTime) {
        for (const worker of smena.workersTime) {
          workersTime.push(
            new FormGroup({
              tbNum: new FormControl(worker.tbNum, [Validators.required, Validators.pattern(/^\d\d\d\d$/)]),
              grade: new FormControl(worker.grade, [Validators.required, Validators.min(1), Validators.max(6)]),
              sdelTime: new FormControl(worker.sdelTime, [Validators.min(0), Validators.max(11.5)]),
              nightTime: new FormControl(worker.nightTime, [Validators.min(0), Validators.max(11.5)]),
              prostTime: new FormControl(worker.prostTime, [Validators.min(0), Validators.max(11.5)]),
              prikTime: new FormControl(worker.prikTime, [Validators.min(0), Validators.max(11.5)]),
              srednTime: new FormControl(worker.srednTime, [Validators.min(0), Validators.max(11.5)]),
              pprTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)]),
              doublePayTime: new FormControl(null, [Validators.min(0), Validators.max(11.5)])
            })
          );
        }
        this.selectedWorker = null;
      }
    }

    this.smenForm = new FormGroup({
      dateSmen: new FormControl(dateSmen, [Validators.required]),
      mashine: new FormControl(mashine, [Validators.required]),
      numSmen: new FormControl(numSmen, [Validators.required]),
      workersTime
    });
  }
}
