import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CategoriaCatalog, ColorCatalog, CriterioCatalog, RolCatalog, VeedorCriteriosCatalog, VehiculoCatalog } from '../models/catalog';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly api = inject(ApiService);

  getRoles(): Observable<RolCatalog[]> {
    return this.api.get<RolCatalog[]>('/catalogos/roles').pipe(map((response) => response.data));
  }

  getCategorias(): Observable<CategoriaCatalog[]> {
    return this.api.get<CategoriaCatalog[]>('/catalogos/categorias').pipe(map((response) => response.data));
  }

  getColores(): Observable<ColorCatalog[]> {
    return this.api.get<ColorCatalog[]>('/catalogos/colores').pipe(map((response) => response.data));
  }

  getVehiculos(): Observable<VehiculoCatalog[]> {
    return this.api.get<VehiculoCatalog[]>('/catalogos/vehiculos').pipe(map((response) => response.data));
  }

  getCriterios(tipo: string): Observable<CriterioCatalog[]> {
    return this.api
      .get<CriterioCatalog[]>(`/catalogos/criterios?tipo=${encodeURIComponent(tipo)}`)
      .pipe(map((response) => response.data));
  }

  getCriteriosVeedor(tipoVeedor: string): Observable<VeedorCriteriosCatalog> {
    return this.api
      .get<VeedorCriteriosCatalog>(`/catalogos/veedores/${tipoVeedor}/criterios`)
      .pipe(map((response) => response.data));
  }
}
