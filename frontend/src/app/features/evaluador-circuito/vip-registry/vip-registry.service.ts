import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response';
import { environment } from '../../../../environments/environment';

export interface VipRegistry {
  id: number;
  dni: string;
  nombres: string;
  creadoPor: number;
  creadoEn: string;
}

export interface RegisterVipRequest {
  dni: string;
  nombres: string;
}

@Injectable({
  providedIn: 'root'
})
export class VipRegistryService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiUrl}/evaluador-circuito/vip-registry`;

  findAll(): Observable<ApiResponse<VipRegistry[]>> {
    return this.http.get<ApiResponse<VipRegistry[]>>(this.URL);
  }

  findByDni(dni: string): Observable<ApiResponse<VipRegistry>> {
    return this.http.get<ApiResponse<VipRegistry>>(`${this.URL}/${dni}`);
  }

  register(request: RegisterVipRequest): Observable<ApiResponse<VipRegistry>> {
    return this.http.post<ApiResponse<VipRegistry>>(this.URL, request);
  }

  delete(dni: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.URL}/${dni}`);
  }
}
