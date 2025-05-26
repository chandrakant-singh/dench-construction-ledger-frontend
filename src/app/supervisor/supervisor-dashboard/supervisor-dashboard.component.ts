import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { LedgerService } from '../../core/services/ledger.service';
import { LedgerEntry } from '../../core/models/ledger.model';
import { CommonModule } from '@angular/common';
import { StorageUtils } from '../../core/utils/storage.utils';
import { EndPoints } from '../../shared/constants/endpoints';
import { Router } from '@angular/router';

@Component({
  selector: 'app-supervisor-dashboard',
  imports: [CommonModule, FormsModule, NgxDatatableModule],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.scss'
})
export class SupervisorDashboardComponent {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  filteredRows: any[] = []; // Copy for filtering
  searchTerm: string = '';

  rows: Array<LedgerEntry> = [];

  columns: any = [];

  constructor(
    private readonly ledgerService: LedgerService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.columns = [
      { name: 'Balance', prop: 'balance' },
      { name: 'Debit', prop: 'debit' },
      // { name: 'Credit', prop: 'credit' },
      { name: 'Description', prop: 'description' },
      { name: 'Hint By', prop: 'hintBy' },
      // { name: 'Payment Mode', prop: 'paymentMode' },
      // { name: 'Deposited By', prop: 'depositedBy' },
      { name: 'Date', prop: 'date' },
      // { name: 'Approved By', prop: 'approvedBy' },
      // { name: 'Created By', prop: 'createdByName' },
      {
        name: 'Status',
        prop: 'status',
        cellTemplate: this.statusTpl
      },
    ];
    this.getLedgerEntries();
  }

  filterRows() {
    const term = this.searchTerm.toLowerCase();
    this.filteredRows = this.rows.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(term)
      )
    );
    console.log('Filtered Rows:', this.filteredRows);
  }

  createEntry() {
    this.router.navigate([EndPoints.CREATE_LEDGER_ENTRY], { queryParams: { redirect: this.router.url } });
  }

  private getLedgerEntries() {
    this.ledgerService.getLedgerEntries(StorageUtils.getUid()).subscribe(
      {
        next: (ledgerEntries: any) => {
          this.rows = ledgerEntries;
          // this.filterRows();
          console.log("Ledger : ", ledgerEntries);
        },
        error: (error) => {
          console.error('Error fetching ledger entries:', error);
        }
      }
    );
  }
}
