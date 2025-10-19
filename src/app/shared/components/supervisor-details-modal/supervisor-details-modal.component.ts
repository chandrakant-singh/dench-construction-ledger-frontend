import { Component, Input, OnInit, OnDestroy, OnChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { AppUser } from '../../../core/models/user.model';
import { LedgerEntry } from '../../../core/models/ledger.model';
import { StockLedgerEntry } from '../../../core/models/stock-ledger';
import { BalanceLedgerEntry } from '../../../core/models/balance-ledger';

import { LedgerService } from '../../../core/services/ledger.service';
import { StockLedgerService } from '../../../core/services/stock-ledger.service';
import { BalanceLedgerService } from '../../../core/services/balance-ledger.service';
import { ToastService } from '../../../core/services/toaster.service';

export interface SupervisorStats {
  expenditureEntries: number;
  stockEntries: number;
  balanceEntries: number;
  totalExpenditure: number;
  totalStockIn: number;
  totalStockOut: number;
  totalBalance: number;
  finalExpenditureBalance: number;
  finalStockBalance: number;
  finalBalanceAmount: number;
}

@Component({
  selector: 'app-supervisor-details-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './supervisor-details-modal.component.html',
  styleUrl: './supervisor-details-modal.component.scss'
})
export class SupervisorDetailsModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() supervisor: AppUser | null = null;
  @Input() isVisible: boolean = false;
  @Output() modalClose = new EventEmitter<void>();

  // Services
  private ledgerService = inject(LedgerService);
  private stockLedgerService = inject(StockLedgerService);
  private balanceLedgerService = inject(BalanceLedgerService);
  private toastService = inject(ToastService);

  // Component state
  private destroy$ = new Subject<void>();
  activeTab: 'expenditure' | 'stock' | 'balance' = 'expenditure';
  isLoading: boolean = false;
  isLoadingStats: boolean = false;

  // Data
  expenditureData: LedgerEntry[] = [];
  stockData: StockLedgerEntry[] = [];
  balanceData: BalanceLedgerEntry[] = [];
  supervisorStats: SupervisorStats = {
    expenditureEntries: 0,
    stockEntries: 0,
    balanceEntries: 0,
    totalExpenditure: 0,
    totalStockIn: 0,
    totalStockOut: 0,
    totalBalance: 0,
    finalExpenditureBalance: 0,
    finalStockBalance: 0,
    finalBalanceAmount: 0
  };

  // Search and filters
  searchTerm: string = '';
  filteredExpenditureData: LedgerEntry[] = [];
  filteredStockData: StockLedgerEntry[] = [];
  filteredBalanceData: BalanceLedgerEntry[] = [];

  ngOnInit(): void {
    if (this.supervisor && this.isVisible) {
      this.loadSupervisorData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    if (this.supervisor && this.isVisible) {
      this.loadSupervisorData();
    }
  }

  private loadSupervisorData(): void {
    if (!this.supervisor) return;

    this.isLoading = true;
    this.isLoadingStats = true;

    // Load all three ledger types in parallel
    forkJoin({
      expenditure: this.ledgerService.getLedgerEntries(this.supervisor.uid),
      stock: this.stockLedgerService.getLedgerEntries(this.supervisor.uid),
      balance: this.balanceLedgerService.getLedgerEntries(this.supervisor.uid)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.expenditureData = data.expenditure;
        this.stockData = data.stock;
        this.balanceData = data.balance;

        // Initialize filtered data
        this.filteredExpenditureData = [...this.expenditureData];
        this.filteredStockData = [...this.stockData];
        this.filteredBalanceData = [...this.balanceData];

        // Calculate stats
        this.calculateStats();
        
        this.isLoading = false;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading supervisor data:', error);
        this.toastService.show('Error loading supervisor data', 'danger');
        this.isLoading = false;
        this.isLoadingStats = false;
      }
    });
  }

  private calculateStats(): void {
    // Calculate final balances (last entry's balance)
    const finalExpenditureBalance = this.expenditureData.length > 0 
      ? this.expenditureData[0].balance || 0 
      : 0;
    
    const finalStockBalance = this.stockData.length > 0 
      ? this.stockData[0].balance || 0 
      : 0;
    
    const finalBalanceAmount = this.balanceData.length > 0 
      ? this.balanceData[0].balance || 0 
      : 0;

    this.supervisorStats = {
      expenditureEntries: this.expenditureData.length,
      stockEntries: this.stockData.length,
      balanceEntries: this.balanceData.length,
      totalExpenditure: this.expenditureData.reduce((sum, entry) => sum + (entry.debit || 0), 0),
      totalStockIn: this.stockData.reduce((sum, entry) => sum + (entry.stockIn || 0), 0),
      totalStockOut: this.stockData.reduce((sum, entry) => sum + (entry.stockOut || 0), 0),
      totalBalance: this.balanceData.reduce((sum, entry) => sum + (entry.amount || 0), 0),
      finalExpenditureBalance,
      finalStockBalance,
      finalBalanceAmount
    };
  }

  onTabChange(tab: 'expenditure' | 'stock' | 'balance'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    if (!this.searchTerm.trim()) {
      this.filteredExpenditureData = [...this.expenditureData];
      this.filteredStockData = [...this.stockData];
      this.filteredBalanceData = [...this.balanceData];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();

    // Filter expenditure data
    this.filteredExpenditureData = this.expenditureData.filter(entry =>
      entry.description?.toLowerCase().includes(searchLower) ||
      entry.modeOfPayment?.toLowerCase().includes(searchLower) ||
      entry.hintBy?.toLowerCase().includes(searchLower)
    );

    // Filter stock data
    this.filteredStockData = this.stockData.filter(entry =>
      entry.mainCategory?.toLowerCase().includes(searchLower) ||
      entry.subCategory?.toLowerCase().includes(searchLower) ||
      entry.party?.toLowerCase().includes(searchLower) ||
      entry.description?.toLowerCase().includes(searchLower)
    );

    // Filter balance data
    this.filteredBalanceData = this.balanceData.filter(entry =>
      entry.party?.toLowerCase().includes(searchLower) ||
      entry.mainCategory?.toLowerCase().includes(searchLower) ||
      entry.subCategory?.toLowerCase().includes(searchLower) ||
      entry.itemName?.toLowerCase().includes(searchLower)
    );
  }

  getCurrentData(): any[] {
    switch (this.activeTab) {
      case 'expenditure':
        return this.filteredExpenditureData;
      case 'stock':
        return this.filteredStockData;
      case 'balance':
        return this.filteredBalanceData;
      default:
        return [];
    }
  }

  getCurrentFinalBalance(): number {
    switch (this.activeTab) {
      case 'expenditure':
        return this.supervisorStats.finalExpenditureBalance;
      case 'stock':
        return this.supervisorStats.finalStockBalance;
      case 'balance':
        return this.supervisorStats.finalBalanceAmount;
      default:
        return 0;
    }
  }

  getBalanceColorClass(): string {
    const balance = this.getCurrentFinalBalance();
    return balance >= 0 ? 'text-success' : 'text-danger';
  }

  getCurrentColumns(): any[] {
    switch (this.activeTab) {
      case 'expenditure':
        return [
          { name: 'Date', prop: 'date' },
          { name: 'Description', prop: 'description' },
          { name: 'Debit', prop: 'debit' },
          { name: 'Credit', prop: 'credit' },
          { name: 'Status', prop: 'status' }
        ];
      case 'stock':
        return [
          { name: 'Date', prop: 'date' },
          { name: 'Category', prop: 'mainCategory' },
          { name: 'Party', prop: 'party' },
          { name: 'Stock In', prop: 'stockIn' },
          { name: 'Stock Out', prop: 'stockOut' },
          { name: 'Status', prop: 'status' }
        ];
      case 'balance':
        return [
          { name: 'Date', prop: 'date' },
          { name: 'Party', prop: 'party' },
          { name: 'Item', prop: 'itemName' },
          { name: 'Qty', prop: 'quantity' },
          { name: 'Rate', prop: 'rate' },
          { name: 'Amount', prop: 'amount' },
          { name: 'Status', prop: 'status' }
        ];
      default:
        return [];
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }

  closeModal(): void {
    this.isVisible = false;
    this.supervisor = null;
    this.activeTab = 'expenditure';
    this.searchTerm = '';
    this.expenditureData = [];
    this.stockData = [];
    this.balanceData = [];
    this.modalClose.emit();
  }
}
