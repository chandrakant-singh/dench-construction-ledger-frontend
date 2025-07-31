import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgxDatatableComponent } from '../../shared/components/ngx-datatable/ngx-datatable.component';
import { EndPoints } from '../../shared/constants/endpoints';
import { StockLedgerEntry } from '../../core/models/stock-ledger';
import { StockLedgerService } from '../../core/services/stock-ledger.service';
import { CreateStockLedgerComponent } from "../../shared/components/create-stock-ledger/create-stock-ledger.component";
import { GenericFilterComponent } from '../../shared/components/generic-filter/generic-filter.component';
import { Offcanvas } from 'bootstrap';
import { StockLedgerCategoryService } from '../../core/services/stock-ledger-category.service';
import { StoreLedgerCategory } from '../../core/models/stock-ledger-category.model';

@Component({
  selector: 'app-list-stock-ledger',
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableComponent,
    CreateStockLedgerComponent,
    GenericFilterComponent
  ],
  templateUrl: './list-stock-ledger.component.html',
  styleUrl: './list-stock-ledger.component.scss'
})
export class ListStockLedgerComponent {
  isEditMode: boolean = true;
  isAccordionOpen = false;
  searchTerm: string = '';
  filteredRows: StockLedgerEntry[] = []; // Copy for filtering
  todayEntries: StockLedgerEntry[] = []; // Today's entries for edit mode
  lastStockLedger: StockLedgerEntry | null = null;
  private searchTimeout: any;
  // categories: StoreLedgerCategory = {
  //   id: '',
  //   category: {},
  //   createdBy: '',
  //   updatedBy: '',
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  //   createdByName: ''
  // };

  mainCategory: string[] = [];
  subCategory: (string | null)[] = [];

  ledgerData: Array<StockLedgerEntry> = [];
  showLedgerForm: boolean = false;

  isLoading: boolean = false;

  ledgerColumns = [
    { name: 'Date', prop: 'date' },
    { name: 'Category', prop: 'mainCategory' },
    { name: 'Party', prop: 'subCategory' },
    { name: 'Stock In', prop: 'stockIn' },
    { name: 'Stock Out', prop: 'stockOut' },
    { name: 'Balance', prop: 'balance' },
  ];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly stockLedgerService: StockLedgerService,
    private cdr: ChangeDetectorRef,
    private readonly stockLedgerCategoryService: StockLedgerCategoryService
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
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
    this.router.navigate([EndPoints.LIST_STOCK_LEDGER], { queryParams: { mode: 'update', id: row.id } });
    this.showHideCreateAndUpdateForm();
  }

  onDeleteLedger(row: any) {
    console.log('Delete', row);
  }

  createEntry() {
    console.log('Create Entry');
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.LIST_STOCK_LEDGER], { queryParams: { mode: 'create' } });
    this.showHideCreateAndUpdateForm();
  }

  exportToExcel(): void {
    const exportData = this.filteredRows.map(row => ({
      'Date': row.date,
      'Category': row.mainCategory,
      'Party': row.subCategory,
      'Credit': row.stockIn,
      'Debit': row.stockOut,
      'Balance': row.balance,
      'Description': row.description,
    }));


    const fileName = `Stock-Ledger-${new Date().toLocaleDateString()}.xlsx`;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData); // or your data array
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

  public getCategories() {
    this.stockLedgerCategoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories:', categories);
        // this.categories = categories[0];
        this.mainCategory = categories && categories[0] && Object.keys(categories[0].category);
        this.subCategory = categories && categories[0] && (Object.values(categories[0].category)?.filter(value => value !== null).flat() ?? []);
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
      this.router.navigate([EndPoints.LIST_STOCK_LEDGER]);
      this.initializeComponent();
    }
  }

  public preview() {
    this.isEditMode = !this.isEditMode;
    this.showLedgerForm = false;
    this.router.navigate([EndPoints.LIST_STOCK_LEDGER]);
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
    this.initializeComponent();
  }

  public cancelPreviewMode() {
    this.isEditMode = !this.isEditMode;
    this.filteredRows = this.isEditMode ? this.todayEntries : this.ledgerData;
  }

  private getLedgerEntries() {
    this.stockLedgerService.getLedgerEntries().subscribe(
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
          this.lastStockLedger = ledgerEntries;
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
    const { mainCategory, subCategory } = filters;
    const dataToFilter = this.isEditMode ? this.todayEntries : this.ledgerData;
    
    this.filteredRows = [];
    if (mainCategory || subCategory) {
      this.filteredRows = dataToFilter.filter(entry => {
        let isMatch = true;

        // Filter by mainCategory (item)
        if (mainCategory) {
          if (entry.mainCategory !== mainCategory) {
            isMatch = false;
          }
        }

        // Filter by subCategory
        if (subCategory) {
          if (entry.subCategory !== subCategory) {
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
