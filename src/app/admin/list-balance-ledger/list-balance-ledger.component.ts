import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgxDatatableComponent } from '../../shared/components/ngx-datatable/ngx-datatable.component';
import { EndPoints } from '../../shared/constants/endpoints';
import { BalanceLedgerEntry, BalanceLedgerItem } from '../../core/models/balance-ledger';
import { BalanceLedgerService } from '../../core/services/balance-ledger.service';
import { CreateBalanceLedgerComponent } from '../../shared/components/create-balance-ledger/create-balance-ledger.component';
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';
import { BalanceLedgerItemService } from '../../core/services/balance-ledger-item.service';
import { Offcanvas } from 'bootstrap';

@Component({
  selector: 'app-list-balance-ledger',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableComponent,
    CreateBalanceLedgerComponent,
    GenericFilterComponent
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

  isLoading: boolean = false;

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
    private readonly route: ActivatedRoute,
    private readonly balanceLedgerService: BalanceLedgerService,
    private readonly balanceLedgerItemService: BalanceLedgerItemService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeComponent();
  }

  private initializeComponent() {
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
    console.log('Delete', row);
  }

  createEntry() {
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.LIST_BALANCE_LEDGER], { queryParams: { mode: 'create' } });
    this.showHideCreateAndUpdateForm();
  }

  // exportToExcel(): void {
  //   const exportData = this.filteredRows.map(row => ({
  //     'Date': row.date,
  //     'Item': row.itemName,
  //     'Quantity': row.quantity,
  //     'Rate': row.rate,
  //     'Amount': row.amount,
  //     'Credit': row.credit,
  //     'Balance': row.balance,
  //     'Description': row.description,
  //   }));

  //   const fileName = `LedgerData-${new Date().toLocaleDateString()}.xlsx`;
  //   const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData); // or your data array
  //   const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  //   const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  //   const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  //   FileSaver.saveAs(data, fileName);
  // }
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

    const fileName = `Balance-Ledger-${new Date().toLocaleDateString()}.xlsx`;

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
    const { credit, item } = filters;
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;

    this.filteredRows = [];
    if (credit || item) {
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

        // Filter by itemId (item)
        if (item) {
          if (entry.itemId !== item) {
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting categories:', error);
      },
      complete: () => {
      }
    })
  }

  private getLedgerEntries() {
    this.balanceLedgerService.getLedgerEntries().subscribe(
      {
        next: (ledgerEntries: any) => {
          this.ledgerData = ledgerEntries;
          this.todayEntries = this.getTodayEntries(ledgerEntries);
          this.filteredRows = this.isEditMode ? this.todayEntries : ledgerEntries;
          console.log("Ledger : ", ledgerEntries);
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

  get todaysBalance(): number | null {
    if (!this.todayEntries || this.todayEntries.length === 0) return null;
    const totalCreditSum =  this.todayEntries.reduce((acc: number, curr: BalanceLedgerEntry) => acc + curr.amount, 0);
    const totalDebitSum =  this.todayEntries.reduce((acc: number, curr: BalanceLedgerEntry) => acc + curr.credit, 0);
    return totalCreditSum - totalDebitSum;
  }
}
