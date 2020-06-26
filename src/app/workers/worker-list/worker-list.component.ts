import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {WorkerListService} from './worker-list.service';
import {WorkerData} from './worker-data.model';
import {ActivatedRoute, Router} from '@angular/router';
import * as fromApp from '../../store/app.reducer';
import {Store} from '@ngrx/store';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-worker-list',
  templateUrl: './worker-list.component.html',
  styleUrls: ['./worker-list.component.css']
})
export class WorkerListComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  workers: WorkerData[];

  constructor(
      private workerListService: WorkerListService,
      private router: Router,
      private route: ActivatedRoute,
      private store: Store<fromApp.AppState>
    ) { }

  ngOnInit() {
    this.subscription = this.store.select('workers').pipe(
      map(workersState => workersState.workers)
    ).subscribe(
      workers => {
        this.workers = workers;
      }
    );
    // this.subscription = this.workerListService.workersChanged.subscribe(
    //   (workers: WorkerData[]) => {
    //     this.workers = workers;
    // });
    // this.workers = this.workerListService.getWorkers();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onNewWorker() {
    this.router.navigate(['new'], {relativeTo: this.route});
  }

}
