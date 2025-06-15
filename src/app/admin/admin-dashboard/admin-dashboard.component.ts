import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';

import { EndPoints } from '../../shared/constants/endpoints';
import { LedgerService } from '../../core/services/ledger.service';
import { LedgerEntry, LedgerEntryReq } from '../../core/models/ledger.model';
import { StorageUtils } from '../../core/utils/storage.utils';
import { CreateLedgerEntryComponent } from '../../shared/components/create-ledger-entry/create-ledger-entry.component';
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';
import { AppUser } from '../../core/models/user.model';
import { Offcanvas } from 'bootstrap';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    CreateLedgerEntryComponent,
    GenericFilterComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionTpl', { static: true }) actionTpl!: TemplateRef<any>;
  @ViewChild('creditDebit', { static: true }) creditDebit!: TemplateRef<any>;

  filteredRows: any[] = []; // Copy for filtering
  searchTerm: string = '';
  ledgerData: Array<LedgerEntry> = [];
  showLedgerForm: boolean = false;
  users: AppUser[] = [];

  private searchTimeout: any;
  lastLedger: LedgerEntry | null = null;

  columns: any = [];

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ledgerService: LedgerService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeComponent();
  }

  private initializeComponent() {
    this.columns = [
      { name: 'Balance', prop: 'balance' },
      { name: 'Debit', prop: 'debit' },
      { name: 'Credit', prop: 'credit' },
      { name: 'Description', prop: 'description' },
      { name: 'Hint By', prop: 'hintBy' },
      { name: 'Payment Mode', prop: 'paymentMode' },
      { name: 'Deposited By', prop: 'depositedByName' },
      { name: 'Debited By', prop: 'debitedByName' },
      { name: 'Date', prop: 'date' },
      // { name: 'Approved By', prop: 'approvedBy' },
      { name: 'Created By', prop: 'createdByName' },
      {
        name: 'Status/Approved by',
        prop: 'status',
        cellTemplate: this.statusTpl
      },
      {
        name: 'Actions',
        cellTemplate: this.actionTpl,
        sortable: false
      }
    ];

    this.getLedgerEntries();
    this.getLastStockLedger();
    this.getUsers();
  }

  onSearchInputChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.filterRows(), 300);
  }

  filterRows() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRows = [...this.ledgerData];
      return;
    }

    this.filteredRows = this.ledgerData.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(term)
      )
    );
  }

  createEntry() {
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.ADMIN_DASHBOARD], { queryParams: { mode: 'create' } });
    this.showHideCreateAndUpdateForm();
  }

  onEdit(row: any) {
    console.log('Editing row:', row);
    // Implement edit logic here (maybe open a modal)
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.ADMIN_DASHBOARD], { queryParams: { mode: 'update', id: row.id } });
    this.showHideCreateAndUpdateForm();
  }

  onDelete(row: any) {
    const confirmDelete = confirm('Are you sure you want to delete this entry?');
    if (confirmDelete) {
      console.log('Deleting row:', row);
      // Remove from Firebase or local array
    }
  }

  closeLedgerForm(event: boolean) {
    console.log(event);
    if (event) {
      this.showLedgerForm = false;
      this.router.navigate([EndPoints.ADMIN_DASHBOARD]);
      this.initializeComponent();
    }
  }

  onStatusChange(row: LedgerEntryReq) {
    console.log('Status changed for row:', row);
    // Update status in Firebase or local array
    row.status = row.status === 'pending' ? 'approved' : 'pending';
    row.approvedBy = StorageUtils.getUid();
    row.approvedByName = StorageUtils.getUserName();
    this.ledgerService.updateLedger(row.id, row)
      .subscribe({
        next: () => {
          this.getLedgerEntries();
        },
        error: (error) => {
          console.error('Error updating ledger entry:', error);
        }
      })
  }

  exportToExcel(): void {
    const exportData = this.filteredRows.map(row => ({
      'Date': row.date,
      'Balance': row.balance,
      'Credit': row.credit,
      'Debit': row.debit,
      'Description': row.description,
      'Hint By': row.hintBy,
      'Payment Mode': row.paymentMode,
      'Deposited By': row.depositedByName,
      'Debited By': row.debitedByName,
      'Approved By': row.approvedByName,
    }));


    const fileName = `LedgerData-${new Date().toLocaleDateString()}.xlsx`;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    // Apply styling: Bold headers and borders for all cells
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (!cell) continue;

        cell.s = {
          font: R === 0 ? { bold: true } : {}, // Bold header row
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { 'data': worksheet },
      SheetNames: ['data']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, fileName);
  }

  private getLedgerEntries() {
    this.ledgerService.getLedgerEntries().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.ledgerData = ledgerEntries;
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

  private getLastStockLedger() {
    this.ledgerService.getLatestEntry().subscribe(
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

  private showHideCreateAndUpdateForm() {
    this.route.queryParams.subscribe(params => {
      console.log("1 Query Params", params);
      const { mode, id } = params;
      if (mode === 'update' || mode === 'create') {
        this.showLedgerForm = true;
      } else {
        this.showLedgerForm = false;
      }
    });
  }

  // Filter functions
  private getUsers() {
    this.userService.getAllUsers().subscribe(
      {
        next: (users: any) => {
          console.log(users);
          this.users = users;
        },
        error: (error) => {
          console.error('Error fetching users:', error);
        }
      }
    );
  }

  onFilterChanged(filters: any) {
    console.log('Filters applied:', filters);
    // Call service or update table data
    const { credit, debit, createdBy } = filters;
    this.filteredRows = [];
    if (credit || debit || createdBy) {
      this.filteredRows = this.ledgerData.filter(entry => {
        let isMatch = true;

        // Filter by credit (if specified)
        if (credit !== null && credit !== undefined && credit !== '') {
          // Convert to number if stored as string
          const entryCredit = Number(entry.credit);
          if (isNaN(entryCredit) || entryCredit !== Number(credit)) {
            if (entryCredit < credit) {
              isMatch = false;
            }
          }
        }

        // Filter by debit (if specified)
        if (debit !== null && debit !== undefined && debit !== '') {
          // Convert to number if stored as string
          const entryDebit = Number(entry.debit);
          if (isNaN(entryDebit) || entryDebit !== Number(debit)) {
            if (entryDebit < debit) {
              isMatch = false;
            }
          }
        }

        // Filter by itemId (item)
        if (createdBy) {
          if (entry.createdBy !== createdBy.trim()) {
            isMatch = false;
          }
        }

        return isMatch;
      });
    } else {
      this.resetFilters();
    }
    this.closeOffcanvas();
    this.cdr.detectChanges()
  }

  resetFilters() {
    this.filteredRows = [...this.ledgerData];
  }

  closeOffcanvas() {
    const offcanvasEl: HTMLElement | null = document.getElementById('filterSidebar');
    if (offcanvasEl) {
      const bsOffcanvas = Offcanvas.getInstance(offcanvasEl);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
    this.forceOffcanvasCleanup();
  }

  private forceOffcanvasCleanup() {
    // Wait a tick to allow Bootstrap to do its thing first
    setTimeout(() => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''; // ✅ Fixes stuck scroll
      }

      const backdrop = document.querySelector('.offcanvas-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('offcanvas-backdrop', 'fade', 'show', 'modal-open'); // clean up

      document.body.style.overflow = 'auto'; // or ''
      if (backdrop) backdrop.remove();

    }, 500); // Slight delay ensures transition is complete
  }
}
