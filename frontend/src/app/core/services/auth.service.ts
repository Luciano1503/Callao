import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { ChangePasswordRequest, LoginRequest, LoginResponse } from '../models/auth';
import { ApiService } from './api.service';

type ShellProfile = 'admin' | 'supervisor' | 'evaluador' | 'veedor';

const SESSION_KEY = 'callao.auth.session';

const VEEDOR_ROUTE_BY_ROLE: Record<string, string> = {
  VEEDOR_TORRE_POSTERIOR: '/veedores/torre-posterior',
  VEEDOR_TORRE_FRONTAL: '/veedores/torre-frontal',
  VEEDOR_ESTACIONAMIENTO_PARALELO: '/veedores/estacionamiento-paralelo',
  VEEDOR_ESTACIONAMIENTO_DIAGONAL: '/veedores/estacionamiento-diagonal'
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly user = signal<LoginResponse | null>(this.loadSession());

  readonly currentUser = this.user.asReadonly();

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse, LoginRequest>('/auth/login', request).pipe(
      tap((response) => {
        this.user.set(response.data);
        localStorage.setItem(SESSION_KEY, JSON.stringify(response.data));
      }),
      map((response) => response.data)
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.api.post<void, ChangePasswordRequest>('/auth/change-password', request).pipe(
      map(() => undefined)
    );
  }

  logout(): void {
    this.user.set(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('callao.activeProfile');
  }

  canAccessProfile(profile: unknown, roleCode: string): boolean {
    if (profile === undefined || profile === null) {
      return true;
    }

    if (profile === 'admin') {
      return roleCode === 'ADMIN';
    }

    if (profile === 'supervisor') {
      return roleCode === 'SUPERVISOR_EVALUADOS';
    }

    if (profile === 'evaluador') {
      return roleCode === 'EVALUADOR_CIRCUITO';
    }

    if (profile === 'veedor') {
      return roleCode.startsWith('VEEDOR_');
    }

    return false;
  }

  defaultRouteForRole(roleCode: string): string {
    if (roleCode === 'ADMIN') {
      return '/dashboard';
    }

    if (roleCode === 'SUPERVISOR_EVALUADOS') {
      return '/relacion-evaluados';
    }

    if (roleCode === 'EVALUADOR_CIRCUITO') {
      return '/fichas-evaluacion';
    }

    return this.veedorRouteForRole(roleCode);
  }

  veedorRouteForRole(roleCode: string): string {
    return VEEDOR_ROUTE_BY_ROLE[roleCode] ?? '/veedores/torre-posterior';
  }

  canAccessVeedorType(tipo: string | null, roleCode: string): boolean {
    if (!roleCode.startsWith('VEEDOR_')) {
      return false;
    }

    return this.veedorRouteForRole(roleCode) === `/veedores/${tipo ?? ''}`;
  }

  profileForRole(roleCode: string): ShellProfile {
    if (roleCode === 'SUPERVISOR_EVALUADOS') {
      return 'supervisor';
    }

    if (roleCode === 'EVALUADOR_CIRCUITO') {
      return 'evaluador';
    }

    if (roleCode.startsWith('VEEDOR_')) {
      return 'veedor';
    }

    return 'admin';
  }

  private loadSession(): LoginResponse | null {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as LoginResponse;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
