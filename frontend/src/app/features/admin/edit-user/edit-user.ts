import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideSave
} from '@lucide/angular';

import { RolCatalog } from '../../../core/models/catalog';
import { UpdateUserRequest, UserResponse } from '../../../core/models/user';
import { CatalogService } from '../../../core/services/catalog.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-edit-user',
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideSave
  ],
  templateUrl: './edit-user.html'
})
export class EditUser {
  private readonly userService = inject(UserService);
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly user = signal<UserResponse | null>(null);
  protected readonly roles = signal<RolCatalog[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  /* Form fields */
  protected nombres = signal('');
  protected correo = signal('');
  protected celular = signal('');
  protected selectedRolId = signal<number>(0);
  protected selectedEstado = signal<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  constructor() {
    const dni = this.route.snapshot.paramMap.get('dni');

    this.catalogService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.roles.set([])
    });

    if (dni) {
      this.userService.getUsers().subscribe({
        next: (users) => {
          const found = users.find((u) => u.dni === dni) ?? null;
          this.user.set(found);
          if (found) {
            this.nombres.set(found.nombres);
            this.correo.set(found.correo);
            this.celular.set(found.celular ?? '');
            this.selectedRolId.set(found.rolId);
            this.selectedEstado.set(found.estado);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No se pudo cargar el usuario.');
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  protected get initials(): string {
    const n = this.nombres() || this.user()?.nombres || '??';
    return n.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  }

  protected updateField(field: 'nombres' | 'correo' | 'celular', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'nombres') this.nombres.set(value);
    if (field === 'correo') this.correo.set(value);
    if (field === 'celular') this.celular.set(value);
  }

  protected updateRol(event: Event): void {
    this.selectedRolId.set(Number((event.target as HTMLSelectElement).value));
  }

  protected updateEstado(value: 'ACTIVO' | 'INACTIVO'): void {
    this.selectedEstado.set(value);
  }

  protected save(): void {
    const u = this.user();
    if (!u) return;

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSaving.set(true);

    const request: UpdateUserRequest = {
      nombres: this.nombres(),
      correo: this.correo(),
      celular: this.celular(),
      rolId: this.selectedRolId(),
      estado: this.selectedEstado()
    };

    this.userService.updateUser(u.id, request).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.isSaving.set(false);
        this.successMessage.set('Usuario actualizado correctamente.');
        setTimeout(() => this.router.navigate(['/usuarios']), 1200);
      },
      error: (err: unknown) => {
        this.isSaving.set(false);
        const msg = (err as { error?: { message?: string } }).error?.message;
        this.errorMessage.set(msg ?? 'No se pudo actualizar el usuario.');
      }
    });
  }
}
