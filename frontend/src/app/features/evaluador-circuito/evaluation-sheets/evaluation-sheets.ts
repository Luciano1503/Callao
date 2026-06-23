import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { LucideEye, LucideListFilter, LucidePencil, LucideSave, LucideSearch } from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { CategoriaCatalog, CriterioCatalog, VeedorCriteriosCatalog } from '../../../core/models/catalog';
import { EvaluatorSheetDetail, EvaluatorSheetSummary, EvaluatorVeedorReview } from '../../../core/models/evaluator-sheet';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { EvaluatorSheetService } from '../../../core/services/evaluator-sheet.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type DetailMode = 'view' | 'edit';
type CriteriaKind = 'habilidad' | 'reglamento';

interface EditableReviewState {
  tipoVeedorCodigo: string;
  observacionEvaluado: string;
  habilidadIds: number[];
  reglamentoIds: number[];
}

@Component({
  selector: 'app-evaluation-sheets',
  imports: [LucideEye, LucideListFilter, LucidePencil, LucideSave, LucideSearch],
  templateUrl: './evaluation-sheets.html'
})
export class EvaluationSheets {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly evaluatorService = inject(EvaluatorSheetService);
  private readonly scannerService = inject(ScannerService);

  protected readonly categories = signal<CategoriaCatalog[]>([]);
  protected readonly sheets = signal<EvaluatorSheetSummary[]>([]);
  protected readonly criteriaByVeedor = signal<Record<string, VeedorCriteriosCatalog>>({});
  protected readonly selectedDetail = signal<EvaluatorSheetDetail | null>(null);
  protected readonly detailMode = signal<DetailMode>('view');
  protected readonly editReviews = signal<Record<string, EditableReviewState>>({});
  protected readonly circuitObservations = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isDetailLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly filterDni = signal('');
  protected readonly filterName = signal('');
  protected readonly filterGroup = signal('');
  protected readonly filterCategory = signal('');
  protected readonly appliedFilters = signal({ dni: '', name: '', group: '', category: '' });

  protected readonly filteredSheets = computed(() => {
    const { dni, name, group, category } = this.appliedFilters();

    // Si no hay ningun filtro aplicado, retornamos vacio para no mostrar la sabana de datos
    if (!dni && !name && !group && !category) {
      return [];
    }

    return this.sheets().filter((sheet) => {
      const matchesDni = !dni || sheet.dni.toLowerCase().includes(dni);
      const matchesName = !name || sheet.nombres.toLowerCase().includes(name);
      const matchesGroup = !group || String(sheet.numeroGrupo) === group;
      const matchesCategory = !category || String(sheet.categoriaId) === category;

      return matchesDni && matchesName && matchesGroup && matchesCategory;
    });
  });

  protected readonly groupOptions = computed(() => {
    const numbers = new Set(this.sheets().map((sheet) => sheet.numeroGrupo));
    return [...numbers].sort((first, second) => first - second);
  });

  protected readonly pendingCount = computed(() => this.sheets().filter((sheet) => this.canEdit(sheet)).length);

