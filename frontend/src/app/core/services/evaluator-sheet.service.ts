import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EvaluatorSheetDetail, EvaluatorSheetSummary, UpdateEvaluatorSheetRequest } from '../models/evaluator-sheet';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorSheetService {
  private readonly api = inject(ApiService);

  getSheets(): Observable<EvaluatorSheetSummary[]> {
    return this.api
      .get<EvaluatorSheetSummary[]>('/evaluador-circuito/fichas')
      .pipe(map((response) => response.data));
  }

  getDetail(evaluatedId: number): Observable<EvaluatorSheetDetail> {
    return this.api
      .get<EvaluatorSheetDetail>(`/evaluador-circuito/fichas/${evaluatedId}`)
      .pipe(map((response) => response.data));
  }

  updateSheet(evaluatedId: number, request: UpdateEvaluatorSheetRequest): Observable<EvaluatorSheetDetail> {
    return this.api
      .post<EvaluatorSheetDetail, UpdateEvaluatorSheetRequest>(`/evaluador-circuito/fichas/${evaluatedId}`, request)
      .pipe(map((response) => response.data));
  }
}
