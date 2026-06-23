import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { LucideCalendar, LucideCheckCircle2, LucideClock, LucidePlus, LucideSave, LucideUserRoundPlus } from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { CategoriaCatalog, ColorCatalog, SedeCatalog, VehiculoCatalog } from '../../../core/models/catalog';
import { EvaluatedGroup, EvaluatedGroupSummary } from '../../../core/models/evaluated-group';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { SupervisorEvaluadosService } from '../../../core/services/supervisor-evaluados.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-evaluated-relation',
  imports: [LucideCheckCircle2, LucidePlus, LucideSave, LucideUserRoundPlus],
  templateUrl: './evaluated-relation.html'
})
export class EvaluatedRelation {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly supervisorService = inject(SupervisorEvaluadosService);
  private readonly scannerService = inject(ScannerService);

  protected readonly scannedDni = signal('');

  protected readonly categories = signal<CategoriaCatalog[]>([]);
  protected readonly colors = signal<ColorCatalog[]>([]);
  protected readonly sedes = signal<SedeCatalog[]>([]);
  protected readonly vehicles = signal<VehiculoCatalog[]>([]);
  protected readonly groups = signal<EvaluatedGroupSummary[]>([]);
  protected readonly selectedSedeId = signal<number | null>(null);
  protected readonly activeGroup = signal<EvaluatedGroup | null>(null);
  protected readonly newGroupColorId = signal<number | null>(null);
  protected readonly showNewGroupForm = signal(false);
  protected readonly observations = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isChangingGroup = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isCreatingGroup = signal(false);
  protected readonly isUpdatingColor = signal(false);
  protected readonly isUpdatingDate = signal(false);
  protected readonly isFinalizing = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly progressPercent = computed(() => {
    const group = this.activeGroup();
    if (!group || group.capacidadMaxima === 0) {
      return 0;
    }

    return Math.round((group.totalEvaluados / group.capacidadMaxima) * 100);
  });

  protected readonly placaSearchTerm = signal('');
  protected readonly showPlacaDropdown = signal(false);

  protected readonly filteredVehicles = computed(() => {
    const term = this.placaSearchTerm().trim().toLowerCase();
    const sedeId = this.selectedSedeId();
    let list = this.vehicles();

    if (sedeId) {
      list = list.filter(v => v.sedeId === sedeId);
    }

    if (!term) {
      return list.slice(0, 5);
    }
    return list.filter(v => v.placa.toLowerCase().includes(term)).slice(0, 5);
  });

  protected readonly canCreateNewGroup = computed(() => {
    const group = this.activeGroup();
    return !group || group.totalEvaluados >= group.capacidadMaxima || group.estado !== 'BORRADOR';
  });

  protected readonly canFinalizeGroup = computed(() => {
    const group = this.activeGroup();
    return !!group && group.estado === 'BORRADOR' && group.totalEvaluados === group.capacidadMaxima;
  });

