import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { EvaluatedGroupSummary } from '../models/evaluated-group';
import { SaveVeedorSheetRequest, VeedorSheet } from '../models/veedor-sheet';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VeedorSheetService {
  private readonly api = inject(ApiService);

  getGroups(tipoVeedor: string): Observable<EvaluatedGroupSummary[]> {
    return this.api
      .get<EvaluatedGroupSummary[]>(`/veedores/${encodeURIComponent(tipoVeedor)}/grupos`)
      .pipe(map((response) => response.data));
  }

  getCurrentSheet(tipoVeedor: string): Observable<VeedorSheet> {
    return this.api
      .get<VeedorSheet>(`/veedores/${encodeURIComponent(tipoVeedor)}/ficha-actual`)
      .pipe(map((response) => response.data));
  }

  getSheet(tipoVeedor: string, groupId: number): Observable<VeedorSheet> {
    return this.api
      .get<VeedorSheet>(`/veedores/${encodeURIComponent(tipoVeedor)}/fichas/${groupId}`)
      .pipe(map((response) => response.data));
  }

  saveSheet(tipoVeedor: string, request: SaveVeedorSheetRequest): Observable<VeedorSheet> {
    return this.api
      .post<VeedorSheet, SaveVeedorSheetRequest>(`/veedores/${encodeURIComponent(tipoVeedor)}/fichas`, request)
      .pipe(map((response) => response.data));
  }
}
