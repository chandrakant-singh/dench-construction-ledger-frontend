import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Offcanvas } from 'bootstrap';

import { NgxDatatableComponent } from '../../shared/components/ngx-datatable/ngx-datatable.component';
import { ExportDropdownComponent, ExportConfig } from '../../shared/components/export-dropdown/export-dropdown.component';
import { EndPoints } from '../../shared/constants/endpoints';
import { StockLedgerEntry } from '../../core/models/stock-ledger';
import { StockLedgerService } from '../../core/services/stock-ledger.service';
import { CreateStockLedgerComponent } from "../../shared/components/create-stock-ledger/create-stock-ledger.component";
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';
import { StockLedgerCategoryService } from '../../core/services/stock-ledger-category.service';
import { ToastService } from '../../core/services/toaster.service';
import { NumberUtils } from '../../core/utils/number.utils';
import { StorageUtils } from '../../core/utils/storage.utils';
import { RoleUtils } from '../../core/utils/role.utils';

@Component({
  selector: 'app-supervisor-list-stock-ledger',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableComponent,
    CreateStockLedgerComponent,
    GenericFilterComponent,
    ExportDropdownComponent
  ],
  templateUrl: './list-stock-ledger.component.html',
  styleUrl: './list-stock-ledger.component.scss'
})
export class SupervisorListStockLedgerComponent {
  isEditMode: boolean = true;
  isAccordionOpen = false;
  searchTerm: string = '';
  filteredRows: StockLedgerEntry[] = []; // Copy for filtering
  todayEntries: StockLedgerEntry[] = []; // Today's entries for edit mode
  lastStockLedger: StockLedgerEntry | null = null;
  private searchTimeout: any;

  // Filter options
  mainCategory: string[] = [];
  parties: string[] = [];
  subCategory: string[] = [];

  // Data
  ledgerData: Array<StockLedgerEntry> = [];
  showLedgerForm: boolean = false;

  // Loading
  isLoading: boolean = false;
  deleteProgress: number = 0;

  ledgerColumns = [
    { name: 'Date', prop: 'date' },
    { name: 'Main Category', prop: 'mainCategory' },
    { name: 'Sub Category', prop: 'subCategory' },
    { name: 'Party', prop: 'party' },
    { name: 'Stock In', prop: 'stockIn' },
    { name: 'Stock Out', prop: 'stockOut' },
    { name: 'Balance', prop: 'balance' },
    { name: 'Status', prop: 'status' },
    // { name: 'Description', prop: 'description' },
  ];

  // Export configuration
  exportConfig: ExportConfig = {
    filename: 'supervisor-stock-ledger',
    title: 'Supervisor Stock Ledger Report',
    showBalance: true,
    columns: [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Main Category', key: 'mainCategory', width: 25 },
      { header: 'Sub Category', key: 'subCategory', width: 25 },
      { header: 'Party', key: 'party', width: 25 },
      { header: 'Stock In', key: 'stockIn', width: 20, align: 'right' },
      { header: 'Stock Out', key: 'stockOut', width: 20, align: 'right' },
      { header: 'Balance', key: 'balance', width: 20, align: 'right' },
      { header: 'Status', key: 'status', width: 15 }
      // { header: 'Description', key: 'description', width: 35 }
    ]
  };

