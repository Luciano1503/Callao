import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBadge, LucideLock, LucideSave, LucideUserRoundPlus, LucideUploadCloud, LucideImage, LucideTrash2 } from '@lucide/angular';

import { RolCatalog } from '../../../core/models/catalog';
import { UserResponse } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { UserService } from '../../../core/services/user.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-new-user',
  imports: [RouterLink, LucideBadge, LucideLock, LucideSave, LucideUserRoundPlus, LucideUploadCloud, LucideImage, LucideTrash2],
  templateUrl: './new-user.html'
})
export class NewUser {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly userService = inject(UserService);
  private readonly scannerService = inject(ScannerService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected readonly roles = signal<RolCatalog[]>([]);
  protected readonly scannedDni = signal('');
  protected readonly createdUser = signal<UserResponse | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly signatureBase64 = signal<string | null>(null);

  constructor() {
    this.catalogService.getRoles().subscribe((roles) => this.roles.set(roles));

    this.scannerService.scan$.pipe(takeUntilDestroyed()).subscribe((dni) => {
      this.scannedDni.set(dni);
      this.errorMessage.set('');
    });
  }

  protected save(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    this.createdUser.set(null);
    this.errorMessage.set('');

    const dni = String(formData.get('dni') ?? '').trim();
    const correo = String(formData.get('correo') ?? '').trim();
    const celular = String(formData.get('celular') ?? '').trim();

    if (!/^\d{8}$/.test(dni)) {
      this.errorMessage.set('El DNI debe tener 8 digitos.');
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.isSubmitting.set(true);
    const request = {
      dni: formData.get('dni') as string,
      nombres: formData.get('nombres') as string,
      correo: formData.get('correo') as string,
      celular: (formData.get('celular') as string) || undefined,
      rolId: Number(formData.get('rolId')),
      estado: formData.get('estado') as 'ACTIVO' | 'INACTIVO',
      creadoPor: this.authService.currentUser()?.usuarioId || null,
      firmaJpgUrl: this.signatureBase64() || undefined
    };

    this.userService.createUser(request).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.createdUser.set(user);
        this.scannedDni.set('');
        this.signatureBase64.set(null);
        if (this.fileInput?.nativeElement) {
          this.fileInput.nativeElement.value = '';
        }
        form.reset();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveCreateError(error));
      }
    });
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

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.signatureBase64.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.signatureBase64.set(null);
    }
  }

  protected removeSignature(): void {
    this.signatureBase64.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
