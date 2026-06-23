import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, fromEvent, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScannerService implements OnDestroy {
  // Observable al que los componentes se suscribirán para recibir el DNI escaneado
  private scanSubject = new Subject<string>();
  public scan$ = this.scanSubject.asObservable();
  
  private buffer: string = '';
  private lastKeyTime: number = 0;
  
  // Algunos lectores son un poco más "lentos" mandando las teclas.
  // Aumentamos a 70ms para asegurarnos de que atrape todos los modelos.
  private readonly THRESHOLD_MS = 70; 
  private subscription?: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Solo inicializar si estamos en el navegador (no en Server-Side Rendering)
    if (isPlatformBrowser(this.platformId)) {
      this.initScannerListener();
    }
  }

  private initScannerListener() {
    this.subscription = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(event => {
          if (!event || !event.key) return false;
          return event.key.length === 1 || event.key === 'Enter';
        })
      )
      .subscribe({
        next: (event: KeyboardEvent) => {
          try {
            const currentTime = new Date().getTime();
            
            if (currentTime - this.lastKeyTime > this.THRESHOLD_MS) {
              this.buffer = '';
            }
            
            if (event.key === 'Enter') {
              if (this.buffer.length >= 8) {
                 const scannedData = this.buffer;
                 const extractedDni = this.extractDni(scannedData);
                 if (extractedDni) {
                   console.log('[ScannerService] Emitiendo DNI:', extractedDni);
                   this.scanSubject.next(extractedDni);
                 } else {
                   console.warn('[ScannerService] Buffer no contenía DNI válido:', scannedData);
                 }
              }
              this.buffer = '';
            } else {
              this.buffer += event.key;
            }

            this.lastKeyTime = currentTime;
          } catch (e) {
            console.error('[ScannerService] Error procesando tecla:', e);
            this.buffer = ''; // Reiniciar el buffer en caso de error para no quedarnos atascados
          }
        },
        error: (err) => console.error('[ScannerService] Ocurrió un error fatal en la suscripción:', err),
        complete: () => console.warn('[ScannerService] ¡La suscripción al teclado se cerró inesperadamente!')
      });
  }

  /**
   * Lógica para limpiar la lectura. 
   * Extrae los 8 números consecutivos que encuentre, ignorando el resto de basura.
   */
  private extractDni(rawData: string): string | null {
    // Busca el primer bloque de exactamente 8 dígitos dentro de todo lo que leyó el escáner
    const match = rawData.match(/\d{8}/);
    if (match) {
        return match[0]; // Retorna los 8 dígitos encontrados
    }
    
    // Si no encuentra 8 dígitos, asume que fue un escaneo inválido o de otro código
    return null; 
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
