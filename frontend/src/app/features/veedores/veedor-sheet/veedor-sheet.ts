import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideCalendar, LucideClock, LucideSave, LucidePrinter } from '@lucide/angular';
import { Subscription } from 'rxjs';

import { CriterioCatalog } from '../../../core/models/catalog';
import { EvaluatedGroupSummary } from '../../../core/models/evaluated-group';
import { VeedorSheet as VeedorSheetModel, VeedorSheetRow } from '../../../core/models/veedor-sheet';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ExportService } from '../../../core/services/export.service';
import { VeedorSheetService } from '../../../core/services/veedor-sheet.service';
import { WebsocketService } from '../../../core/services/websocket.service';

interface VeedorType {
  route: string;
  label: string;
}

interface VeedorRow {
  evaluadoGrupoId: number;
  index: number;
  dni: string;
  name: string;
  category: string;
  plate: string | null;
  result: string;
  esVip: boolean;
  skills: number[];
  regulations: number[];
  observation: string | null;
}

const VEEDORES: VeedorType[] = [
  { route: 'torre-posterior', label: 'Torre Posterior' },
  { route: 'torre-frontal', label: 'Torre Frontal' },
  { route: 'estacionamiento-paralelo', label: 'Estacionamiento Paralelo' },
  { route: 'estacionamiento-diagonal', label: 'Estacionamiento Diagonal' }
];

