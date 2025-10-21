import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Offcanvas } from 'bootstrap';

import { EndPoints } from '../../shared/constants/endpoints';
import { LedgerService } from '../../core/services/ledger.service';
import { LedgerEntry, LedgerEntryReq } from '../../core/models/ledger.model';
import { StorageUtils } from '../../core/utils/storage.utils';
import { NumberUtils } from '../../core/utils/number.utils';
import { CreateLedgerEntryComponent } from '../../shared/components/create-ledger-entry/create-ledger-entry.component';
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';
import { ExportDropdownComponent, ExportConfig } from '../../shared/components/export-dropdown/export-dropdown.component';
import { AppUser } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toaster.service';
import { RoleUtils } from '../../core/utils/role.utils';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    CreateLedgerEntryComponent,
    GenericFilterComponent,
    ExportDropdownComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  isEditMode: boolean = true;
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionTpl', { static: true }) actionTpl!: TemplateRef<any>;
  @ViewChild('creditDebit', { static: true }) creditDebit!: TemplateRef<any>;

  // Export configuration
  exportConfig: ExportConfig = {
    filename: 'expenditure-ledger',
    title: 'Expenditure Ledger Report',
    showBalance: true,
    columns: [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Balance', key: 'balance', width: 18, align: 'right' },
      { header: 'Credit', key: 'credit', width: 18, align: 'right' },
      { header: 'Debit', key: 'debit', width: 18, align: 'right' },
      // { header: 'Description', key: 'description', width: 35 },
      { header: 'Hint By', key: 'hintBy', width: 20 },
      { header: 'Payment Mode', key: 'paymentMode', width: 20 },
      { header: 'Debited By', key: 'debitedByName', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ]
  };

  filteredRows: any[] = []; // Copy for filtering
  todayEntries: any[] = []; // Today's entries for edit mode
  searchTerm: string = '';
  ledgerData: Array<LedgerEntry> = [];
  showLedgerForm: boolean = false;
  users: AppUser[] = [];
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  private searchTimeout: any;
  lastLedger: LedgerEntry | null = null;

  columns: any = [];
  isLoading: boolean = false;
  deleteProgress: number = 0;

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ledgerService: LedgerService,
    private cdr: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly roleUtils: RoleUtils
  ) {
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeComponent();
  }

  private initializeComponent() {
    this.columns = [
      { name: 'Date', prop: 'date', width: 90},
      { name: 'Balance', prop: 'balance', width: 80},
      // { name: 'Debit', prop: 'debit', width: 120},
      // { name: 'Credit', prop: 'credit', width: 120},
      {
        name: 'Credit/Debit',
        cellTemplate: this.creditDebit,
        width: 80
      },
      { name: 'Hint By', prop: 'hintBy', width: 120},
      { name: 'Payment Mode', prop: 'paymentMode', width: 120},
      // { name: 'Deposited By', prop: 'depositedByName', width: 120},
      // { name: 'Debited By', prop: 'debitedByName', width: 120},
      // { name: 'Approved By', prop: 'approvedBy', width: 120},
      { name: 'Created By', prop: 'createdByName', width: 100},
      { name: 'Description', prop: 'description'},
      {
        name: 'Status/Approved by',
        prop: 'status',
        cellTemplate: this.statusTpl,
      },
      {
        name: 'Actions',
        cellTemplate: this.actionTpl,
        sortable: false,
      }
    ];

    this.isLoading = true;
    this.getLedgerEntries();
    this.getLastStockLedger();
    this.getUsers();
  }

  isAccordionOpen = false;

  toggleAccordion() {
    this.isAccordionOpen = !this.isAccordionOpen;
  }

  onSearchInputChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.filterRows(), 300);
  }

  filterRows() {
    const term = this.searchTerm.toLowerCase().trim();
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;
    
    if (!term) {
      this.filteredRows = dataToFilter;
      return;
    }

    this.filteredRows = dataToFilter.filter(row =>
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
    const confirmDelete = confirm(
      `Are you sure you want to delete this entry?\n\n` +
      `This will:\n` +
      `• Delete the ledger entry permanently\n` +
      `• Recalculate balances for all subsequent entries\n` +
      `• This action cannot be undone`
    );
    
    if (confirmDelete) {
      this.isLoading = true;
      console.log('Deleting ledger entry:', row);
      
      // Progress callback for large operations
      const progressCallback = (progress: number) => {
        this.deleteProgress = progress;
        if (progress > 0) {
          this.toastService.show(`Processing... ${progress.toFixed(1)}% complete`, 'info');
        }
      };

      this.ledgerService.deleteLedgerWithRecalculation(row.id, progressCallback)
        .subscribe({
          next: () => {
            console.log('Ledger entry deleted successfully with balance recalculation');
            this.toastService.show('Entry deleted and balances recalculated successfully', 'success');
            // Refresh the data to show updated balances
            this.initializeComponent();
          },
          error: (error) => {
            console.error('Error deleting ledger entry:', error);
            this.toastService.show('Error deleting entry. Please try again.', 'danger');
            this.isLoading = false;
            this.deleteProgress = 0;
          },
          complete: () => {
            this.isLoading = false;
            this.deleteProgress = 0;
          }
        });
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

    // Check if user can approve entries
    if (!this.roleUtils.canApproveEntries()) {
      this.toastService.show('You do not have permission to approve entries', 'danger');
      return;
    }

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



  public preview() {
    this.isEditMode = !this.isEditMode;
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.ADMIN_DASHBOARD]);
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
    this.initializeComponent();
  }

  public cancelPreviewMode() {
    this.isEditMode = !this.isEditMode;
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
  }

  private getLedgerEntries() {
    this.ledgerService.getLedgerEntries().subscribe(
      {
        next: (ledgerEntries: any) => {
          // Sanitize all ledger entries to ensure credit, debit, and balance are integers
          this.ledgerData = ledgerEntries.map((entry: any) => this.sanitizeLedgerEntry(entry));
          this.todayEntries = this.getTodayEntries(this.ledgerData);
          this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
          // this.filterRows();
          console.log("Ledger : ", this.ledgerData);
          setTimeout(() => this.cdr.detectChanges());
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching ledger entries:', error);
        }
      }
    );
  }

  /**
   * Filters entries created today
   * @param entries Array of ledger entries
   * @returns Array of entries created today
   */
  private getTodayEntries(entries: LedgerEntry[]): LedgerEntry[] {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const todayEntries = entries.filter(entry => {
      if (!entry.createdAt) return false;
      
      let entryDate: Date;
      try {
        // Handle both Date objects and date strings
        if (entry.createdAt instanceof Date) {
          entryDate = entry.createdAt;
        } else if (typeof entry.createdAt === 'string') {
          entryDate = new Date(entry.createdAt);
        } else if (typeof entry.createdAt === 'object' && entry.createdAt !== null && 'toDate' in entry.createdAt) {
          // Handle Firestore Timestamp objects
          entryDate = (entry.createdAt as any).toDate();
        } else {
          return false;
        }
        
        return entryDate >= todayStart && entryDate <= todayEnd;
      } catch (error) {
        console.warn('Error parsing date for entry:', entry.id, error);
        return false;
      }
    });

    console.log(`Today's entries found: ${todayEntries.length} out of ${entries.length} total entries`);
    return todayEntries;
  }

  private getLastStockLedger() {
    this.ledgerService.getLatestEntry().subscribe(
      {
        next: (ledgerEntries: any) => {
          // Sanitize the latest ledger entry to ensure balance is an integer
          this.lastLedger = ledgerEntries ? this.sanitizeLedgerEntry(ledgerEntries) : null;
          this.isLoading = false;
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
          this.isLoading = false;
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
    const { credit, debit, createdBy, status, dateFilter } = filters;
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;
    
    this.filteredRows = [];
    if (credit || debit || createdBy || status || dateFilter) {
      this.filteredRows = dataToFilter.filter(entry => {
        let isMatch = true;

        // Filter by credit (if specified)
        if (credit !== null && credit !== undefined && credit !== '') {
          // Use sanitized integer values for comparison
          const entryCredit = NumberUtils.sanitizeToInteger(entry.credit);
          const filterCredit = NumberUtils.sanitizeToInteger(credit);
          if (entryCredit !== filterCredit) {
            if (entryCredit < filterCredit) {
              isMatch = false;
            }
          }
        }

        // Filter by debit (if specified)
        if (debit !== null && debit !== undefined && debit !== '') {
          // Use sanitized integer values for comparison
          const entryDebit = NumberUtils.sanitizeToInteger(entry.debit);
          const filterDebit = NumberUtils.sanitizeToInteger(debit);
          if (entryDebit !== filterDebit) {
            if (entryDebit < filterDebit) {
              isMatch = false;
            }
          }
        }

        // Filter by createdBy (if specified)
        if (createdBy) {
          if (entry.createdBy !== createdBy.trim()) {
            isMatch = false;
          }
        }

        // Filter by status (if specified)
        if (status) {
          if (entry.status !== status) {
            isMatch = false;
          }
        }

        // Filter by date
        if (dateFilter && dateFilter.type !== 'all') {
          if (!this.isDateInRange(entry, dateFilter)) {
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
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
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

  get todaysBalance(): number | null {
    if (!this.todayEntries || this.todayEntries.length === 0) return null;
    const totalCreditSum = this.todayEntries.reduce((acc: number, curr: LedgerEntry) => {
      return acc + NumberUtils.sanitizeToInteger(curr.credit);
    }, 0);
    const totalDebitSum = this.todayEntries.reduce((acc: number, curr: LedgerEntry) => {
      return acc + NumberUtils.sanitizeToInteger(curr.debit);
    }, 0);
    return totalCreditSum - totalDebitSum;
  }

  get currentBalance(): number | null {
    if (this.isEditMode) {
      return this.todaysBalance;
    } else {
      return this.lastLedger ? NumberUtils.sanitizeToInteger(this.lastLedger.balance) : null;
    }
  }

  get currentExportConfig(): ExportConfig {
    return {
      ...this.exportConfig,
      currentBalance: this.currentBalance
    };
  }

  // Export event handlers
  onExportStarted(type: string) {
    console.log(`Starting ${type} export...`);
  }

  onExportCompleted(type: string) {
    console.log(`${type} export completed successfully`);
  }

  private isDateInRange(entry: LedgerEntry, dateFilter: any): boolean {
    if (!dateFilter.fromDate || !dateFilter.toDate) {
      return true; // If no valid date range, don't filter
    }

    // Convert entry date to Date object for comparison
    let entryDate: Date;
    if (entry.createdAt instanceof Date) {
      entryDate = entry.createdAt;
    } else if (typeof entry.createdAt === 'string') {
      entryDate = new Date(entry.createdAt);
    } else if (entry.createdAt && typeof entry.createdAt === 'object' && (entry.createdAt as any).toDate) {
      // Handle Firestore Timestamp
      entryDate = (entry.createdAt as any).toDate();
    } else {
      // Fallback to entry.date if createdAt is not available
      entryDate = new Date(entry.date);
    }

    // Convert to YYYY-MM-DD format for comparison
    const entryDateStr = entryDate.toISOString().split('T')[0];
    const fromDateStr = dateFilter.fromDate;
    const toDateStr = dateFilter.toDate;

    return entryDateStr >= fromDateStr && entryDateStr <= toDateStr;
  }


  /**
   * Sanitize ledger entry data to ensure credit and debit are integers
   * @param entry - The ledger entry to sanitize
   * @returns Sanitized ledger entry
   */
  private sanitizeLedgerEntry(entry: any): any {
    return {
      ...entry,
      credit: NumberUtils.sanitizeToInteger(entry.credit),
      debit: NumberUtils.sanitizeToInteger(entry.debit),
      balance: NumberUtils.sanitizeToInteger(entry.balance)
    };
  }
}
