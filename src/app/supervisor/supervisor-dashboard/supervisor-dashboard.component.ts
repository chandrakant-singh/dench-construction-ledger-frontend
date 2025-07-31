import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ActivatedRoute, Router } from '@angular/router';
import { Offcanvas } from 'bootstrap';

import { LedgerService } from '../../core/services/ledger.service';
import { LedgerEntry } from '../../core/models/ledger.model';
import { StorageUtils } from '../../core/utils/storage.utils';
import { EndPoints } from '../../shared/constants/endpoints';
import { AppUser } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { CreateLedgerEntryComponent } from '../../shared/components/create-ledger-entry/create-ledger-entry.component';
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';

@Component({
  selector: 'app-supervisor-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    CreateLedgerEntryComponent,
    GenericFilterComponent
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.scss'
})
export class SupervisorDashboardComponent {
  isEditMode: boolean = true;
  isAccordionOpen = false;
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('creditDebit', { static: true }) creditDebit!: TemplateRef<any>;

  filteredRows: any[] = []; // Copy for filtering
  todayEntries: any[] = []; // Today's entries for edit mode
  searchTerm: string = '';
  ledgerData: Array<LedgerEntry> = [];
  showLedgerForm: boolean = false;
  users: AppUser[] = [];
  
  private searchTimeout: any;
  lastLedger: LedgerEntry | null = null;

  columns: any = [];
  isLoading: boolean = false;

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
      {
        name: 'Credit/Debit',
        cellTemplate: this.creditDebit
      },
      { name: 'Description', prop: 'description' },
      { name: 'Hint By', prop: 'hintBy' },
      { name: 'Date', prop: 'date' },
      {
        name: 'Status',
        prop: 'status',
        cellTemplate: this.statusTpl
      },
    ];

    this.isLoading = true;
    this.getLedgerEntries();
    this.getLastStockLedger();
    this.getUsers();
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

  createEntry() {
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.SUPERVISOR_DASHBOARD], { queryParams: { mode: 'create' } });
    this.showHideCreateAndUpdateForm();
  }

  closeLedgerForm(event: boolean) {
    console.log(event);
    if (event) {
      this.showLedgerForm = false;
      this.router.navigate([EndPoints.SUPERVISOR_DASHBOARD]);
      this.initializeComponent();
    }
  }

  public preview() {
    this.isEditMode = !this.isEditMode;
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.SUPERVISOR_DASHBOARD]);
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
    this.initializeComponent();
  }

  public cancelPreviewMode() {
    this.isEditMode = !this.isEditMode;
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
  }

  private getLedgerEntries() {
    this.ledgerService.getLedgerEntries(StorageUtils.getUid()).subscribe(
      {
        next: (ledgerEntries: any) => {
          this.ledgerData = ledgerEntries;
          this.todayEntries = this.getTodayEntries(ledgerEntries);
          this.filteredRows = this.isEditMode ? this.todayEntries : ledgerEntries;
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

    console.log(`Today's supervisor entries found: ${todayEntries.length} out of ${entries.length} total entries`);
    return todayEntries;
  }

  private getLastStockLedger() {
    this.ledgerService.getLatestEntry().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.lastLedger = ledgerEntries;
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
    const { credit, debit, createdBy } = filters;
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;
    
    this.filteredRows = [];
    if (credit || debit || createdBy) {
      this.filteredRows = dataToFilter.filter(entry => {
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
}
