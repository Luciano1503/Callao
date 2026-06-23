import { Injectable, inject } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvaluatedGroup } from '../models/evaluated-group';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client: Client;
  private connectionSubject = new Subject<boolean>();
  private veedoresSubject = new Subject<EvaluatedGroup>();

  public onConnectionChange(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  constructor() {
    this.client = new Client({
      brokerURL: `${environment.apiUrl.replace('/api/v1', '').replace('http', 'ws')}/ws-api/websocket`,
      debug: (msg: string) => {
        // console.log(msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.connectionSubject.next(true);
      this.client.subscribe('/topic/veedores', (message) => {
        if (message.body) {
          try {
            const data = JSON.parse(message.body);
            this.veedoresSubject.next(data);
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.connectionSubject.next(false);
    };
  }

  public connect(): void {
    if (!this.client.active) {
      const rawSession = sessionStorage.getItem('callao.auth.session');
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          this.client.connectHeaders = {
            Authorization: `Bearer ${session.token}`
          };
        } catch (e) {
          console.error('Error parsing session for WS token', e);
        }
      }
      this.client.activate();
    }
  }

  public disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  public onVeedoresUpdate(): Observable<EvaluatedGroup> {
    return this.veedoresSubject.asObservable();
  }
}
