import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import { ApiService } from '../../core/services/api.service';

interface HealthData {
  status: string;
  application: string;
  timestamp: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  protected readonly apiStatus = signal('Pendiente');
  protected readonly application = signal('Callao Backend');
  protected readonly checkedAt = signal('Sin lectura');

  private readonly api = inject(ApiService);

  ngOnInit(): void {
    this.api.get<HealthData>('/health').subscribe({
      next: (response) => {
        this.apiStatus.set(response.data.status);
        this.application.set(response.data.application);
        this.checkedAt.set(new Date(response.data.timestamp).toLocaleString());
      },
      error: () => {
        this.apiStatus.set('Sin conexion');
      }
    });
  }
}
