import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucidePlus,
  LucideSearch,
  LucideUsers,
  LucideShieldCheck,
  LucideUserCheck,
  LucideUserX
} from '@lucide/angular';

import { UserResponse } from '../../../core/models/user';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    LucidePlus,
    LucideSearch,
    LucideUsers,
    LucideShieldCheck,
    LucideUserCheck,
    LucideUserX
  ],
  templateUrl: './dashboard.html'
})
export class Dashboard {
  private readonly userService = inject(UserService);

  protected readonly users = signal<UserResponse[]>([]);
  protected readonly isLoading = signal(true);

  protected readonly totalUsers = computed(() => this.users().length);
  protected readonly activeUsers = computed(() => this.users().filter((u) => u.estado === 'ACTIVO').length);
  protected readonly inactiveUsers = computed(() => this.users().filter((u) => u.estado === 'INACTIVO').length);
  protected readonly totalRoles = computed(() => {
    const codigos = new Set(this.users().map((u) => u.rolCodigo));
    return codigos.size;
  });
  protected readonly recentUsers = computed(() =>
    [...this.users()]
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
      .slice(0, 5)
  );

  constructor() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  protected initials(nombres: string): string {
    return nombres.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }
}
