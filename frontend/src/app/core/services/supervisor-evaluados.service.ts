import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  CreateEvaluatedRequest,
  CreateGroupRequest,
  EvaluatedGroup,
  EvaluatedGroupSummary,
  FinalizeGroupRequest,
  UpdateGroupColorRequest
} from '../models/evaluated-group';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SupervisorEvaluadosService {
  private readonly api = inject(ApiService);

  getGroups(supervisorId: number): Observable<EvaluatedGroupSummary[]> {
    return this.api
      .get<EvaluatedGroupSummary[]>(`/supervisor-evaluados/grupos?supervisorId=${supervisorId}`)
      .pipe(map((response) => response.data));
  }

  getCurrentGroup(supervisorId: number): Observable<EvaluatedGroup> {
    return this.api
      .get<EvaluatedGroup>(`/supervisor-evaluados/grupos/actual?supervisorId=${supervisorId}`)
      .pipe(map((response) => response.data));
  }

  getGroup(groupId: number, supervisorId: number): Observable<EvaluatedGroup> {
    return this.api
      .get<EvaluatedGroup>(`/supervisor-evaluados/grupos/${groupId}?supervisorId=${supervisorId}`)
      .pipe(map((response) => response.data));
  }

  createGroup(request: CreateGroupRequest): Observable<EvaluatedGroup> {
    return this.api
      .post<EvaluatedGroup, CreateGroupRequest>('/supervisor-evaluados/grupos', request)
      .pipe(map((response) => response.data));
  }

  updateGroupColor(groupId: number, request: UpdateGroupColorRequest): Observable<EvaluatedGroup> {
    return this.api
      .post<EvaluatedGroup, UpdateGroupColorRequest>(`/supervisor-evaluados/grupos/${groupId}/color`, request)
      .pipe(map((response) => response.data));
  }

  addEvaluated(groupId: number, request: CreateEvaluatedRequest): Observable<EvaluatedGroup> {
    return this.api
      .post<EvaluatedGroup, CreateEvaluatedRequest>(`/supervisor-evaluados/grupos/${groupId}/evaluados`, request)
      .pipe(map((response) => response.data));
  }

  finalizeGroup(groupId: number, request: FinalizeGroupRequest): Observable<EvaluatedGroup> {
    return this.api
      .post<EvaluatedGroup, FinalizeGroupRequest>(`/supervisor-evaluados/grupos/${groupId}/finalizar`, request)
      .pipe(map((response) => response.data));
  }

  updateGroupDate(groupId: number, request: import('../models/evaluated-group').UpdateGroupDateRequest): Observable<EvaluatedGroup> {
    return this.api
      .post<EvaluatedGroup, import('../models/evaluated-group').UpdateGroupDateRequest>(`/supervisor-evaluados/grupos/${groupId}/fecha`, request)
      .pipe(map((response) => response.data));
  }
}
