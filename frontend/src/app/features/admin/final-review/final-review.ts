import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  LucideChevronRight,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideListFilter,
  LucideLock,
  LucideSave
} from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { ColorCatalog } from '../../../core/models/catalog';
import { FinalReviewDetail, FinalReviewGroup, FinalReviewPerson } from '../../../core/models/final-review';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ExportService } from '../../../core/services/export.service';
import { FinalReviewService } from '../../../core/services/final-review.service';

const VEEDOR_CODES = [
  'TORRE_POSTERIOR',
  'TORRE_FRONTAL',
  'ESTACIONAMIENTO_PARALELO',
  'ESTACIONAMIENTO_DIAGONAL'
];

@Component({
  selector: 'app-final-review',
  imports: [LucideChevronRight, LucideFileSpreadsheet, LucideFileText, LucideListFilter, LucideLock, LucideSave],
  templateUrl: './final-review.html'
})
export class FinalReview {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly finalReviewService = inject(FinalReviewService);
  private readonly exportService = inject(ExportService);

  protected readonly colors = signal<ColorCatalog[]>([]);
  protected readonly groups = signal<FinalReviewGroup[]>([]);
  protected readonly activeDetail = signal<FinalReviewDetail | null>(null);
  protected readonly results = signal<Record<number, 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO'>>({});
  protected readonly veedorCodes = VEEDOR_CODES;
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly groupFilter = signal('');
  protected readonly dateFilter = signal('');
  protected readonly colorFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly filteredGroups = computed(() => {
    const group = this.groupFilter();
    const date = this.dateFilter();
    const color = this.colorFilter();
    const status = this.statusFilter();

    return this.groups().filter((item) => {
      const matchesGroup = !group || item.id === Number(group);
      const matchesDate = !date || this.toInputDate(item.registradoEn) === date;
      const matchesColor = !color || item.colorId === Number(color);
      const matchesStatus = !status || item.estado === status;
      return matchesGroup && matchesDate && matchesColor && matchesStatus;
    });
  });

  constructor() {
    this.loadInitialData();
  }

  protected updateGroupFilter(event: Event): void {
    this.groupFilter.set((event.target as HTMLSelectElement).value);
  }

  protected updateDateFilter(event: Event): void {
    this.dateFilter.set((event.target as HTMLInputElement).value);
  }

  protected updateColorFilter(event: Event): void {
    this.colorFilter.set((event.target as HTMLSelectElement).value);
  }

  protected updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  protected selectGroup(group: FinalReviewGroup): void {
    this.clearMessages();
    this.finalReviewService.getGroupDetail(group.id).subscribe({
      next: (detail) => this.setDetail(detail),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
    });
  }

  protected updateResult(person: FinalReviewPerson, event: Event): void {
    const result = (event.target as HTMLSelectElement).value as 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO';
    this.results.update((results) => ({
      ...results,
      [person.id]: result
    }));
  }

  protected finalizeEvaluation(): void {
    const detail = this.activeDetail();
    const currentUser = this.authService.currentUser();
    if (!detail || !currentUser) {
      return;
    }

    this.clearMessages();
    this.isSaving.set(true);
    this.finalReviewService.finalizeEvaluation(detail.grupo.id, {
      adminId: currentUser.usuarioId,
      resultados: detail.evaluados.map((person) => ({
        evaluadoId: person.id,
        resultadoFinal: this.results()[person.id] ?? person.resultadoFinal
      }))
    }).subscribe({
      next: (updatedDetail) => {
        this.isSaving.set(false);
        this.setDetail(updatedDetail);
        this.loadGroupsOnly();
        this.successMessage.set('Evaluacion finalizada correctamente.');
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected exportPdf(): void {
    const detail = this.activeDetail();
    if (detail) {
      this.exportService.exportToPdf(detail).catch((err) => {
        console.error('Error exportando PDF', err);
        this.errorMessage.set('Ocurrió un error al generar el PDF.');
      });
    }
  }

  protected exportExcel(): void {
    const detail = this.activeDetail();
    if (detail) {
      try {
        this.exportService.exportToExcel(detail);
      } catch (err) {
        console.error('Error exportando Excel', err);
        this.errorMessage.set('Ocurrió un error al generar el Excel.');
      }
    }
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
    if (value === 'EN_REVISION') {
      return 'En revision';
    }

    if (value === 'FINALIZADO') {
      return 'Finalizado';
    }

    return 'Pendiente';
  }

  protected criterionText(values: string[]): string {
    return values.length ? values.join(', ') : '-';
  }

  private loadInitialData(): void {
    forkJoin({
      colors: this.catalogService.getColores(),
      groups: this.finalReviewService.getGroups()
    }).subscribe({
      next: ({ colors, groups }) => {
        this.colors.set(colors);
        this.groups.set(groups);
        this.isLoading.set(false);
        if (groups.length > 0) {
          this.selectGroup(groups[0]);
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  protected loadGroupsOnly(): void {
    this.finalReviewService.getGroups().subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
    });
  }

  private setDetail(detail: FinalReviewDetail): void {
    this.activeDetail.set(detail);
    this.results.set(Object.fromEntries(detail.evaluados.map((person) => [person.id, person.resultadoFinal])));
  }

  private toInputDate(value: string): string {
    return new Date(value).toISOString().slice(0, 10);
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
