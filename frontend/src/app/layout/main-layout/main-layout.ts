import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBadgeCheck,
  LucideClipboardList,
  LucideEye,
  LucideFileText,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideSearch,
  LucideSettings,
  LucideShield,
  LucideUsers
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';

type ShellProfile = 'admin' | 'supervisor' | 'evaluador' | 'veedor';

interface ShellProfileInfo {
  brand: string;
  subtitle: string;
  userName: string;
  userMeta: string;
  initials: string;
}

const PROFILE_INFO: Record<ShellProfile, ShellProfileInfo> = {
  admin: {
    brand: 'Control de Circuito de Manejo',
    subtitle: 'Administracion del sistema',
    userName: 'Admin Principal',
    userMeta: 'DG-01',
    initials: 'AP'
  },
  supervisor: {
    brand: 'Control de Circuito de Manejo',
    subtitle: 'Supervisor de evaluados',
    userName: 'Supervisor',
    userMeta: 'Relacion de evaluados',
    initials: 'SE'
  },
  evaluador: {
    brand: 'Control de Circuito de Manejo',
    subtitle: 'Centro de circuito',
    userName: 'Evaluador',
    userMeta: 'Fichas de evaluacion',
    initials: 'EC'
  },
  veedor: {
    brand: 'Control de Circuito de Manejo',
    subtitle: 'Veedores de campo',
    userName: 'Veedor',
    userMeta: 'Evaluacion tecnica',
    initials: 'VD'
  }
};

const PROFILES: ShellProfile[] = ['admin', 'supervisor', 'evaluador', 'veedor'];

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideBadgeCheck,
    LucideClipboardList,
    LucideEye,
    LucideFileText,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideSearch,
    LucideSettings,
    LucideShield,
    LucideUsers
  ],
  templateUrl: './main-layout.html'
})
export class MainLayout {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly currentProfile = signal<ShellProfile>('admin');
  protected readonly profileInfo = computed(() => {
    const baseInfo = PROFILE_INFO[this.currentProfile()];
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return baseInfo;
    }

    return {
      ...baseInfo,
      userName: currentUser.nombres,
      userMeta: currentUser.rolNombre,
      initials: this.getInitials(currentUser.nombres)
    };
  });
  protected readonly veedorRoute = computed(() => {
    const currentUser = this.authService.currentUser();
    return currentUser ? this.authService.veedorRouteForRole(currentUser.rolCodigo) : '/veedores/torre-posterior';
  });

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.syncProfile();
      }
    });

    queueMicrotask(() => this.syncProfile());
  }

  private syncProfile(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentProfile.set(this.authService.profileForRole(currentUser.rolCodigo));
      return;
    }

    const routeProfile = this.getDeepestRouteProfile();
    if (routeProfile) {
      this.currentProfile.set(routeProfile);
      return;
    }

    this.currentProfile.set(this.inferProfileFromUrl(this.router.url));
  }

  private getDeepestRouteProfile(): ShellProfile | null {
    let child = this.route.firstChild;

    while (child?.firstChild) {
      child = child.firstChild;
    }

    const profile = child?.snapshot.data['profile'];
    return this.isProfile(profile) ? profile : null;
  }

  private inferProfileFromUrl(url: string): ShellProfile {
    if (url.startsWith('/relacion-evaluados') || url.startsWith('/supervisor-consultas')) {
      return 'supervisor';
    }

    if (url.startsWith('/fichas-evaluacion') || url.startsWith('/registro-vip')) {
      return 'evaluador';
    }

    if (url.startsWith('/evaluacion-circuito') || url.startsWith('/revision-final') || url.startsWith('/dashboard') || url.startsWith('/usuarios')) {
      return 'admin';
    }

    if (url.startsWith('/veedores')) {
      return 'veedor';
    }

    return 'admin';
  }

  private isProfile(value: unknown): value is ShellProfile {
    return typeof value === 'string' && PROFILES.includes(value as ShellProfile);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
