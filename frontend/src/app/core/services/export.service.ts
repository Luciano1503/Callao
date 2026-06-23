import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { CriterioCatalog } from '../models/catalog';
import { FinalReviewDetail } from '../models/final-review';
import { VeedorSheet } from '../models/veedor-sheet';
import { CatalogService } from './catalog.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly catalogService = inject(CatalogService);
  private readonly LOGO_PATH = '/assets/gobiernocallao.jpeg';

  private async loadSignatures(firmasRoles: { [key: string]: string }): Promise<{ [key: string]: string }> {
    const loaded: { [key: string]: string } = {};
    for (const [role, url] of Object.entries(firmasRoles)) {
      if (url) {
        try {
          loaded[role] = await this.loadImage(url);
        } catch (e) {
          console.warn(`No se pudo cargar la firma del rol ${role}`);
        }
      }
    }
    return loaded;
  }

  async exportToPdf(detail: FinalReviewDetail): Promise<void> {
    const firmasRoles = await new Promise<{ [key: string]: string }>((resolve) => {
      this.catalogService.getFirmasRoles().subscribe({ next: resolve, error: () => resolve({}) });
    });
    const firmasGrupo = await new Promise<{ [key: string]: string }>((resolve) => {
      this.catalogService.getFirmasGrupo(detail.grupo.id).subscribe({ next: resolve, error: () => resolve({}) });
    });
    const firmasMap = { ...firmasRoles, ...firmasGrupo };
    const firmas = await this.loadSignatures(firmasMap);

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // --- PAGE 1: RELACIÓN DE EVALUADOS (Resumen General) ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    doc.rect(10, 10, 190, 40); 
    doc.text('RELACIÓN DE EVALUADOS', 105, 18, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(200, 0, 0);
    doc.text(`Nº ${String(detail.grupo.numeroGrupo).padStart(6, '0')}`, 175, 18, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(12);
    doc.text('GRUPO', 20, 30);
    doc.rect(40, 20, 25, 20); 
    doc.setFontSize(20);
    doc.text(detail.grupo.numeroGrupo.toString(), 52.5, 34, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 140, 25);
    doc.text('HORA:', 140, 32);
    doc.text('COLOR:', 140, 39);

    doc.setFont('helvetica', 'normal');
    doc.line(155, 26, 195, 26);
    doc.line(155, 33, 195, 33);
    doc.line(155, 40, 195, 40);

    const dateObj = new Date(detail.grupo.registradoEn);
    const dateStr = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(dateObj);
    const timeStr = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(dateObj);
    
    doc.text(dateStr, 175, 25, { align: 'center' });
    doc.text(timeStr, 175, 32, { align: 'center' });
    doc.text(detail.grupo.colorNombre, 175, 39, { align: 'center' });

    let imgData: string | null = null;
    try {
      imgData = await this.loadImage(this.LOGO_PATH);
      doc.addImage(imgData, 'JPEG', 85, 22, 30, 25);
    } catch (e) {
      console.warn('No se pudo cargar el logo', e);
      doc.setFontSize(8);
      doc.text('GOBIERNO', 100, 30, { align: 'center' });
      doc.text('REGIONAL', 100, 34, { align: 'center' });
      doc.text('DEL CALLAO', 100, 38, { align: 'center' });
    }

    const tableBodyGeneral = detail.evaluados.map((person) => {
      let letter = '';
      if (person.resultadoFinal === 'APROBADO') letter = 'A';
      if (person.resultadoFinal === 'DESAPROBADO') letter = 'D';

      return [
        person.numeroFila.toString(),
        person.nombres,
        person.numeroFila.toString(),
        person.dni,
        person.categoriaCodigo,
        person.placa || '',
        letter
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['N°', 'APELLIDOS Y NOMBRES', 'N°', 'D.N.I', 'CATEGORIA', 'PLACA', '']],
      body: tableBodyGeneral,
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
        6: { halign: 'center', cellWidth: 10, fontStyle: 'bold', textColor: [0, 51, 153] }
      },
      margin: { top: 50, left: 10, right: 10 }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 50;

    const footerStartY = finalY + 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.rect(10, footerStartY, 190, 40);
    doc.text('Observaciones:', 12, footerStartY + 5);
    
    if (detail.grupo.observaciones) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 51, 153);
      const obs = detail.grupo.observaciones;
      doc.text(obs.substring(0, 105), 12, footerStartY + 12);
      if (obs.length > 105) {
        doc.text(obs.substring(105, 210), 12, footerStartY + 18);
      }
      if (obs.length > 210) {
        doc.text(obs.substring(210, 315), 12, footerStartY + 24);
      }
    }

    const sigY = footerStartY + 30;
    doc.line(20, sigY, 60, sigY);
    if (firmas['EVALUADOR_CIRCUITO']) doc.addImage(firmas['EVALUADOR_CIRCUITO'], 'JPEG', 25, sigY - 18, 30, 15);

    doc.line(75, sigY, 135, sigY);
    if (firmas['ADMIN']) doc.addImage(firmas['ADMIN'], 'JPEG', 90, sigY - 18, 30, 15);

    doc.line(150, sigY, 190, sigY);
    if (firmas['SUPERVISOR_EVALUADOS']) doc.addImage(firmas['SUPERVISOR_EVALUADOS'], 'JPEG', 155, sigY - 18, 30, 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Evaluador', 40, sigY + 5, { align: 'center' });
    
    doc.text('GOBIERNO REGIONAL DEL CALLAO', 105, sigY + 3, { align: 'center' });
    doc.text('Coordinador', 105, sigY + 8, { align: 'center' });
    
    doc.text('Supervisor', 170, sigY + 5, { align: 'center' });

    // --- PÁGINAS 2 a 5: ACTAS DE VEEDORES ---
    const veedorTypes = [
      { codigo: 'TORRE_POSTERIOR', nombre: 'TORRE POSTERIOR' },
      { codigo: 'TORRE_FRONTAL', nombre: 'TORRE FRONTAL' },
      { codigo: 'ESTACIONAMIENTO_PARALELO', nombre: 'ESTACIONAMIENTO PARALELO' },
      { codigo: 'ESTACIONAMIENTO_DIAGONAL', nombre: 'ESTACIONAMIENTO DIAGONAL' }
    ];

    for (let i = 0; i < veedorTypes.length; i++) {
      doc.addPage();
      
      const veedor = veedorTypes[i];

      if (imgData) {
        doc.addImage(imgData, 'JPEG', 15, 10, 30, 35);
      } else {
        doc.setFontSize(8);
        doc.text('LOGO', 30, 25, { align: 'center' });
      }

      // Headers
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GOBIERNO REGIONAL DEL CALLAO', 115, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Gerencia Regional de Transportes y Comunicaciones', 115, 22, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Unidad de Licencias', 115, 29, { align: 'center' });

      doc.setFontSize(16);
      doc.text('EXAMEN DE MANEJO', 85, 42, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(200, 0, 0);
      doc.text(`Nº ${String(detail.grupo.numeroGrupo).padStart(6, '0')}`, 130, 42);
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.rect(15, 50, 20, 8);
      doc.text('Posición:', 17, 55);
      doc.rect(35, 50, 70, 8);
      doc.text(veedor.nombre, 37, 55);
      
      doc.rect(130, 50, 15, 8);
      doc.text('Hora:', 132, 55);
      doc.rect(145, 50, 50, 8);
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 51, 153);
      doc.text(timeStr, 155, 55);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      doc.rect(15, 60, 20, 8);
      doc.text('Grupo:', 17, 65);
      doc.rect(35, 60, 50, 8);
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 51, 153);
      doc.text(`${detail.grupo.numeroGrupo} ${detail.grupo.colorNombre}`, 45, 65);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      doc.rect(130, 60, 15, 8);
      doc.text('Fecha:', 132, 65);
      doc.rect(145, 60, 50, 8);
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 51, 153);
      doc.text(dateStr, 155, 65);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      const tableBody = [];
      for (let r = 1; r <= 10; r++) {
        const person = detail.evaluados.find(p => p.numeroFila === r);
        let cat = '';
        let habsStr = '';
        let regsStr = '';
        let habsIsRed = false;
        let regsIsRed = false;
        
        if (person) {
          cat = person.categoriaCodigo;
          const rev = person.revisiones.find(rv => rv.tipoVeedorCodigo === veedor.codigo);
          if (rev) {
            habsStr = rev.habilidades.map(h => h.siglas).join(' / ');
            habsIsRed = rev.habilidades.some(h => h.gravedad === 'MUY GRAVE');
            
            regsStr = rev.reglamentos.map(reg => reg.siglas).join(' / ');
            regsIsRed = rev.reglamentos.some(reg => reg.gravedad === 'MUY GRAVE');
          }
        }
        
        tableBody.push([
          r.toString(), 
          cat, 
          habsIsRed ? { content: habsStr, styles: { textColor: [220, 38, 38] as [number, number, number] } } : habsStr, 
          regsIsRed ? { content: regsStr, styles: { textColor: [220, 38, 38] as [number, number, number] } } : regsStr
        ]);
      }

      autoTable(doc, {
        startY: 75,
        head: [['Nª', 'CAT', 'HABILIDAD', 'REGLAMENTO']],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 14,
          font: 'helvetica',
          cellPadding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          textColor: [0, 51, 153],
          fontStyle: 'italic',
          minCellHeight: 12
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 10
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15, textColor: [0, 0, 0], fontStyle: 'bold' },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'left', cellWidth: 80 },
          3: { halign: 'left', cellWidth: 65 }
        },
        margin: { left: 15, right: 15 }
      });

      finalY = (doc as any).lastAutoTable.finalY || 75;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      doc.rect(15, finalY, 180, 25);
      doc.text('Observaciones:', 17, finalY + 5);
      
      const veedorObs = detail.observacionesVeedores && detail.observacionesVeedores[veedor.codigo];
      if (veedorObs) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 51, 153);
        doc.text(veedorObs.substring(0, 100), 17, finalY + 12);
        if (veedorObs.length > 100) {
          doc.text(veedorObs.substring(100, 200), 17, finalY + 17);
        }
      }

      const sigActaY = finalY + 45;
      
      doc.line(15, sigActaY, 55, sigActaY);
      const veedorKey = `VEEDOR_${veedor.codigo}`;
      if (firmas[veedorKey]) doc.addImage(firmas[veedorKey], 'JPEG', 20, sigActaY - 18, 30, 15);
      doc.text('Evaluador', 35, sigActaY + 5, { align: 'center' });
      
      doc.line(75, sigActaY, 135, sigActaY);
      if (firmas['ADMIN']) doc.addImage(firmas['ADMIN'], 'JPEG', 90, sigActaY - 18, 30, 15);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('GOBIERNO REGIONAL DEL CALLAO', 105, sigActaY - 6, { align: 'center' });
      doc.text('RENE JAVIER MAMANI NUÑONCA', 105, sigActaY - 2, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Coordinador', 105, sigActaY + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.line(155, sigActaY, 195, sigActaY);
      if (firmas['SUPERVISOR_EVALUADOS']) doc.addImage(firmas['SUPERVISOR_EVALUADOS'], 'JPEG', 160, sigActaY - 18, 30, 15);
      doc.text('Supervisor', 175, sigActaY + 5, { align: 'center' });
    }

    doc.save(`Grupo_${detail.grupo.numeroGrupo}_Evaluados_Completo.pdf`);
  }

  async exportVeedorSheetToPdf(sheet: VeedorSheet, skillOptions: CriterioCatalog[], regOptions: CriterioCatalog[]): Promise<void> {
    const firmasRoles = await new Promise<{ [key: string]: string }>((resolve) => {
      this.catalogService.getFirmasRoles().subscribe({ next: resolve, error: () => resolve({}) });
    });
    const firmasGrupo = await new Promise<{ [key: string]: string }>((resolve) => {
      this.catalogService.getFirmasGrupo(sheet.grupoId).subscribe({ next: resolve, error: () => resolve({}) });
    });
    const firmasMap = { ...firmasRoles, ...firmasGrupo };
    const firmas = await this.loadSignatures(firmasMap);

    const doc = new jsPDF('p', 'mm', 'a4');
    
    let imgData: string | null = null;
    try {
      imgData = await this.loadImage(this.LOGO_PATH);
    } catch (e) {
      console.warn('No se pudo cargar el logo', e);
    }

    if (imgData) {
      doc.addImage(imgData, 'JPEG', 15, 10, 30, 35);
    } else {
      doc.setFontSize(8);
      doc.text('LOGO', 30, 25, { align: 'center' });
    }

    // Headers
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GOBIERNO REGIONAL DEL CALLAO', 115, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Gerencia Regional de Transportes y Comunicaciones', 115, 22, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Unidad de Licencias', 115, 29, { align: 'center' });

    doc.setFontSize(16);
    doc.text('EXAMEN DE MANEJO', 85, 42, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(200, 0, 0);
    doc.text(`Nº ${String(sheet.numeroGrupo).padStart(6, '0')}`, 130, 42);
    doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.rect(15, 50, 20, 8);
    doc.text('Posición:', 17, 55);
    doc.rect(35, 50, 70, 8);
    doc.text(sheet.tipoVeedorNombre, 37, 55);
    
    doc.rect(130, 50, 15, 8);
    doc.text('Hora:', 132, 55);
    doc.rect(145, 50, 50, 8);
    
    const dateObj = new Date(sheet.registradoEn);
    const dateStr = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(dateObj);
    const timeStr = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(dateObj);
    
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 51, 153);
    doc.text(timeStr, 155, 55);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    doc.rect(15, 60, 20, 8);
    doc.text('Grupo:', 17, 65);
    doc.rect(35, 60, 50, 8);
    
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 51, 153);
    doc.text(`${sheet.numeroGrupo} ${sheet.colorNombre}`, 45, 65);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    doc.rect(130, 60, 15, 8);
    doc.text('Fecha:', 132, 65);
    doc.rect(145, 60, 50, 8);
    
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 51, 153);
    doc.text(dateStr, 155, 65);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const skillMap = new Map(skillOptions.map(o => [o.id, o]));
    const regMap = new Map(regOptions.map(o => [o.id, o]));

    const tableBody = [];
    for (let r = 1; r <= 10; r++) {
      const person = sheet.evaluados.find(p => p.numeroFila === r);
      let cat = '';
      let habsStr = '';
      let regsStr = '';
      let habsIsRed = false;
      let regsIsRed = false;
      
      if (person) {
        cat = person.categoriaCodigo;
        
        const personSkills = person.habilidadIds.map(id => skillMap.get(id)).filter(Boolean) as CriterioCatalog[];
        if (personSkills.length > 0) {
          habsStr = personSkills.map(h => h.siglas).join(' / ');
          habsIsRed = personSkills.some(h => h.gravedad === 'MUY GRAVE');
        }

        const personRegs = person.reglamentoIds.map(id => regMap.get(id)).filter(Boolean) as CriterioCatalog[];
        if (personRegs.length > 0) {
          regsStr = personRegs.map(reg => reg.siglas).join(' / ');
          regsIsRed = personRegs.some(reg => reg.gravedad === 'MUY GRAVE');
        }
      }
      
      tableBody.push([
        r.toString(), 
        cat, 
        habsIsRed ? { content: habsStr, styles: { textColor: [220, 38, 38] as [number, number, number] } } : habsStr, 
        regsIsRed ? { content: regsStr, styles: { textColor: [220, 38, 38] as [number, number, number] } } : regsStr
      ]);
    }

    autoTable(doc, {
      startY: 75,
      head: [['Nª', 'CAT', 'HABILIDAD', 'REGLAMENTO']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 14,
        font: 'helvetica',
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        textColor: [0, 51, 153],
        fontStyle: 'italic',
        minCellHeight: 12
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 10
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15, textColor: [0, 0, 0], fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'left', cellWidth: 80 },
        3: { halign: 'left', cellWidth: 65 }
      },
      margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 75;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.rect(15, finalY, 180, 25);
    doc.text('Observaciones:', 17, finalY + 5);
    
    if (sheet.observaciones) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 51, 153);
      doc.text(sheet.observaciones.substring(0, 100), 17, finalY + 12);
      if (sheet.observaciones.length > 100) {
        doc.text(sheet.observaciones.substring(100, 200), 17, finalY + 17);
      }
    }

    const sigActaY = finalY + 45;
    
    doc.line(15, sigActaY, 55, sigActaY);
    const veedorKey = `VEEDOR_${sheet.tipoVeedorCodigo}`;
    if (firmas[veedorKey]) doc.addImage(firmas[veedorKey], 'JPEG', 20, sigActaY - 18, 30, 15);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('Evaluador', 35, sigActaY + 5, { align: 'center' });
    
    doc.line(75, sigActaY, 135, sigActaY);
    if (firmas['ADMIN']) doc.addImage(firmas['ADMIN'], 'JPEG', 90, sigActaY - 18, 30, 15);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('GOBIERNO REGIONAL DEL CALLAO', 105, sigActaY - 6, { align: 'center' });
    doc.text('RENE JAVIER MAMANI NUÑONCA', 105, sigActaY - 2, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Coordinador', 105, sigActaY + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.line(155, sigActaY, 195, sigActaY);
    if (firmas['SUPERVISOR_EVALUADOS']) doc.addImage(firmas['SUPERVISOR_EVALUADOS'], 'JPEG', 160, sigActaY - 18, 30, 15);
    doc.text('Supervisor', 175, sigActaY + 5, { align: 'center' });

    doc.save(`Grupo_${sheet.numeroGrupo}_Acta_${sheet.tipoVeedorCodigo}.pdf`);
  }


  exportToExcel(detail: FinalReviewDetail): void {
    const data = detail.evaluados.map(person => {
      let observaciones = '';
      if (person.revisiones && person.revisiones.length > 0) {
        observaciones = person.revisiones.map(rev => {
          const name = rev.tipoVeedorCodigo.replace('_', ' ');
          const habs = rev.habilidades.length > 0 ? `Habilidades: ${rev.habilidades.map(h => h.siglas).join(', ')}` : '';
          const regs = rev.reglamentos.length > 0 ? `Reglamentos: ${rev.reglamentos.map(r => r.siglas).join(', ')}` : '';
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