@Component({
  selector: 'app-veedor-sheet',
  imports: [LucideCalendar, LucideClock, LucideSave, LucidePrinter],
  templateUrl: './veedor-sheet.html'
})
export class VeedorSheet implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly veedorSheetService = inject(VeedorSheetService);
  private readonly exportService = inject(ExportService);
  private readonly websocketService = inject(WebsocketService);
  private wsSubscription: Subscription | null = null;

  protected position: VeedorType = VEEDORES[0];
  protected readonly skillOptions = signal<CriterioCatalog[]>([]);
  protected readonly regulationOptions = signal<CriterioCatalog[]>([]);
  protected readonly sheet = signal<VeedorSheetModel | null>(null);
  protected readonly groups = signal<EvaluatedGroupSummary[]>([]);
  protected readonly rows = signal<VeedorRow[]>([]);
  protected readonly observations = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isChangingGroup = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly String = String;
  protected readonly isReadOnly = computed(() => {
    const sheet = this.sheet();
    if (!sheet) return true;
    return sheet.estadoGrupo === 'FINALIZADO' || sheet.estadoFicha === 'FINALIZADO';
  });

  constructor(route: ActivatedRoute) {
    route.paramMap.subscribe((params) => {
      const type = params.get('tipo') ?? 'torre-posterior';
      this.position = VEEDORES.find((item) => item.route === type) ?? VEEDORES[0];
      this.loadCriteria(this.position.route);
      this.loadSheet(this.position.route);
    });
    this.loadGroups();

    this.websocketService.connect();
    this.wsSubscription = this.websocketService.onVeedoresUpdate().subscribe((data: any) => {
      const sheet = this.sheet();
      const groupId = data.grupo?.id || data.id;
      if (sheet && sheet.grupoId === groupId) {
        this.loadSheet(this.position.route);
      }
      this.loadGroups(); // Also reload groups for side menu summary
    });
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  private loadCriteria(route: string): void {
    this.catalogService.getCriteriosVeedor(route).subscribe((criteria) => {
      this.skillOptions.set(criteria.habilidades);
      this.regulationOptions.set(criteria.reglamentos);
    });
  }

  protected selectedLabels(selected: number[], options: CriterioCatalog[]): string[] {
    if (options.length === 0) {
      return [];
    }

    const siglasById = new Map(options.map((option) => [option.id, option.siglas]));
    return selected
      .map((id) => siglasById.get(id))
      .filter((siglas): siglas is string => !!siglas);
  }

  protected toggleCriterion(rowIndex: number, field: 'skills' | 'regulations', criterionId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.rows.update((rows) =>
      rows.map((row) => {
        if (row.index !== rowIndex) {
          return row;
        }

        const currentValues = new Set(row[field]);
        if (checked) {
          currentValues.add(criterionId);
        } else {
          currentValues.delete(criterionId);
        }

        return {
          ...row,
          [field]: Array.from(currentValues)
        };
      })
    );
    this.silentSaveSheet();
  }

  protected updateObservations(event: Event): void {
    this.observations.set((event.target as HTMLTextAreaElement).value);
    this.silentSaveSheet();
  }

  protected saveSheet(): void {
    const sheet = this.sheet();
    const currentUser = this.authService.currentUser();

    if (!sheet || !currentUser) {
      return;
    }

    this.clearMessages();
    this.isSaving.set(true);

    this.veedorSheetService.saveSheet(this.position.route, {
      veedorId: currentUser.usuarioId,
      grupoId: sheet.grupoId,
      observaciones: this.observations(),
      finalizado: true,
      evaluados: this.rows().map((row) => ({
        evaluadoGrupoId: row.evaluadoGrupoId,
        observacion: row.observation,
        habilidadIds: row.skills,
        reglamentoIds: row.regulations
      }))
    }).subscribe({
      next: (updatedSheet) => {
        this.isSaving.set(false);
        this.applySheet(updatedSheet);
        this.successMessage.set('Ficha guardada correctamente.');
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  private silentSaveSheet(): void {
    const sheet = this.sheet();
    const currentUser = this.authService.currentUser();

    if (!sheet || !currentUser) {
      return;
    }

    this.veedorSheetService.saveSheet(this.position.route, {
      veedorId: currentUser.usuarioId,
      grupoId: sheet.grupoId,
      observaciones: this.observations(),
      finalizado: false,
      evaluados: this.rows().map((row) => ({
        evaluadoGrupoId: row.evaluadoGrupoId,
        observacion: row.observation,
        habilidadIds: row.skills,
        reglamentoIds: row.regulations
      }))
    }).subscribe({
      next: (updatedSheet) => {
        this.sheet.set(updatedSheet);
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
    this.veedorSheetService.getSheet(this.position.route, groupId).subscribe({
      next: (sheet) => {
        this.applySheet(sheet);
        this.isChangingGroup.set(false);
      },
      error: (error: unknown) => {
        this.isChangingGroup.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
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

  protected formatStatus(value: string): string {
    if (value === 'PENDIENTE') {
      return 'Pendiente';
    }

    if (value === 'APROBADO') {
      return 'Aprobado';
    }

    if (value === 'DESAPROBADO') {
      return 'Desaprobado';
    }

    return value;
  }

  private loadSheet(route: string): void {
    this.isLoading.set(true);
    this.clearMessages();

    this.veedorSheetService.getCurrentSheet(route).subscribe({
      next: (sheet) => {
        this.applySheet(sheet);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  private loadGroups(): void {
    this.veedorSheetService.getGroups().subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
    });
  }

  private applySheet(sheet: VeedorSheetModel): void {
    this.sheet.set(sheet);
    this.observations.set(sheet.observaciones ?? '');
    this.rows.set(sheet.evaluados.map((row) => this.toViewRow(row)));
  }

  private toViewRow(row: VeedorSheetRow): VeedorRow {
    return {
      evaluadoGrupoId: row.evaluadoGrupoId,
      index: row.numeroFila,
      dni: row.dni,
      name: row.nombres,
      category: row.categoriaCodigo,
      plate: row.placa,
      result: row.resultadoFinal,
      esVip: row.esVip,
      skills: row.habilidadIds,
      regulations: row.reglamentoIds,
      observation: row.observacion
    };
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

  protected printSheet(): void {
    const s = this.sheet();
    if (s) {
      this.exportService.exportVeedorSheetToPdf(s, this.skillOptions(), this.regulationOptions());
    }
  }
}