  constructor() {
    forkJoin({
      categories: this.catalogService.getCategorias(),
      sheets: this.evaluatorService.getSheets(),
      torrePosterior: this.catalogService.getCriteriosVeedor('TORRE_POSTERIOR'),
      torreFrontal: this.catalogService.getCriteriosVeedor('TORRE_FRONTAL'),
      paralelo: this.catalogService.getCriteriosVeedor('ESTACIONAMIENTO_PARALELO'),
      diagonal: this.catalogService.getCriteriosVeedor('ESTACIONAMIENTO_DIAGONAL')
    }).subscribe({
      next: ({ categories, sheets, torrePosterior, torreFrontal, paralelo, diagonal }) => {
        this.categories.set(categories);
        this.sheets.set(sheets);
        this.criteriaByVeedor.set({
          [torrePosterior.tipoVeedorCodigo]: torrePosterior,
          [torreFrontal.tipoVeedorCodigo]: torreFrontal,
          [paralelo.tipoVeedorCodigo]: paralelo,
          [diagonal.tipoVeedorCodigo]: diagonal
        });
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });

    this.scannerService.scan$.pipe(takeUntilDestroyed()).subscribe((dni) => {
      this.filterDni.set(dni);
      this.applyFilters();
    });
  }

  protected updateFilter(field: 'dni' | 'name' | 'group' | 'category', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;

    if (field === 'dni') {
      this.filterDni.set(value);
    } else if (field === 'name') {
      this.filterName.set(value);
    } else if (field === 'group') {
      this.filterGroup.set(value);
    } else {
      this.filterCategory.set(value);
    }
  }

  protected applyFilters(): void {
    this.appliedFilters.set({
      dni: this.filterDni().trim().toLowerCase(),
      name: this.filterName().trim().toLowerCase(),
      group: this.filterGroup(),
      category: this.filterCategory()
    });
  }

  protected clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  protected openView(sheet: EvaluatorSheetSummary): void {
    this.openDetail(sheet, 'view');
  }

  protected openEdit(sheet: EvaluatorSheetSummary): void {
    if (!this.canEdit(sheet)) {
      this.errorMessage.set('La ficha ya fue finalizada por el administrador.');
      return;
    }

    this.openDetail(sheet, 'edit');
  }

  protected closeDetail(): void {
    this.selectedDetail.set(null);
    this.editReviews.set({});
    this.circuitObservations.set('');
  }

  protected switchToEdit(): void {
    this.detailMode.set('edit');
  }

  protected saveDetail(): void {
    const detail = this.selectedDetail();
    const user = this.authService.currentUser();

    if (!detail || !user) {
      this.errorMessage.set('No existe una sesion activa.');
      return;
    }

    if (!this.canEdit(detail.ficha)) {
      this.errorMessage.set('La ficha ya fue finalizada por el administrador.');
      return;
    }

    const edits = this.editReviews();
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.evaluatorService.updateSheet(detail.ficha.evaluadoId, {
      evaluadorId: user.usuarioId,
      observaciones: this.circuitObservations().trim() || null,
      revisiones: detail.revisiones
        .filter((review) => !!review.fichaId)
        .map((review) => {
          const edit = edits[review.tipoVeedorCodigo];
          return {
            tipoVeedorCodigo: review.tipoVeedorCodigo,
            observacionEvaluado: edit?.observacionEvaluado?.trim() || null,
            habilidadIds: edit?.habilidadIds ?? [],
            reglamentoIds: edit?.reglamentoIds ?? []
          };
        })
    }).subscribe({
      next: (updatedDetail) => {
        this.isSaving.set(false);
        this.selectedDetail.set(updatedDetail);
        this.detailMode.set('view');
        this.buildEditState(updatedDetail);
        this.circuitObservations.set(updatedDetail.ficha.observacionesCircuito ?? '');
        this.loadSheets();
        this.successMessage.set('Ficha actualizada correctamente.');
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected updateCircuitObservations(event: Event): void {
    this.circuitObservations.set((event.target as HTMLTextAreaElement).value);
  }

  protected updateReviewObservation(tipoVeedor: string, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.editReviews.update((reviews) => ({
      ...reviews,
      [tipoVeedor]: {
        ...reviews[tipoVeedor],
        observacionEvaluado: value
      }
    }));
  }

  protected toggleCriterion(tipoVeedor: string, kind: CriteriaKind, criterionId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.editReviews.update((reviews) => {
      const current = reviews[tipoVeedor];
      if (!current) {
        return reviews;
      }

      const key = kind === 'habilidad' ? 'habilidadIds' : 'reglamentoIds';
      const selected = new Set(current[key]);
      if (checked) {
        selected.add(criterionId);
      } else {
        selected.delete(criterionId);
      }

      return {
        ...reviews,
        [tipoVeedor]: {
          ...current,
          [key]: [...selected]
        }
      };
    });
  }

  protected isSelected(tipoVeedor: string, kind: CriteriaKind, criterionId: number): boolean {
    const review = this.editReviews()[tipoVeedor];
    if (!review) {
      return false;
    }

    return kind === 'habilidad'
      ? review.habilidadIds.includes(criterionId)
      : review.reglamentoIds.includes(criterionId);
  }

  protected criteriaFor(tipoVeedor: string, kind: CriteriaKind): CriterioCatalog[] {
    const catalog = this.criteriaByVeedor()[tipoVeedor];
    if (!catalog) {
      return [];
    }

    return kind === 'habilidad' ? catalog.habilidades : catalog.reglamentos;
  }

  protected canEdit(sheet: EvaluatorSheetSummary): boolean {
    return sheet.estadoGrupo !== 'FINALIZADO' && sheet.resultadoFinal === 'PENDIENTE';
  }

  protected reviewIsRegistered(review: EvaluatorVeedorReview): boolean {
    return !!review.fichaId;
  }

  protected statusLabel(value: string): string {
    if (value === 'PENDIENTE') {
      return 'En proceso';
    }

    if (value === 'APROBADO') {
      return 'Aprobado';
    }

    if (value === 'DESAPROBADO') {
      return 'Desaprobado';
    }

    if (value === 'FINALIZADO') {
      return 'Finalizada';
    }

    return value;
  }

  protected statusClass(value: string): string {
    if (value === 'APROBADO' || value === 'FINALIZADO') {
      return 'success';
    }

    if (value === 'DESAPROBADO') {
      return 'danger';
    }

    return 'warning';
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

  protected siglas(criteria: CriterioCatalog[] | { siglas: string }[]): string {
    return criteria.map((criterion) => criterion.siglas).join(', ');
  }

  private openDetail(sheet: EvaluatorSheetSummary, mode: DetailMode): void {
    this.clearMessages();
    this.selectedDetail.set(null);
    this.editReviews.set({});
    this.isDetailLoading.set(true);
    this.detailMode.set(mode);

    this.evaluatorService.getDetail(sheet.evaluadoId).subscribe({
      next: (detail) => {
        this.isDetailLoading.set(false);
        this.selectedDetail.set(detail);
        this.circuitObservations.set(detail.ficha.observacionesCircuito ?? '');
        this.buildEditState(detail);
      },
      error: (error: unknown) => {
        this.isDetailLoading.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  private buildEditState(detail: EvaluatorSheetDetail): void {
    const reviews: Record<string, EditableReviewState> = {};
    for (const review of detail.revisiones) {
      reviews[review.tipoVeedorCodigo] = {
        tipoVeedorCodigo: review.tipoVeedorCodigo,
        observacionEvaluado: review.observacionEvaluado ?? '',
        habilidadIds: review.habilidades.map((criterion) => criterion.id),
        reglamentoIds: review.reglamentos.map((criterion) => criterion.id)
      };
    }

    this.editReviews.set(reviews);
  }

  private loadSheets(): void {
    this.evaluatorService.getSheets().subscribe({
      next: (sheets) => this.sheets.set(sheets),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
    });
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
