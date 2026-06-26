import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { VipRegistryService, VipRegistry } from './vip-registry.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-vip-registry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vip-registry.html',
  styleUrls: ['./vip-registry.scss']
})
export class VipRegistryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vipService = inject(VipRegistryService);
  private scannerService = inject(ScannerService);
  private cdr = inject(ChangeDetectorRef);

  vipForm: FormGroup;
  vips: VipRegistry[] = [];
  isLoading = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;

  constructor() {
    this.vipForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      nombres: ['', [Validators.required, Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ\\s]+$')]]
    });

    this.scannerService.scan$.pipe(takeUntilDestroyed()).subscribe((dni) => {
      this.vipForm.patchValue({ dni });
    });
  }

  get filteredVips(): VipRegistry[] {
    if (!this.searchTerm) return this.vips;
    const term = this.searchTerm.toLowerCase();
    return this.vips.filter(vip => 
      vip.dni.toLowerCase().includes(term) || 
      vip.nombres.toLowerCase().includes(term)
    );
  }

  get paginatedVips(): VipRegistry[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVips.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredVips.length / this.itemsPerPage);
  }

  get pages(): number[] {
    const pages = [];
    const maxVisiblePages = 10;
    const currentGroup = Math.ceil(this.currentPage / maxVisiblePages);
    const startPage = (currentGroup - 1) * maxVisiblePages + 1;
    const endPage = Math.min(startPage + maxVisiblePages - 1, this.totalPages);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  ngOnInit(): void {
    this.loadVips();
  }

  loadVips(): void {
    this.isLoading = true;
    
    this.vipService.findAll().subscribe({
      next: (res) => {
        console.log('VIPs loaded:', res);
        if (res.success && res.data) {
          this.vips = res.data;
          if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading VIPs:', err);
        this.errorMessage = 'Error al cargar los registros VIP.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.vipForm.invalid) {
      this.vipForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const req = this.vipForm.value;

    this.vipService.register(req).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.successMessage = 'Usuario VIP registrado correctamente.';
          this.vipForm.reset();
          this.loadVips();
        }
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al registrar VIP.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteVip(dni: string): void {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el DNI ${dni} del registro VIP?`)) {
      this.vipService.delete(dni).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = 'Registro eliminado correctamente.';
            this.loadVips();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al eliminar VIP.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
