import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgxDatatableComponent } from '../../shared/components/ngx-datatable/ngx-datatable.component';
import { EndPoints } from '../../shared/constants/endpoints';
import { StockLedgerEntry } from '../../core/models/stock-ledger';
import { StockLedgerService } from '../../core/services/stock-ledger.service';

@Component({
  selector: 'app-list-stock-ledger',
  imports: [CommonModule, FormsModule, NgxDatatableComponent],
  templateUrl: './list-stock-ledger.component.html',
  styleUrl: './list-stock-ledger.component.scss'
})
export class ListStockLedgerComponent {
  searchTerm: string = '';
  filteredRows: StockLedgerEntry[] = []; // Copy for filtering
  lastStockLedger: StockLedgerEntry | null = null;
  private searchTimeout: any;
  rows: Array<StockLedgerEntry> = [];

  ledgerData = [];

  ledgerColumns = [
    { name: 'Date', prop: 'date' },
    { name: 'Category', prop: 'mainCategory' },
    { name: 'Sub Category', prop: 'subCategory' },
    { name: 'Stock In', prop: 'stockIn' },
    { name: 'Stock Out', prop: 'stockOut' },
    { name: 'Balance', prop: 'balance' },
  ];

  constructor(
    private readonly router: Router,
    private readonly stockLedgerService: StockLedgerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getLedgerEntries();
    this.getLastStockLedger();
  }

  onSearchInputChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.filterRows(), 300);
  }

  filterRows() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRows = [...this.rows];
      return;
    }

    this.filteredRows = this.rows.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(term)
      )
    );
  }

  onEditLedger(row: any) {
    this.router.navigate([EndPoints.CREATE_STOCK_LEDGER], { queryParams: { id: row.id, redirect: this.router.url } });
  }

  onDeleteLedger(row: any) {
    console.log('Delete', row);
  }

  createEntry() {
    console.log('Create Entry');
    this.router.navigate([EndPoints.CREATE_STOCK_LEDGER], { queryParams: { redirect: this.router.url } });
  }

  exportToExcel(): void {
    const exportData = this.filteredRows.map(row => ({
      'Date': row.date,
      'Category': row.mainCategory,
      'Sub Category': row.subCategory,
      'Credit': row.stockIn,
      'Debit': row.stockOut,
      'Balance': row.balance,
      'Description': row.description,
    }));


    const fileName = `LedgerData-${new Date().toLocaleDateString()}.xlsx`;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData); // or your data array
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, fileName);
  }

  private getLedgerEntries() {
    this.stockLedgerService.getLedgerEntries().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.rows = ledgerEntries;
          this.filteredRows = ledgerEntries;
          console.log("Ledger : ", ledgerEntries);
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (error) => {
          console.error('Error fetching ledger entries:', error);
        }
      }
    );
  }

  private getLastStockLedger() {
    this.stockLedgerService.getLatestEntry().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.lastStockLedger = ledgerEntries;
        },
        error: (error) => {
          console.error('Error fetching ledger entries:', error);
        }
      }
    );
  }
}
