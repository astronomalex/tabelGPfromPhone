import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';

import * as fromApp from '../../store/app.reducer';
import * as TabelActions from './tabel.actions';
import {map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {Smena} from '../smen-list/smena.model';


@Injectable()
export class TabelEffects {
  @Effect()
  fetchSmens = this.actions$.pipe(
    ofType(TabelActions.FETCH_SMENS),
    withLatestFrom(this.store.select('auth')),
    switchMap(([actionData, authState]) => {
      const url: string = 'https://ng-tabelgp.firebaseio.com/' + authState.locId + '_smens.json';
      return this.http.get<Smena[]>(url).pipe(
        map(smens => {
          return smens.map(smena => {
            return {
              ...smena,
              workersTime: smena.workersTime ? smena.workersTime : []
            };
          });
        }),
        map(smens => {
          // this.store.dispatch(new TabelActions.SetSmens(smens));
          console.log(smens);
          return new TabelActions.SetSmens(smens);
        })
      );
      }
    )

  );

  @Effect({dispatch: false})
  storeSmens = this.actions$.pipe(
    ofType(TabelActions.STORE_SMENS),
    withLatestFrom(this.store.select('tabel')),
    withLatestFrom(this.store.select('auth')),
    switchMap(([[actionData, tabelState], authState]) => {
      const url = 'https://ng-tabelgp.firebaseio.com/' + authState.locId + '_smens.json';
      return this.http.put(url, tabelState.smens);
    })
  );
  // storeSmens() {
  //
  //   if (this.locId) {}
  //   if (this.authService.locId) {
  //     console.log(this.authService.locId);
  //     const url: string = 'https://ng-tabelgp.firebaseio.com/' + this.authService.locId + '_smens.json';
  //     const smens = this.smenListService.getSmens();
  //     if (smens.length > 0) {
  //       this.http.put(url, smens)
  //         // this.http.put('https://ng-tabelgp.firebaseio.com/smens.json', smens)
  //         .subscribe(response => {
  //           console.log(response);
  //         });
  //     }
  //   }
  // }

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private store: Store<fromApp.AppState>
  ) {}
}
