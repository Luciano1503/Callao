import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html'
})
export class Login {
  protected readonly showPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected submit(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const usuario = String(formData.get('usuario') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService.login({ usuario, password }).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);

        if (user.debeCambiarPassword) {
          void this.router.navigateByUrl('/cambiar-contrasena');
          return;
        }

        void this.router.navigateByUrl(this.authService.defaultRouteForRole(user.rolCodigo));
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveLoginError(error));
      }
    });
  }

  private resolveLoginError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo iniciar sesion. Intente nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend este activo.';
    }

    if (error.status === 401) {
      return error.error?.message ?? 'Credenciales incorrectas o usuario inactivo.';
    }

    return 'No se pudo iniciar sesion. Intente nuevamente.';
  }
}
