import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { FinalReviewDetail } from '../models/final-review';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly LOGO_PATH = '/assets/gobiernocallao.jpeg';

  async exportToPdf(detail: FinalReviewDetail): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header setup
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Title
    doc.rect(10, 10, 190, 40); // Main boundary
    doc.text('RELACIÓN DE EVALUADOS', 105, 18, { align: 'center' });

    // Group box
    doc.setFontSize(12);
    doc.text('GRUPO', 20, 30);
    doc.rect(40, 20, 25, 20); // Group number box
    doc.setFontSize(20);
    doc.text(detail.grupo.numeroGrupo.toString(), 52.5, 34, { align: 'center' });

    // Date/Time/Color
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 140, 25);
    doc.text('HORA:', 140, 32);
    doc.text('COLOR:', 140, 39);

    doc.setFont('helvetica', 'normal');
    doc.line(155, 26, 195, 26);
    doc.line(155, 33, 195, 33);
    doc.line(155, 40, 195, 40);

    // Format registered date
    const dateObj = new Date(detail.grupo.registradoEn);
    const dateStr = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(dateObj);
    const timeStr = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(dateObj);
    
    doc.text(dateStr, 175, 25, { align: 'center' });
    doc.text(timeStr, 175, 32, { align: 'center' });
    doc.text(detail.grupo.colorNombre, 175, 39, { align: 'center' });

    // Try loading and drawing the logo
    try {
      const imgData = await this.loadImage(this.LOGO_PATH);
      doc.addImage(imgData, 'JPEG', 85, 22, 30, 25);
    } catch (e) {
      console.warn('No se pudo cargar el logo', e);
      // Fallback
      doc.setFontSize(8);
      doc.text('GOBIERNO', 100, 30, { align: 'center' });
      doc.text('REGIONAL', 100, 34, { align: 'center' });
      doc.text('DEL CALLAO', 100, 38, { align: 'center' });
    }

    // Table Data
    const tableBody = detail.evaluados.map((person) => {
      // Logic for determining "A" or "D"
      // Based on the image, the last column is typically the result
      let letter = '';
      if (person.resultadoFinal === 'APROBADO') letter = 'A';
      if (person.resultadoFinal === 'DESAPROBADO') letter = 'D';

      return [
        person.numeroFila.toString(),
        person.nombres,
        person.numeroFila.toString(), // The second N column seen in the image
        person.dni,
        person.categoriaCodigo,
        person.placa || '',
        letter
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['N°', 'APELLIDOS Y NOMBRES', 'N°', 'D.N.I', 'CATEGORIA', 'PLACA', '']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 10,
        font: 'helvetica',
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 10 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 10, fontStyle: 'bold', textColor: [0, 51, 153] } // Emulate blue pen
      },
      margin: { top: 50, left: 10, right: 10 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;

    // Footer
    const footerStartY = finalY + 10;
    
    // Observations
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.rect(10, footerStartY, 190, 40); // Observation box
    doc.text('Observaciones:', 12, footerStartY + 5);

    // Signatures
    const sigY = footerStartY + 30;
    doc.line(20, sigY, 60, sigY);
    doc.line(75, sigY, 135, sigY);
    doc.line(150, sigY, 190, sigY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Evaluador', 40, sigY + 5, { align: 'center' });
    
    doc.text('GOBIERNO REGIONAL DEL CALLAO', 105, sigY + 3, { align: 'center' });
    doc.text('Coordinador', 105, sigY + 8, { align: 'center' });
    
    doc.text('Supervisor', 170, sigY + 5, { align: 'center' });

    doc.save(`Grupo_${detail.grupo.numeroGrupo}_Evaluados.pdf`);
  }

  exportToExcel(detail: FinalReviewDetail): void {
    const data = detail.evaluados.map(person => {
      let observaciones = '';
      if (person.revisiones && person.revisiones.length > 0) {
        observaciones = person.revisiones.map(rev => {
          const name = rev.tipoVeedorCodigo.replace('_', ' ');
          const habs = rev.habilidades.length > 0 ? `Habilidades: ${rev.habilidades.join(', ')}` : '';
          const regs = rev.reglamentos.length > 0 ? `Reglamentos: ${rev.reglamentos.join(', ')}` : '';
          const details = [habs, regs].filter(Boolean).join(' | ');
          return details ? `${name} (${details})` : `${name} (Sin observaciones)`;
        }).join('\n');
      } else {
        observaciones = 'Sin observaciones registradas';
      }

      return {
        'N°': person.numeroFila,
        'APELLIDOS Y NOMBRES': person.nombres,
        'D.N.I': person.dni,
        'CATEGORIA': person.categoriaCodigo,
        'PLACA': person.placa || '',
        'OBSERVACIONES (VEEDORES)': observaciones,
        'RESULTADO': person.resultadoFinal === 'APROBADO' ? 'A' : (person.resultadoFinal === 'DESAPROBADO' ? 'D' : '')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Grupo ${detail.grupo.numeroGrupo}`);

    // Adjust column widths
    worksheet['!cols'] = [
      { wch: 5 },  // N°
      { wch: 40 }, // Nombres
      { wch: 12 }, // DNI
      { wch: 15 }, // Categoria
      { wch: 12 }, // Placa
      { wch: 50 }, // Observaciones
      { wch: 10 }  // Resultado
    ];

    XLSX.writeFile(workbook, `Grupo_${detail.grupo.numeroGrupo}_Evaluados.xlsx`);
  }

  private loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('Failed to create canvas context'));
        }
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }
}
