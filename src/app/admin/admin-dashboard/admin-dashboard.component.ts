import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EndPoints } from '../../shared/constants/endpoints';
import { LedgerService } from '../../core/services/ledger.service';
import { LedgerEntry } from '../../core/models/ledger.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, NgxDatatableModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  filteredRows: any[] = []; // Copy for filtering
  searchTerm: string = '';
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionTpl', { static: true }) actionTpl!: TemplateRef<any>;

  rows: Array<LedgerEntry> = [];
  private searchTimeout: any;

  columns: any = [];

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly ledgerService: LedgerService,
    private cdr: ChangeDetectorRef
  ) {
    console.log(this.userService.getUser());
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.columns = [
      { name: 'Balance', prop: 'balance' },
      { name: 'Debit', prop: 'debit' },
      { name: 'Credit', prop: 'credit' },
      { name: 'Description', prop: 'description' },
      { name: 'Hint By', prop: 'hintBy' },
      { name: 'Payment Mode', prop: 'paymentMode' },
      { name: 'Deposited By', prop: 'depositedBy' },
      { name: 'Date', prop: 'date' },
      { name: 'Verified By', prop: 'verifiedBy' },
      { name: 'Created By', prop: 'createdByName' },
      {
        name: 'Status',
        prop: 'status',
        cellTemplate: this.statusTpl
      },
      {
        name: 'Actions',
        cellTemplate: this.actionTpl,
        sortable: false
      },
    ];
    this.getLedgerEntries();
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

  createEntry() {
    this.router.navigate([EndPoints.CREATE_LEDGER_ENTRY], { queryParams: { redirect: this.router.url } });
  }

  onEdit(row: any) {
    console.log('Editing row:', row);
    // Implement edit logic here (maybe open a modal)
    this.router.navigate([EndPoints.CREATE_LEDGER_ENTRY], { queryParams: { id: row.id, redirect: this.router.url } });
  }

  onDelete(row: any) {
    const confirmDelete = confirm('Are you sure you want to delete this entry?');
    if (confirmDelete) {
      console.log('Deleting row:', row);
      // Remove from Firebase or local array
    }
  }

  private getLedgerEntries() {
    this.ledgerService.getLedgerEntries().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.rows = ledgerEntries;
          this.filteredRows = ledgerEntries;
          // this.filterRows();
          console.log("Ledger : ", ledgerEntries);
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (error) => {
          console.error('Error fetching ledger entries:', error);
        }
      }
    );
  }
}
