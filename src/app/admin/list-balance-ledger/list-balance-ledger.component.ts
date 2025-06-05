import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgxDatatableComponent } from '../../shared/components/ngx-datatable/ngx-datatable.component';
import { EndPoints } from '../../shared/constants/endpoints';
import { BalanceLedgerEntry } from '../../core/models/balance-ledger';
import { BalanceLedgerService } from '../../core/services/balance-ledger.service';

@Component({
  selector: 'app-list-balance-ledger',
  imports: [CommonModule, FormsModule, NgxDatatableComponent],
  templateUrl: './list-balance-ledger.component.html',
  styleUrl: './list-balance-ledger.component.scss'
})
export class ListBalanceLedgerComponent {
  searchTerm: string = '';
  filteredRows: BalanceLedgerEntry[] = []; // Copy for filtering
  lastLedger: BalanceLedgerEntry | null = null;
  private searchTimeout: any;
  rows: Array<BalanceLedgerEntry> = [];

  ledgerData = [];

  ledgerColumns = [
    { name: 'Date', prop: 'date' },
    { name: 'Item', prop: 'itemName' },
    { name: 'Quantity', prop: 'quantity' },
    { name: 'Rate', prop: 'rate' },
    { name: 'Amount', prop: 'amount' },
    { name: 'Credit', prop: 'credit' },
    { name: 'Balance', prop: 'balance' },
    { name: 'Description', prop: 'description' },
  ];

  constructor(
    private readonly router: Router,
    private readonly balanceLedgerService: BalanceLedgerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getLedgerEntries();
    this.getLastBalanceLedger();
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
    this.router.navigate([EndPoints.CREATE_BALANCE_LEDGER], { queryParams: { id: row.id, redirect: this.router.url } });
  }

  onDeleteLedger(row: any) {
    console.log('Delete', row);
  }

  createEntry() {
    this.router.navigate([EndPoints.CREATE_BALANCE_LEDGER], { queryParams: { redirect: this.router.url } });
  }

  exportToExcel(): void {
    const exportData = this.filteredRows.map(row => ({
      'Date': row.date,
      'Item': row.itemName,
      'Quantity': row.quantity,
      'Rate': row.rate,
      'Amount': row.amount,
      'Credit': row.credit,
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
    this.balanceLedgerService.getLedgerEntries().subscribe(
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

  private getLastBalanceLedger() {
    this.balanceLedgerService.getLatestEntry().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.lastLedger = ledgerEntries;
        },
        error: (error) => {
          console.error('Error fetching ledger entries:', error);
        }
      }
    );
  }
}
