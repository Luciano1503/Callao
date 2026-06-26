import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideEye, LucideEyeOff, LucideKeyRound, LucideLandmark, LucideLockKeyhole } from '@lucide/angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verification',
  imports: [RouterLink, LucideArrowRight, LucideEye, LucideEyeOff, LucideKeyRound, LucideLandmark, LucideLockKeyhole],
  templateUrl: './verification.html'
})
export class Verification {
  protected readonly showOldPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    if (!this.authService.currentUser()) {
      void this.router.navigateByUrl('/login');
    }
  }

  protected toggleOldPassword(): void {
    this.showOldPassword.update((visible) => !visible);
  }

  protected toggleNewPassword(): void {
    this.showNewPassword.update((visible) => !visible);
  }

  protected toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  protected updatePassword(event: SubmitEvent): void {
    event.preventDefault();

    const user = this.authService.currentUser();
    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const oldPassword = String(formData.get('oldPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmNewPassword = String(formData.get('confirmNewPassword') ?? '');

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
        this.authService.logout();
        void this.router.navigateByUrl('/login');
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveChangePasswordError(error));
      }
    });
  }

  private resolveChangePasswordError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo actualizar la contrasena. Intente nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend este activo.';
    }

    if (error.error?.data && typeof error.error.data === 'object' && Object.keys(error.error.data).length > 0) {
      return Object.values(error.error.data)[0] as string;
    }

    return error.error?.message ?? 'No se pudo actualizar la contrasena. Intente nuevamente.';
  }
}
