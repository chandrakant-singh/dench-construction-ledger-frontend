import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgxDatatableComponent } from '../../shared/components/ngx-datatable/ngx-datatable.component';
import { ExportDropdownComponent, ExportConfig } from '../../shared/components/export-dropdown/export-dropdown.component';
import { EndPoints } from '../../shared/constants/endpoints';
import { BalanceLedgerEntry, BalanceLedgerItem } from '../../core/models/balance-ledger';
import { BalanceLedgerService } from '../../core/services/balance-ledger.service';
import { CreateBalanceLedgerComponent } from '../../shared/components/create-balance-ledger/create-balance-ledger.component';
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';
import { BalanceLedgerItemService } from '../../core/services/balance-ledger-item.service';
import { Offcanvas } from 'bootstrap';
import { ToastService } from '../../core/services/toaster.service';
import { NumberUtils } from '../../core/utils/number.utils';
import { StorageUtils } from '../../core/utils/storage.utils';
import { RoleUtils } from '../../core/utils/role.utils';

@Component({
  selector: 'app-list-balance-ledger',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableComponent,
    CreateBalanceLedgerComponent,
    GenericFilterComponent,
    ExportDropdownComponent
  ],
  templateUrl: './list-balance-ledger.component.html',
  styleUrl: './list-balance-ledger.component.scss'
})
export class ListBalanceLedgerComponent {
  isEditMode: boolean = true;
  isAccordionOpen = false;
  searchTerm: string = '';
  filteredRows: BalanceLedgerEntry[] = []; // Copy for filtering
  todayEntries: BalanceLedgerEntry[] = []; // Today's entries for edit mode
  lastLedger: BalanceLedgerEntry | null = null;
  private searchTimeout: any;

  ledgerData: Array<BalanceLedgerEntry> = [];
  showLedgerForm: boolean = false;
  items: BalanceLedgerItem[] = [];

  // Filter options
  parties: string[] = [];
  mainCategories: string[] = [];
  subCategories: string[] = [];

  isLoading: boolean = false;
  deleteProgress: number = 0;

  ledgerColumns: any[] = [];

