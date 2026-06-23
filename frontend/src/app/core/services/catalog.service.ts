import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { CategoriaCatalog, ColorCatalog, CriterioCatalog, RolCatalog, SedeCatalog, VeedorCriteriosCatalog, VehiculoCatalog } from '../models/catalog';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly api = inject(ApiService);

  private rolesCache$?: Observable<RolCatalog[]>;
  private categoriasCache$?: Observable<CategoriaCatalog[]>;
  private coloresCache$?: Observable<ColorCatalog[]>;
  private vehiculosCache$?: Observable<VehiculoCatalog[]>;
  private sedesCache$?: Observable<SedeCatalog[]>;
  private criteriosCache = new Map<string, Observable<CriterioCatalog[]>>();
  private criteriosVeedorCache = new Map<string, Observable<VeedorCriteriosCatalog>>();

  getRoles(): Observable<RolCatalog[]> {
    if (!this.rolesCache$) {
      this.rolesCache$ = this.api.get<RolCatalog[]>('/catalogos/roles').pipe(
        map((response) => response.data),
        shareReplay(1)
      );
    }
    return this.rolesCache$;
  }

  getCategorias(): Observable<CategoriaCatalog[]> {
    if (!this.categoriasCache$) {
      this.categoriasCache$ = this.api.get<CategoriaCatalog[]>('/catalogos/categorias').pipe(
        map((response) => response.data),
        shareReplay(1)
      );
    }
    return this.categoriasCache$;
  }

  getColores(): Observable<ColorCatalog[]> {
    if (!this.coloresCache$) {
      this.coloresCache$ = this.api.get<ColorCatalog[]>('/catalogos/colores').pipe(
        map((response) => response.data),
        shareReplay(1)
      );
    }
    return this.coloresCache$;
  }

  getVehiculos(): Observable<VehiculoCatalog[]> {
    if (!this.vehiculosCache$) {
      this.vehiculosCache$ = this.api.get<VehiculoCatalog[]>('/catalogos/vehiculos').pipe(
        map((response) => response.data),
        shareReplay(1)
      );
    }
    return this.vehiculosCache$;
  }

  getSedes(): Observable<SedeCatalog[]> {
    if (!this.sedesCache$) {
      this.sedesCache$ = this.api.get<SedeCatalog[]>('/catalogos/sedes').pipe(
        map((response) => response.data),
        shareReplay(1)
      );
    }
    return this.sedesCache$;
  }

  getCriterios(tipo: string): Observable<CriterioCatalog[]> {
    if (!this.criteriosCache.has(tipo)) {
      const request$ = this.api
        .get<CriterioCatalog[]>(`/catalogos/criterios?tipo=${encodeURIComponent(tipo)}`)
        .pipe(
          map((response) => response.data),
          shareReplay(1)
        );
      this.criteriosCache.set(tipo, request$);
    }
    return this.criteriosCache.get(tipo)!;
  }

  getCriteriosVeedor(tipoVeedor: string): Observable<VeedorCriteriosCatalog> {
    if (!this.criteriosVeedorCache.has(tipoVeedor)) {
      const request$ = this.api
        .get<VeedorCriteriosCatalog>(`/catalogos/veedores/${tipoVeedor}/criterios`)
        .pipe(
          map((response) => response.data),
          shareReplay(1)
        );
      this.criteriosVeedorCache.set(tipoVeedor, request$);
    }
    return this.criteriosVeedorCache.get(tipoVeedor)!;
  }

  getFirmasRoles(): Observable<{ [key: string]: string }> {
    return this.api
      .get<{ [key: string]: string }>('/catalogos/firmas-roles')
      .pipe(map((response) => response.data));
  }

  getFirmasGrupo(groupId: number): Observable<{ [key: string]: string }> {
    return this.api
      .get<{ [key: string]: string }>(`/catalogos/firmas-grupo/${groupId}`)
      .pipe(map((response) => response.data));
  }
}