  constructor() {
    forkJoin({
      categories: this.catalogService.getCategorias(),
      colors: this.catalogService.getColores(),
      sedes: this.catalogService.getSedes(),
      vehicles: this.catalogService.getVehiculos(),
      group: this.supervisorService.getCurrentGroup(this.supervisorId())
    }).subscribe({
      next: ({ categories, colors, sedes, vehicles, group }) => {
        this.categories.set(categories);
        this.colors.set(colors);
        this.sedes.set(sedes);
        this.vehicles.set(vehicles);
        this.setActiveGroup(group);
        this.loadGroups();
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });

    this.scannerService.scan$.pipe(takeUntilDestroyed()).subscribe((dni) => {
      this.scannedDni.set(dni);
      this.successMessage.set('DNI capturado automáticamente: ' + dni);
    });
  }

  protected addEvaluated(event: SubmitEvent): void {
    event.preventDefault();

    const group = this.activeGroup();
    if (!group) {
      this.errorMessage.set('No existe un grupo activo.');
      return;
    }

    if (!group.puedeAgregar) {
      this.errorMessage.set('El grupo actual ya no admite mas evaluados.');
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const categoryId = Number(formData.get('categoriaId'));
    const dni = String(formData.get('dni') ?? '').trim();

    if (!/^\d{8}$/.test(dni)) {
      this.errorMessage.set('El DNI debe tener 8 digitos.');
      return;
    }

    this.clearMessages();
    this.isSubmitting.set(true);

    this.supervisorService.addEvaluated(group.id, {
      supervisorId: this.supervisorId(),
      dni,
      nombres: String(formData.get('nombres') ?? '').trim(),
      categoriaId: categoryId,
      placa: String(formData.get('placa') ?? '').trim()
    }).subscribe({
      next: (updatedGroup) => {
        this.isSubmitting.set(false);
        this.setActiveGroup(updatedGroup);
        this.loadGroups();
        this.successMessage.set('Evaluado registrado correctamente.');
        this.placaSearchTerm.set('');
        this.scannedDni.set('');
        this.selectedSedeId.set(null);
        form.reset();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected startCreatingGroup(): void {
    this.showNewGroupForm.set(true);
    this.newGroupColorId.set(null);
  }

  protected cancelCreatingGroup(): void {
    this.showNewGroupForm.set(false);
    this.newGroupColorId.set(null);
  }

  protected selectNewGroupColor(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.newGroupColorId.set(value ? Number(value) : null);
  }

  protected createGroup(): void {
    if (!this.newGroupColorId()) {
      this.errorMessage.set('Debe seleccionar un color para crear el grupo.');
      return;
    }

    this.clearMessages();
    this.isCreatingGroup.set(true);

    this.supervisorService.createGroup({ supervisorId: this.supervisorId(), colorId: this.newGroupColorId() }).subscribe({
      next: (group) => {
        this.isCreatingGroup.set(false);
        this.showNewGroupForm.set(false);
        this.newGroupColorId.set(null);
        this.setActiveGroup(group);
        this.loadGroups();
        this.successMessage.set(`Grupo ${group.numeroGrupo} creado correctamente.`);
      },
      error: (error: unknown) => {
        this.isCreatingGroup.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected updateGroupColor(event: Event): void {
    const group = this.activeGroup();
    const colorId = Number((event.target as HTMLSelectElement).value);

    if (!group || !colorId || colorId === group.colorId) {
      return;
    }

    this.clearMessages();
    this.isUpdatingColor.set(true);

    this.supervisorService.updateGroupColor(group.id, {
      supervisorId: this.supervisorId(),
      colorId
    }).subscribe({
      next: (updatedGroup) => {
        this.isUpdatingColor.set(false);
        this.setActiveGroup(updatedGroup);
        this.loadGroups();
        this.successMessage.set('Color del grupo actualizado correctamente.');
      },
      error: (error: unknown) => {
        this.isUpdatingColor.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected updateGroupDate(event: Event): void {
    const group = this.activeGroup();
    const dateValue = (event.target as HTMLInputElement).value;

    if (!group || !dateValue) {
      return;
    }

    // Input type datetime-local does not include seconds or timezone, so we append them.
    // The value looks like "2023-10-15T14:30"
    const registradoEn = dateValue.length === 16 ? dateValue + ':00' : dateValue;

    this.clearMessages();
    this.isUpdatingDate.set(true);

    this.supervisorService.updateGroupDate(group.id, {
      supervisorId: this.supervisorId(),
      registradoEn
    }).subscribe({
      next: (updatedGroup) => {
        this.isUpdatingDate.set(false);
        this.setActiveGroup(updatedGroup);
        this.loadGroups();
        this.successMessage.set('Fecha de registro del grupo actualizada correctamente.');
      },
      error: (error: unknown) => {
        this.isUpdatingDate.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected selectGroup(event: Event): void {
    const groupId = Number((event.target as HTMLSelectElement).value);
    if (!groupId) {
      return;
    }

    this.clearMessages();
    this.isChangingGroup.set(true);
    this.supervisorService.getGroup(groupId, this.supervisorId()).subscribe({
      next: (group) => {
        this.setActiveGroup(group);
        this.isChangingGroup.set(false);
      },
      error: (error: unknown) => {
        this.isChangingGroup.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected onSedeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedSedeId.set(val ? Number(val) : null);
  }

  protected onPlacaInput(event: Event): void {
    const placa = (event.target as HTMLInputElement).value;
    this.placaSearchTerm.set(placa);
    this.showPlacaDropdown.set(true);

    const vehicle = this.vehicles().find(v => v.placa.toLowerCase() === placa.trim().toLowerCase());
    if (vehicle) {
      this.selectedSedeId.set(vehicle.sedeId);
    }
  }

  protected onPlacaBlur(): void {
    // Timeout allows click event on dropdown item to fire before dropdown disappears
    setTimeout(() => {
      this.showPlacaDropdown.set(false);
    }, 150);
  }

  protected selectPlaca(placa: string): void {
    this.placaSearchTerm.set(placa);
    this.showPlacaDropdown.set(false);

    const vehicle = this.vehicles().find(v => v.placa === placa);
    if (vehicle) {
      this.selectedSedeId.set(vehicle.sedeId);
    }
  }

  protected finalizeGroup(): void {
    const group = this.activeGroup();
    if (!group) {
      this.errorMessage.set('No existe un grupo activo.');
      return;
    }

    this.clearMessages();
    this.isFinalizing.set(true);

    this.supervisorService.finalizeGroup(group.id, {
      supervisorId: this.supervisorId(),
      observaciones: this.observations()
    }).subscribe({
      next: (updatedGroup) => {
        this.isFinalizing.set(false);
        this.setActiveGroup(updatedGroup);
        this.loadGroups();
        this.successMessage.set('Grupo finalizado correctamente.');
      },
      error: (error: unknown) => {
        this.isFinalizing.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected updateObservations(event: Event): void {
    this.observations.set((event.target as HTMLTextAreaElement).value);
  }

  protected formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(value));
  }

  protected formatTime(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  protected formatDateTimeForInput(value: string | null): string {
    if (!value) {
      return '';
    }

    // datetime-local format is YYYY-MM-DDThh:mm
    // Backend sends ISO string like "2023-10-15T14:30:00" without Z
    return value.substring(0, 16);
  }

  protected formatStatus(value: string): string {
    if (value === 'BORRADOR') {
      return 'En registro';
    }

    if (value === 'FINALIZADO') {
      return 'Finalizado';
    }

    if (value === 'PENDIENTE') {
      return 'Pendiente';
    }

    return value;
  }

  private loadGroups(): void {
    this.supervisorService.getGroups(this.supervisorId()).subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
    });
  }

  private setActiveGroup(group: EvaluatedGroup): void {
    this.activeGroup.set(group);
    this.observations.set(group.observaciones ?? '');
  }

  private supervisorId(): number {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('No existe una sesion activa.');
    }

    return user.usuarioId;
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private resolveError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo completar la operacion.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    return error.error?.message ?? 'No se pudo completar la operacion.';
  }
}
