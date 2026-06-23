import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class TimeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private timeOffset: number = 0;

  public async syncWithServer(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<string>>(`${this.apiUrl}/health/time`));
      if (response.success && response.data) {
        const serverTime = new Date(response.data).getTime();
        const localTime = Date.now();
        this.timeOffset = serverTime - localTime;
        console.log(`Time synced with server. Offset: ${this.timeOffset}ms`);
      }
    } catch (e) {
      console.error('Failed to sync time with server, falling back to local time', e);
      this.timeOffset = 0;
    }
  }

  public getServerDate(): Date {
    return new Date(Date.now() + this.timeOffset);
  }

  public getLocalToday(): string {
    const today = this.getServerDate();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