  // Export configuration
  exportConfig: ExportConfig = {
    filename: 'balance-ledger',
    title: 'Balance Ledger Report',
    showBalance: true,
    columns: [
      { header: 'Date', key: 'date', width: 18 },
      { header: 'Item', key: 'itemName', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 16, align: 'right' },
      { header: 'Rate', key: 'rate', width: 16, align: 'right' },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Amount', key: 'amount', width: 18, align: 'right' },
      { header: 'Credit', key: 'credit', width: 16, align: 'right' },
      { header: 'Balance', key: 'balance', width: 18, align: 'right' },
      // { header: 'Description', key: 'description', width: 40 }
    ]
  };

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly balanceLedgerService: BalanceLedgerService,
    private readonly balanceLedgerItemService: BalanceLedgerItemService,
    private cdr: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly roleUtils: RoleUtils
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeComponent();
  }

  private initializeComponent() {
    this.ledgerColumns = [
      { name: 'Date', prop: 'date' },
      { name: 'Main Category', prop: 'mainCategory' },
      { name: 'Sub Category', prop: 'subCategory' },
      { name: 'Party', prop: 'party' },
      { name: 'Quantity', prop: 'quantity' },
      { name: 'Rate', prop: 'rate' },
      { name: 'Unit', prop: 'unit' },
      { name: 'Amount', prop: 'amount' },
      { name: 'Credit', prop: 'credit' },
      { name: 'Balance', prop: 'balance' },
      // { name: 'Description', prop: 'description' },
    ];
    this.isLoading = true;
    this.getLedgerEntries();
    this.getLastBalanceLedger();
    this.getCategories();
  }

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

  onEditLedger(row: any) {
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.LIST_BALANCE_LEDGER], { queryParams: { mode: 'update', id: row.id } });
    this.showHideCreateAndUpdateForm();
  }

  onDeleteLedger(row: any) {
    // Check if user has permission to delete
    if (!this.roleUtils.canDeleteEntries()) {
      this.toastService.show('Only SuperAdmin can delete balance ledger entries', 'info');
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete this balance ledger entry?\n\n` +
      `This will:\n` +
      `• Delete the balance ledger entry permanently\n` +
      `• Recalculate balances for all subsequent entries\n` +
      `• This action cannot be undone`
    );
    
    if (confirmDelete) {
      this.isLoading = true;
      console.log('Deleting balance ledger entry:', row);
      
      // Progress callback for large operations
      const progressCallback = (progress: number) => {
        this.deleteProgress = progress;
        if (progress > 0) {
          this.toastService.show(`Processing... ${progress.toFixed(1)}% complete`, 'info');
        }
      };

      this.balanceLedgerService.deleteLedgerWithRecalculation(row.id, progressCallback)
        .subscribe({
          next: () => {
            console.log('Balance ledger entry deleted successfully with balance recalculation');
            this.toastService.show('Balance ledger entry deleted and balances recalculated successfully', 'success');
            // Refresh the data to show updated balances
            this.initializeComponent();
          },
          error: (error) => {
            console.error('Error deleting balance ledger entry:', error);
            this.toastService.show('Error deleting balance ledger entry. Please try again.', 'danger');
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

  createEntry() {
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.LIST_BALANCE_LEDGER], { queryParams: { mode: 'create' } });
    this.showHideCreateAndUpdateForm();
  }

  onStatusChange(row: BalanceLedgerEntry) {
    console.log('Status changed for row:', row);
    
    // Check if user can approve entries
    if (!this.roleUtils.canApproveEntries()) {
      this.toastService.show('You do not have permission to approve entries', 'danger');
      return;
    }
    
    // Update status in Firebase or local array
    row.status = row.status === 'pending' ? 'approved' : 'pending';
    row.approvedBy = this.roleUtils.getCurrentUserId() || undefined;
    row.approvedByName = this.roleUtils.getCurrentUserName() || undefined;
    
    this.balanceLedgerService.updateLedger(row.id!, row)
      .subscribe({
        next: () => {
          this.toastService.show(`Entry ${row.status === 'approved' ? 'approved' : 'reverted to pending'} successfully`, 'success');
          this.getLedgerEntries();
        },
        error: (error) => {
          console.error('Error updating balance ledger entry:', error);
          this.toastService.show('Error updating entry status. Please try again.', 'danger');
        }
      })
  }




  closeLedgerForm(event: boolean) {
    console.log(event);
    if (event) {
      this.showLedgerForm = false;
      this.router.navigate([EndPoints.LIST_BALANCE_LEDGER]);
      this.initializeComponent();
    }
  }

  public preview() {
    this.isEditMode = !this.isEditMode;
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.LIST_BALANCE_LEDGER]);
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
    this.initializeComponent();
  }

  public cancelPreviewMode() {
    this.isEditMode = !this.isEditMode;
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
  }

  onFilterChanged(filters: any) {
    console.log('Filters applied:', filters);
    // Call service or update table data
    const { party, mainCategory, subCategory, credit, item, dateFilter } = filters;
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;

    this.filteredRows = [];
    if (party || mainCategory || subCategory || credit || item || dateFilter) {
      this.filteredRows = dataToFilter.filter(entry => {
        let isMatch = true;

        // Filter by party
        if (party && entry.party !== party) {
          isMatch = false;
        }

        // Filter by mainCategory
        if (mainCategory && entry.mainCategory !== mainCategory) {
          isMatch = false;
        }

        // Filter by subCategory
        if (subCategory && entry.subCategory !== subCategory) {
          isMatch = false;
        }

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

        // Filter by itemId (item)
        if (item) {
          if (entry.itemId !== item) {
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


  public getCategories(): void {
    this.balanceLedgerItemService.getAll().subscribe({
      next: (items) => {
        console.log('Items:', items);
        this.items = items;
        this.populateFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting categories:', error);
      },
      complete: () => {
      }
    })
  }

  private populateFilterOptions(): void {
    // Extract unique values from ledger data for filter options
    const uniqueParties = new Set<string>();
    const uniqueMainCategories = new Set<string>();
    const uniqueSubCategories = new Set<string>();

    this.ledgerData.forEach(entry => {
      if (entry.party) uniqueParties.add(entry.party);
      if (entry.mainCategory) uniqueMainCategories.add(entry.mainCategory);
      if (entry.subCategory) uniqueSubCategories.add(entry.subCategory);
    });

    this.parties = Array.from(uniqueParties).sort();
    this.mainCategories = Array.from(uniqueMainCategories).sort();
    this.subCategories = Array.from(uniqueSubCategories).sort();
  }

  private getLedgerEntries() {
    this.balanceLedgerService.getLedgerEntries().subscribe(
      {
        next: (ledgerEntries: any) => {
          // Sanitize all balance ledger entries to ensure amount, credit, and balance are integers
          this.ledgerData = ledgerEntries.map((entry: any) => this.sanitizeBalanceLedgerEntry(entry));
          this.todayEntries = this.getTodayEntries(this.ledgerData);
          this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
          console.log("Ledger : ", this.ledgerData);
          this.populateFilterOptions(); // Populate filter options after data is loaded
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
   * @param entries Array of balance ledger entries
   * @returns Array of entries created today
   */
  private getTodayEntries(entries: BalanceLedgerEntry[]): BalanceLedgerEntry[] {
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

    console.log(`Today's balance entries found: ${todayEntries.length} out of ${entries.length} total entries`);
    return todayEntries;
  }

  private getLastBalanceLedger() {
    this.balanceLedgerService.getLatestEntry().subscribe(
      {
        next: (ledgerEntries: any) => {
          // Sanitize the latest balance ledger entry to ensure balance is an integer
          this.lastLedger = ledgerEntries ? this.sanitizeBalanceLedgerEntry(ledgerEntries) : null;
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

  get todaysBalance(): number | null {
    if (!this.todayEntries || this.todayEntries.length === 0) return null;
    const totalCreditSum =  this.todayEntries.reduce((acc: number, curr: BalanceLedgerEntry) => {
      return acc + NumberUtils.sanitizeToInteger(curr.amount);
    }, 0);
    const totalDebitSum =  this.todayEntries.reduce((acc: number, curr: BalanceLedgerEntry) => {
      return acc + NumberUtils.sanitizeToInteger(curr.credit);
    }, 0);
    return totalCreditSum - totalDebitSum;
  }

  get currentBalance(): number | null {
    return this.isEditMode ? this.todaysBalance : (this.lastLedger ? NumberUtils.sanitizeToInteger(this.lastLedger.balance) : null);
  }

  get currentExportConfig(): ExportConfig {
    return {
      ...this.exportConfig,
      currentBalance: this.currentBalance,
      exportFullData: true // Enable full data export by default
    };
  }

  // ==================== ROLE-BASED GETTERS ====================

  get canCreateEntries(): boolean {
    return this.roleUtils.canCreateEntries();
  }

  get canEditEntries(): boolean {
    return this.roleUtils.canEditEntries();
  }

  get canDeleteEntries(): boolean {
    return this.roleUtils.canDeleteEntries();
  }

  get canApproveEntries(): boolean {
    return this.roleUtils.canApproveEntries();
  }

  get canExportData(): boolean {
    return this.roleUtils.canExportData();
  }

  get currentUserDisplayName(): string {
    return this.roleUtils.getUserDisplayName();
  }

  get currentUserRole(): string | null {
    return this.roleUtils.getCurrentUserRole();
  }

  // Export event handlers
  onExportStarted(type: string) {
    console.log(`Starting ${type} export...`);
  }

  onExportCompleted(type: string) {
    console.log(`${type} export completed successfully`);
  }

  private isDateInRange(entry: BalanceLedgerEntry, dateFilter: any): boolean {
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
   * Sanitize balance ledger entry data to ensure amount, credit, and balance are integers
   * @param entry - The balance ledger entry to sanitize
   * @returns Sanitized balance ledger entry
   */
  private sanitizeBalanceLedgerEntry(entry: any): any {
    return {
      ...entry,
      amount: NumberUtils.sanitizeToInteger(entry.amount),
      credit: NumberUtils.sanitizeToInteger(entry.credit),
      balance: NumberUtils.sanitizeToInteger(entry.balance)
    };
  }
}
