import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ExportConfig {
  filename: string;
  title: string;
  columns: ExportColumn[];
  currentBalance?: number | null;
  showBalance?: boolean;
  showExcel?: boolean;
  showPDF?: boolean;
}

@Component({
  selector: 'app-export-dropdown',
  imports: [CommonModule],
  template: `
    <div class="d-inline-block mx-1 mx-sm-2">
      <!-- Single option: Direct button -->
      <button *ngIf="singleOption" 
              class="btn btn-warning btn-sm" 
              type="button" 
              (click)="handleSingleOption()">
        <i class="bi bi-download me-1"></i>{{ singleOptionText }}
      </button>
      
      <!-- Multiple options: Dropdown -->
      <div *ngIf="!singleOption" class="dropdown" (click)="$event.stopPropagation()">
        <button class="btn btn-warning btn-sm dropdown-toggle" 
                type="button" 
                (click)="toggleDropdown()"
                [attr.aria-expanded]="isDropdownOpen">
          <i class="bi bi-download me-1"></i>Download
        </button>
        <ul class="dropdown-menu" [class.show]="isDropdownOpen">
          <li *ngIf="config?.showExcel !== false">
            <a class="dropdown-item" href="#" (click)="exportToExcel(); closeDropdown(); $event.preventDefault()">
              <i class="bi bi-file-earmark-excel me-2"></i>Download as Excel
            </a>
          </li>
          <li *ngIf="config?.showPDF !== false">
            <a class="dropdown-item" href="#" (click)="exportToPDF(); closeDropdown(); $event.preventDefault()">
              <i class="bi bi-file-earmark-pdf me-2"></i>Download as PDF
            </a>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: []
})
export class ExportDropdownComponent {
  @Input() data: any[] = [];
  @Input() config!: ExportConfig;
  @Output() exportStarted = new EventEmitter<string>();
  @Output() exportCompleted = new EventEmitter<string>();

  isDropdownOpen = false;

  private isInReactNativeWebView(): boolean {
    return typeof window !== 'undefined' && !!((window as any).ReactNativeWebView || (window as any).__IS_REACT_NATIVE_WEBVIEW__);
  }

  private normalizeBaseName(): string {
    const raw = (this.config?.filename || '').toLowerCase();
    return raw.includes('stock') ? 'stock-ledger' : 'ledger';
  }

  private postFileToRN(base64: string, mimeType: string, fileName: string, baseName?: string) {
    try {
      (window as any).ReactNativeWebView?.postMessage(
        JSON.stringify({ type: 'FILE_DOWNLOAD', payload: { base64, mimeType, fileName, baseName } })
      );
    } catch (e) {
      console.error('postMessage error', e);
    }
  }

  get singleOption(): boolean {
    const showExcel = this.config?.showExcel !== false;
    const showPDF = this.config?.showPDF !== false;
    return (showExcel && !showPDF) || (!showExcel && showPDF);
  }

  get singleOptionText(): string {
    if (this.config?.showExcel !== false && this.config?.showPDF === false) {
      return 'Download as Excel';
    } else if (this.config?.showPDF !== false && this.config?.showExcel === false) {
      return 'Download as PDF';
    }
    return 'Download';
  }

  constructor() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  handleSingleOption() {
    if (this.config?.showExcel !== false && this.config?.showPDF === false) {
      this.exportToExcel();
    } else if (this.config?.showPDF !== false && this.config?.showExcel === false) {
      this.exportToPDF();
    }
  }

  exportToExcel(): void {
    this.exportStarted.emit('excel');

    const exportData = this.data.map(row => {
      const exportRow: any = {};
      this.config.columns.forEach(col => {
        exportRow[col.header] = row[col.key] || '';
      });
      return exportRow;
    });

    const fileName = `${this.config.filename}-${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (!cell) continue;

        cell.s = {
          font: R === 0 ? { bold: true } : {},
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        } as any;
      }
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { 'data': worksheet },
      SheetNames: ['data']
    };

    if (this.isInReactNativeWebView()) {
      const base64: string = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      this.postFileToRN(base64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName, this.normalizeBaseName());
      this.exportCompleted.emit('excel');
      return;
    }

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, fileName);

    this.exportCompleted.emit('excel');
  }

  exportToPDF(): void {
    this.exportStarted.emit('pdf');

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.config.title, 14, 22);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
    let startY = 42;
    if (this.config.showBalance && this.config.currentBalance !== undefined) {
      doc.text(`Current Balance: ${this.config.currentBalance || 0}`, 14, 42);
      startY = 52;
    }

    const tableColumns = this.config.columns.map(col => col.header);
    const tableRows = this.data.map(row => 
      this.config.columns.map(col => row[col.key] || '')
    );

    const totalWidth = 184;
    const columnStyles: any = {};
    
    this.config.columns.forEach((col, index) => {
      const width = col.width || Math.floor(totalWidth / this.config.columns.length);
      columnStyles[index] = { 
        cellWidth: width,
        halign: col.align || 'left'
      };
    });

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: startY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: columnStyles,
      margin: { top: startY, left: 14, right: 14 },
      didDrawPage: function (data) {
        const pageCount = (doc as any).internal.pages.length - 1;
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, 
                 (doc as any).internal.pageSize.width - 30, 
                 (doc as any).internal.pageSize.height - 10);
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 14, finalY + 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Entries: ${this.data.length}`, 14, finalY + 30);

    const fileName = `${this.config.filename}-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;

    if (this.isInReactNativeWebView()) {
      const dataUri: string = (doc as any).output('datauristring');
      const base64 = dataUri.split(',')[1] || '';
      this.postFileToRN(base64, 'application/pdf', fileName, this.normalizeBaseName());
      this.exportCompleted.emit('pdf');
      return;
    }

    doc.save(fileName);

    this.exportCompleted.emit('pdf');
  }
} 