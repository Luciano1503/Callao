import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBadge, LucideEye, LucideEyeOff, LucideLock, LucideSave, LucideUserRoundPlus } from '@lucide/angular';

import { RolCatalog } from '../../../core/models/catalog';
import { UserResponse } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-new-user',
  imports: [RouterLink, LucideBadge, LucideEye, LucideEyeOff, LucideLock, LucideSave, LucideUserRoundPlus],
  templateUrl: './new-user.html'
})
export class NewUser {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly userService = inject(UserService);

  protected readonly roles = signal<RolCatalog[]>([]);
  protected readonly createdUser = signal<UserResponse | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  constructor() {
    this.catalogService.getRoles().subscribe((roles) => this.roles.set(roles));
  }

  protected save(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    this.createdUser.set(null);
    this.errorMessage.set('');

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contrasenas no coinciden.');
      return;
    }

    const dni = String(formData.get('dni') ?? '').trim();
    const correo = String(formData.get('correo') ?? '').trim();
    const celular = String(formData.get('celular') ?? '').trim();

    if (!/^\d{8}$/.test(dni)) {
      this.errorMessage.set('El DNI debe tener 8 digitos.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      this.errorMessage.set('Ingrese un correo valido.');
      return;
    }

    if (celular && !/^\d{9}$/.test(celular)) {
      this.errorMessage.set('El numero de celular debe tener 9 digitos.');
      return;
    }

    this.isSubmitting.set(true);
    this.userService.createUser({
      dni,
      nombres: String(formData.get('nombres') ?? '').trim(),
      correo,
      celular,
      password,
      confirmPassword,
      rolId: Number(formData.get('rolId')),
      estado: String(formData.get('estado') ?? 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
      creadoPor: this.authService.currentUser()?.usuarioId ?? null
    }).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.createdUser.set(user);
        form.reset();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveCreateError(error));
      }
    });
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  private resolveCreateError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo registrar el usuario. Intente nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend este activo.';
    }

    return error.error?.message ?? 'No se pudo registrar el usuario. Intente nuevamente.';
  }
}
