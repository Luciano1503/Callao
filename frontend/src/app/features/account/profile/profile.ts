import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  LucideEye,
  LucideEyeOff,
  LucideKey,
  LucideLockKeyholeOpen,
  LucideMail,
  LucideSmartphone
} from '@lucide/angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [
    LucideEye,
    LucideEyeOff,
    LucideKey,
    LucideLockKeyholeOpen,
    LucideMail,
    LucideSmartphone
  ],
  templateUrl: './profile.html'
})
export class Profile {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly showOldPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly initials = computed(() => this.getInitials(this.currentUser()?.nombres ?? ''));
  protected readonly areaLabel = computed(() => {
    const role = this.currentUser()?.rolCodigo ?? '';
    if (role === 'ADMIN') {
      return 'Administracion del sistema';
    }

    if (role === 'SUPERVISOR_EVALUADOS') {
      return 'Unidad de Licencias';
    }

    if (role === 'EVALUADOR_CIRCUITO') {
      return 'Centro de circuito';
    }

    return 'Campo de evaluacion';
  });

  protected toggleOldPassword(): void {
    this.showOldPassword.update((value) => !value);
  }

  protected toggleNewPassword(): void {
    this.showNewPassword.update((value) => !value);
  }

  protected toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  protected changePassword(event: SubmitEvent): void {
    event.preventDefault();

    const user = this.currentUser();
    if (!user) {
      this.errorMessage.set('No existe una sesion activa.');
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const oldPassword = String(formData.get('oldPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmNewPassword = String(formData.get('confirmNewPassword') ?? '');

    this.successMessage.set('');
    this.errorMessage.set('');

    if (newPassword !== confirmNewPassword) {
      this.errorMessage.set('La nueva contrasena y su confirmacion no coinciden.');
      return;
    }

    this.isSubmitting.set(true);
    this.authService.changePassword({
      usuarioId: user.usuarioId,
      oldPassword,
      newPassword,
      confirmNewPassword
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Contrasena actualizada correctamente.');
        form.reset();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'US';
  }

  private resolveError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo actualizar la contrasena.';
    }

    return error.error?.message ?? 'No se pudo actualizar la contrasena.';
  }
}
