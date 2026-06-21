import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideListFilter, LucideSearch } from '@lucide/angular';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { SupervisorEvaluadosService } from '../../../core/services/supervisor-evaluados.service';
import { SupervisorConsulta } from '../../../core/models/evaluated-group';

@Component({
  selector: 'app-supervisor-consultas',
  standalone: true,
  imports: [FormsModule, LucideListFilter, LucideSearch],
  templateUrl: './supervisor-consultas.html',
  styleUrls: ['./supervisor-consultas.css']
})
export class SupervisorConsultas {
  private readonly authService = inject(AuthService);
  private readonly supervisorService = inject(SupervisorEvaluadosService);

  protected readonly consultas = signal<SupervisorConsulta[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  // Local filter models (bound to inputs)
  protected readonly filterDni = signal('');
  protected readonly filterName = signal('');
  protected readonly filterGrupo = signal('');
  protected readonly filterPlaca = signal('');
  protected readonly filterDateGroup = signal('');
  protected readonly filterDateUser = signal('');
  protected readonly filterState = signal('');

  // Applied filters (used for computation)
  protected readonly appliedFilters = signal({
    dni: '',
    name: '',
    grupo: '',
    placa: '',
    dateGroup: '',
    dateUser: '',
    state: ''
  });

  protected readonly filteredConsultas = computed(() => {
    const filters = this.appliedFilters();
    
    // Return empty if no filters are active
    if (!filters.dni && !filters.name && !filters.grupo && !filters.placa && !filters.dateGroup && !filters.dateUser && !filters.state) {
      return [];
    }

    return this.consultas().filter((item) => {
      const matchDni = !filters.dni || item.dni.includes(filters.dni);
      const matchName = !filters.name || item.nombres.toLowerCase().includes(filters.name.toLowerCase());
      const matchGrupo = !filters.grupo || item.numeroGrupo.toString() === filters.grupo;
      const matchPlaca = !filters.placa || (item.placa && item.placa.toLowerCase().includes(filters.placa.toLowerCase()));
      const matchState = !filters.state || item.resultadoFinal === filters.state;
      
      let matchDateGroup = true;
      if (filters.dateGroup) {
        const itemDateGroup = item.registradoEn.split('T')[0];
        matchDateGroup = itemDateGroup === filters.dateGroup;
      }

      let matchDateUser = true;
      if (filters.dateUser) {
        const itemDateUser = item.creadoEn.split('T')[0];
        matchDateUser = itemDateUser === filters.dateUser;
      }

      return matchDni && matchName && matchGrupo && matchPlaca && matchState && matchDateGroup && matchDateUser;
    });
  });

  constructor() {
    this.loadConsultas();
  }

  protected updateFilter(key: 'filterDni' | 'filterName' | 'filterGrupo' | 'filterPlaca' | 'filterDateGroup' | 'filterDateUser' | 'filterState', value: string): void {
    this[key].set(value);
  }

  protected applyFilters(): void {
    this.appliedFilters.set({
      dni: this.filterDni().trim(),
      name: this.filterName().trim(),
      grupo: this.filterGrupo().trim(),
      placa: this.filterPlaca().trim(),
      dateGroup: this.filterDateGroup(),
      dateUser: this.filterDateUser(),
      state: this.filterState()
    });
  }

  protected clearFilters(): void {
    this.filterDni.set('');
    this.filterName.set('');
    this.filterGrupo.set('');
    this.filterPlaca.set('');
    this.filterDateGroup.set('');
    this.filterDateUser.set('');
    this.filterState.set('');
    this.applyFilters();
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

  protected formatStatus(value: string): string {
    if (value === 'BORRADOR') return 'En registro';
    if (value === 'FINALIZADO') return 'Finalizado';
    if (value === 'PENDIENTE') return 'Pendiente';
    return value;
  }

  private loadConsultas(): void {
    this.isLoading.set(true);
    this.supervisorService.getConsultas(this.supervisorId()).subscribe({
      next: (data) => {
        this.consultas.set(data);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  private supervisorId(): number {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('No existe una sesion activa.');
    }
    return user.usuarioId;
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
