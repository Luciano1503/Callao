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
import { TimeService } from '../../../core/services/time.service';

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
  private readonly timeService = inject(TimeService);
  private readonly exportService = inject(ExportService);

  protected readonly colors = signal<ColorCatalog[]>([]);
  protected readonly groups = signal<FinalReviewGroup[]>([]);
  protected readonly activeDetail = signal<FinalReviewDetail | null>(null);
  protected readonly results = signal<Record<number, 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO'>>({});
  protected readonly veedorCodes = VEEDOR_CODES;
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly filterGroup = signal('');
  
  private getLocalToday(): string {
    return this.timeService.getLocalToday();
  }
  
  protected readonly filterDate = signal(this.getLocalToday());
  protected readonly filterColor = signal('');
  protected readonly filterStatus = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  
  protected readonly appliedFilters = signal({ group: '', date: this.getLocalToday(), color: '', status: '' });

  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = 10;

  protected readonly groupOptions = computed(() => {
    const numbers = new Set(this.groups().map((g) => g.numeroGrupo));
    return [...numbers].sort((a, b) => a - b);
  });

  protected readonly filteredGroups = computed(() => {
    const { group, date, color, status } = this.appliedFilters();

    return this.groups().filter((item) => {
      const matchesGroup = !group || String(item.numeroGrupo) === group;
      const matchesDate = !date || this.toInputDate(item.registradoEn) === date;
      const matchesColor = !color || String(item.colorId) === color;
      const matchesStatus = !status || item.estado === status;
      return matchesGroup && matchesDate && matchesColor && matchesStatus;
    }).sort((a, b) => a.numeroGrupo - b.numeroGrupo);
  });

  protected readonly paginatedGroups = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredGroups().slice(startIndex, startIndex + this.itemsPerPage);
  });

  protected readonly totalPages = computed(() => {
    return Math.ceil(this.filteredGroups().length / this.itemsPerPage) || 1;
  });

  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pagesList = [];
    const maxVisiblePages = 10;
    const currentGroup = Math.ceil(current / maxVisiblePages);
    const startPage = (currentGroup - 1) * maxVisiblePages + 1;
    const endPage = Math.min(startPage + maxVisiblePages - 1, total);

    for (let i = startPage; i <= endPage; i++) {
      pagesList.push(i);
    }
    return pagesList;
  });

  constructor() {
    this.loadInitialData();
  }

  protected updateFilterGroup(event: Event): void {
    this.filterGroup.set((event.target as HTMLSelectElement).value);
  }

  protected updateFilterDate(event: Event): void {
    this.filterDate.set((event.target as HTMLInputElement).value);
  }

  protected updateFilterColor(event: Event): void {
    this.filterColor.set((event.target as HTMLSelectElement).value);
  }

  protected updateFilterStatus(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
  }

  protected applyFilters(): void {
    this.errorMessage.set('');

    const groupStr = this.filterGroup().trim();
    const dateStr = this.filterDate();

    if (groupStr && !dateStr) {
      const datesForGroup = new Set(
        this.groups()
          .filter(g => String(g.numeroGrupo) === groupStr)
          .map(g => this.toInputDate(g.registradoEn))
      );

      if (datesForGroup.size > 1) {
        this.errorMessage.set(`Hay más de un grupo llamado \"Grupo ${groupStr}\", filtre también por día.`);
        return;
      }
    }

    this.appliedFilters.set({
      group: groupStr,
      date: dateStr,
      color: this.filterColor(),
      status: this.filterStatus()
    });
    this.currentPage.set(1);
    this.activeDetail.set(null);
  }

  protected changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
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
      minute: '2-digit',
      hour12: true
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


  private loadInitialData(): void {
    forkJoin({
      colors: this.catalogService.getColores(),
      groups: this.finalReviewService.getGroups()
    }).subscribe({
      next: ({ colors, groups }) => {
        this.colors.set(colors);
        this.groups.set(groups);
        this.isLoading.set(false);
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
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
