import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { FinalReviewDetail, FinalReviewGroup, FinalizeEvaluationRequest } from '../models/final-review';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FinalReviewService {
  private readonly api = inject(ApiService);

  getGroups(): Observable<FinalReviewGroup[]> {
    return this.api
      .get<FinalReviewGroup[]>('/admin/revision-final/grupos')
      .pipe(map((response) => response.data));
  }

  getGroupDetail(groupId: number): Observable<FinalReviewDetail> {
    return this.api
      .get<FinalReviewDetail>(`/admin/revision-final/grupos/${groupId}`)
      .pipe(map((response) => response.data));
  }

  finalizeEvaluation(groupId: number, request: FinalizeEvaluationRequest): Observable<FinalReviewDetail> {
    return this.api
      .post<FinalReviewDetail, FinalizeEvaluationRequest>(`/admin/revision-final/grupos/${groupId}/finalizar`, request)
      .pipe(map((response) => response.data));
  }
}
