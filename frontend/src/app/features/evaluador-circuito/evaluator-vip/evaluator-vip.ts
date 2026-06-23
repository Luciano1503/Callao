import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { EvaluatorSheetSummary } from '../../../core/models/evaluator-sheet';
import { AuthService } from '../../../core/services/auth.service';
import { EvaluatorSheetService } from '../../../core/services/evaluator-sheet.service';
import { TimeService } from '../../../core/services/time.service';
import { WebsocketService } from '../../../core/services/websocket.service';

interface GroupedSheets {
  grupoId: number;
  numeroGrupo: number;
  estadoGrupo: string;
  registradoEn: string;
  sheets: EvaluatorSheetSummary[];
}

@Component({
  selector: 'app-evaluator-vip',
  imports: [],
  templateUrl: './evaluator-vip.html'
})
export class EvaluatorVip implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly evaluatorSheetService = inject(EvaluatorSheetService);
  private readonly timeService = inject(TimeService);
  private readonly websocketService = inject(WebsocketService);

  private wsSubscription: Subscription | null = null;

  protected readonly groupedSheets = signal<GroupedSheets[]>([]);
  protected readonly selectedGroupId = signal<number | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  private getLocalToday(): string {
    return this.timeService.getLocalToday();
  }

  private toLocalDateString(value: string): string {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected readonly filterDate = signal(this.getLocalToday());

  protected updateFilterDate(event: Event): void {
    this.filterDate.set((event.target as HTMLInputElement).value);
    this.selectedGroupId.set(null);
  }

  protected readonly filteredGroups = computed(() => {
    const date = this.filterDate();
    return this.groupedSheets().filter(g => !date || this.toLocalDateString(g.registradoEn) === date);
  });

  protected readonly currentGroup = computed(() => {
    const groupId = this.selectedGroupId();
    if (!groupId) return null;
    return this.groupedSheets().find((g) => g.grupoId === groupId) ?? null;
  });

  ngOnInit(): void {
    this.loadSheets();

    this.websocketService.connect();
    this.wsSubscription = this.websocketService.onVeedoresUpdate().subscribe(() => {
      // Reload on any update to keep lists fresh
      this.loadSheets();
    });
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  private loadSheets(): void {
    this.evaluatorSheetService.getSheets().subscribe({
      next: (sheets) => {
        const groupsMap = new Map<number, GroupedSheets>();

        for (const sheet of sheets) {
          if (!groupsMap.has(sheet.grupoId)) {
            groupsMap.set(sheet.grupoId, {
              grupoId: sheet.grupoId,
              numeroGrupo: sheet.numeroGrupo,
              estadoGrupo: sheet.estadoGrupo,
              registradoEn: sheet.registradoEn,
              sheets: []
            });
          }
          groupsMap.get(sheet.grupoId)!.sheets.push(sheet);
        }

        const groupsArray = Array.from(groupsMap.values()).sort((a, b) => b.numeroGrupo - a.numeroGrupo);
        this.groupedSheets.set(groupsArray);



        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('No se pudieron cargar las fichas de evaluación.');
        this.isLoading.set(false);
      }
    });
  }

  protected selectGroup(event: Event): void {
    const groupId = Number((event.target as HTMLSelectElement).value);
    if (groupId) {
      this.selectedGroupId.set(groupId);
      this.clearMessages();
    } else {
      this.selectedGroupId.set(null);
    }
  }

  protected toggleVip(sheet: EvaluatorSheetSummary, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentUser = this.authService.currentUser();

    if (!currentUser) return;

    this.evaluatorSheetService.toggleVip(sheet.evaluadoId, currentUser.usuarioId, isChecked).subscribe({
      next: () => {
        this.successMessage.set(`Estado VIP actualizado para ${sheet.nombres}.`);
        this.loadSheets();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: () => {
        this.errorMessage.set('Error al actualizar estado VIP.');
        // Revert check state visually
        (event.target as HTMLInputElement).checked = !isChecked;
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
