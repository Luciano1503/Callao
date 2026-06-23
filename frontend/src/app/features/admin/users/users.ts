import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideEye,
  LucideListFilter,
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideTrash2
} from '@lucide/angular';

import { RolCatalog } from '../../../core/models/catalog';
import { UserResponse } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { UserService } from '../../../core/services/user.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ZoneFilter {
  value: string;
  label: string;
}

const ZONE_FILTERS: ZoneFilter[] = [
  { value: 'torre-posterior', label: 'Torre posterior' },
  { value: 'torre-frontal', label: 'Torre frontal' },
  { value: 'estacionamiento-paralelo', label: 'Estacionamiento paralelo' },
  { value: 'estacionamiento-diagonal', label: 'Estacionamiento diagonal' }
];

@Component({
  selector: 'app-users',
  imports: [
    RouterLink,
    LucideChevronLeft,
    LucideChevronRight,
    LucideEye,
    LucideListFilter,
    LucidePencil,
    LucidePlus,
    LucideSearch,
    LucideTrash2
  ],
  templateUrl: './users.html'
})
export class Users {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly userService = inject(UserService);
  private readonly scannerService = inject(ScannerService);

  protected readonly users = signal<UserResponse[]>([]);
  protected readonly roles = signal<RolCatalog[]>([]);
  protected readonly zones = ZONE_FILTERS;
  protected readonly isLoading = signal(true);
  protected readonly isDeleting = signal<number | null>(null);
  protected readonly copiedUserId = signal<number | null>(null);
  protected readonly searchFilter = signal('');
  protected readonly roleFilter = signal('');
  protected readonly zoneFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly filteredUsers = computed(() => {
    const search = this.normalizeText(this.searchFilter());
    const role = this.roleFilter();
    const zone = this.zoneFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      const matchesSearch = !search || [
        user.dni,
        user.nombres,
        user.correo,
        user.celular ?? ''
      ].some((value) => this.normalizeText(value).includes(search));

      const matchesRole = !role || user.rolCodigo === role;
      const matchesZone = !zone || this.zoneValueForUser(user) === zone;
      const matchesStatus = !status || user.estado === status;

      return matchesSearch && matchesRole && matchesZone && matchesStatus;
    });
  });

  constructor() {
    this.loadUsers();
    this.catalogService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.roles.set([])
    });

    this.scannerService.scan$.pipe(takeUntilDestroyed()).subscribe((dni) => {
      this.searchFilter.set(dni);
    });
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.isLoading.set(false);
      }
    });
  }

  protected updateSearch(event: Event): void {
    this.searchFilter.set((event.target as HTMLInputElement).value);
  }

  protected updateRole(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value);
  }

  protected updateZone(event: Event): void {
    this.zoneFilter.set((event.target as HTMLSelectElement).value);
  }

  protected updateStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  protected deactivateUser(user: UserResponse): void {
    if (this.isCurrentUser(user) || user.estado === 'INACTIVO') {
      return;
    }

    const confirmed = window.confirm(`Deseas dar de baja al usuario ${user.nombres}?`);
    if (!confirmed) {
      return;
    }

    this.clearMessages();
    this.isDeleting.set(user.id);

    this.userService.deactivateUser(user.id).subscribe({
      next: (updatedUser) => {
        this.users.update((users) => users.map((item) => item.id === updatedUser.id ? updatedUser : item));
        this.isDeleting.set(null);
        this.successMessage.set('Usuario dado de baja correctamente.');
      },
      error: (error: unknown) => {
        this.isDeleting.set(null);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  protected zoneLabelForUser(user: UserResponse): string {
    const zone = ZONE_FILTERS.find((item) => item.value === this.zoneValueForUser(user));
    // If no geographic zone, show the role name to avoid an empty dash
    return zone?.label.toLowerCase() ?? user.rolNombre;
  }

  protected copyContact(user: UserResponse): void {
    const text = `Correo: ${user.correo}\nCelular: ${user.celular ?? 'sin número'}`;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedUserId.set(user.id);
      setTimeout(() => this.copiedUserId.set(null), 2000);
    });
  }

  protected isCurrentUser(user: UserResponse): boolean {
    return this.authService.currentUser()?.usuarioId === user.id;
  }

  private zoneValueForUser(user: UserResponse): string {
    if (user.rolCodigo === 'VEEDOR_TORRE_POSTERIOR') {
      return 'torre-posterior';
    }

    if (user.rolCodigo === 'VEEDOR_TORRE_FRONTAL') {
      return 'torre-frontal';
    }

    if (user.rolCodigo === 'VEEDOR_ESTACIONAMIENTO_PARALELO') {
      return 'estacionamiento-paralelo';
    }

    if (user.rolCodigo === 'VEEDOR_ESTACIONAMIENTO_DIAGONAL') {
      return 'estacionamiento-diagonal';
    }

    return '';
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private resolveError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo completar la operacion.';
    }

    return error.error?.message ?? 'No se pudo completar la operacion.';
  }
}