  constructor(
    private readonly router: Router,
    public readonly route: ActivatedRoute,
    private readonly stockLedgerService: StockLedgerService,
    private cdr: ChangeDetectorRef,
    private readonly stockLedgerCategoryService: StockLedgerCategoryService,
    private readonly toastService: ToastService,
    private readonly roleUtils: RoleUtils
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent() {
    this.isLoading = true;
    this.getLedgerEntries();
    this.getLastStockLedger();
    this.showHideCreateAndUpdateForm();
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
    this.router.navigate([EndPoints.SUPERVISOR_LIST_STOCK_LEDGER], { queryParams: { mode: 'update', id: row.id } });
    this.showHideCreateAndUpdateForm();
  }

  onStatusChange(row: StockLedgerEntry) {
    console.log('Supervisor - Status changed for row:', row);
    // Check if user can approve entries
    if (!this.roleUtils.canApproveEntries()) {
      this.toastService.show('You do not have permission to approve entries', 'danger');
      return;
    }
  }

  // Supervisors can only delete pending entries
  onDeleteLedger(row: any) {
    // Check if user has permission to delete
    if (!this.roleUtils.canDeleteEntries()) {
      this.toastService.show('Only SuperAdmin can delete stock ledger entries', 'info');
      return;
    }

    if (row.status !== 'pending') {
      this.toastService.show('Only pending entries can be deleted', 'info');
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete this stock ledger entry?\n\n` +
      `This will:\n` +
      `• Delete the stock ledger entry permanently\n` +
      `• Recalculate balances for all subsequent entries\n` +
      `• This action cannot be undone`
    );
    
    if (confirmDelete) {
      this.isLoading = true;
      console.log('Deleting stock ledger entry:', row);
      
      // Progress callback for large operations
      const progressCallback = (progress: number) => {
        this.deleteProgress = progress;
        if (progress > 0) {
          this.toastService.show(`Processing... ${progress.toFixed(1)}% complete`, 'info');
        }
      };

      this.stockLedgerService.deleteLedgerWithRecalculation(row.id, progressCallback)
        .subscribe({
          next: () => {
            console.log('Stock ledger entry deleted successfully with balance recalculation');
            this.toastService.show('Stock ledger entry deleted and balances recalculated successfully', 'success');
            // Refresh the data to show updated balances
            this.initializeComponent();
          },
          error: (error) => {
            console.error('Error deleting stock ledger entry:', error);
            this.toastService.show('Error deleting stock ledger entry. Please try again.', 'danger');
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
    console.log('Create Entry');
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.SUPERVISOR_LIST_STOCK_LEDGER], { queryParams: { mode: 'create' } });
    this.showHideCreateAndUpdateForm();
  }

  public getCategories() {
    this.stockLedgerCategoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories:', categories);
        if (categories && categories[0]) {
          this.mainCategory = Object.keys(categories[0].category);
          
          // Extract all parties from all categories
          this.parties = [];
          Object.values(categories[0].category).forEach(categoryParties => {
            if (categoryParties) {
              this.parties.push(...Object.keys(categoryParties));
            }
          });
          
          // Extract all sub-categories from all parties
          this.subCategory = [];
          Object.values(categories[0].category).forEach(categoryParties => {
            if (categoryParties) {
              Object.values(categoryParties).forEach(partySubCategories => {
                if (partySubCategories && Array.isArray(partySubCategories)) {
                  this.subCategory.push(...partySubCategories);
                }
              });
            }
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting categories:', error);
      },
      complete: () => {
      }
    })
  }

  closeLedgerForm(event: boolean) {
    console.log(event);
    if (event) {
      this.showLedgerForm = false;
      this.router.navigate([EndPoints.SUPERVISOR_LIST_STOCK_LEDGER]);
      this.initializeComponent();
    }
  }

  public preview() {
    this.isEditMode = !this.isEditMode;
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.SUPERVISOR_LIST_STOCK_LEDGER]);
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
    this.initializeComponent();
  }

  public cancelPreviewMode() {
    this.isEditMode = !this.isEditMode;
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
  }

  private getLedgerEntries() {
    this.stockLedgerService.getLedgerEntries(StorageUtils.getUid()).subscribe(
      {
        next: (ledgerEntries: any) => {
          // Sanitize all stock ledger entries to ensure stockIn, stockOut, and balance are integers
          this.ledgerData = ledgerEntries.map((entry: any) => this.sanitizeStockLedgerEntry(entry));
          this.todayEntries = this.getTodayEntries(this.ledgerData);
          this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
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
   * @param entries Array of stock ledger entries
   * @returns Array of entries created today
   */
  private getTodayEntries(entries: StockLedgerEntry[]): StockLedgerEntry[] {
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

    console.log(`Today's stock entries found: ${todayEntries.length} out of ${entries.length} total entries`);
    return todayEntries;
  }

  private getLastStockLedger() {
    this.stockLedgerService.getLatestEntry().subscribe(
      {
        next: (ledgerEntries: any) => {
          // Sanitize the latest stock ledger entry to ensure balance is an integer
          this.lastStockLedger = ledgerEntries ? this.sanitizeStockLedgerEntry(ledgerEntries) : null;
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

  // Filter Related functions
  onFilterChanged(filters: any) {
    console.log('Filters applied:', filters);
    // Call service or update table data
    const { mainCategory, party, subCategory, dateFilter } = filters;
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;

    this.filteredRows = [];
    if (mainCategory || party || subCategory || dateFilter) {
      this.filteredRows = dataToFilter.filter(entry => {
        let isMatch = true;

        // Filter by mainCategory
        if (mainCategory) {
          if (entry.mainCategory !== mainCategory) {
            isMatch = false;
          }
        }

        // Filter by party
        if (party) {
          if (entry.party !== party) {
            isMatch = false;
          }
        }

        // Filter by subCategory
        if (subCategory) {
          if (entry.subCategory !== subCategory) {
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
    const totalCreditSum =  this.todayEntries.reduce((acc: number, curr: StockLedgerEntry) => {
      return acc + NumberUtils.sanitizeToInteger(curr.stockIn);
    }, 0);
    const totalDebitSum =  this.todayEntries.reduce((acc: number, curr: StockLedgerEntry) => {
      return acc + NumberUtils.sanitizeToInteger(curr.stockOut);
    }, 0);
    return totalCreditSum - totalDebitSum;
  }

  get currentBalance(): number | null {
    return this.isEditMode ? this.todaysBalance : (this.lastStockLedger ? NumberUtils.sanitizeToInteger(this.lastStockLedger.balance) : null);
  }

  get currentExportConfig(): ExportConfig {
    return {
      ...this.exportConfig,
      currentBalance: this.currentBalance,
      exportFullData: true // Enable full data export by default
    };
  }

  // Export event handlers
  onExportStarted(type: string) {
    console.log(`Starting ${type} export...`);
  }

  onExportCompleted(type: string) {
    console.log(`${type} export completed successfully`);
  }

  private isDateInRange(entry: StockLedgerEntry, dateFilter: any): boolean {
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
   * Sanitize stock ledger entry data to ensure stockIn, stockOut, and balance are integers
   * @param entry - The stock ledger entry to sanitize
   * @returns Sanitized stock ledger entry
   */
  private sanitizeStockLedgerEntry(entry: any): any {
    return {
      ...entry,
      stockIn: NumberUtils.sanitizeToInteger(entry.stockIn),
      stockOut: NumberUtils.sanitizeToInteger(entry.stockOut),
      balance: NumberUtils.sanitizeToInteger(entry.balance)
    };
  }

  get canDeleteEntries(): boolean {
    return this.roleUtils.canDeleteEntries();
  }
}