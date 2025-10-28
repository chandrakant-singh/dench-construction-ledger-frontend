import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { StockLedgerEntry } from '../../../core/models/stock-ledger';

export interface StockSummaryNode {
  id: string;
  name: string;
  type: 'category' | 'subcategory' | 'party';
  parentId?: string;
  stockIn: number;
  stockOut: number;
  balance: number;
  isExpanded: boolean;
  children: StockSummaryNode[];
  entries: StockLedgerEntry[];
}

@Component({
  selector: 'app-stock-summary',
  imports: [CommonModule, NgxDatatableModule],
  templateUrl: './stock-summary.component.html',
  styleUrl: './stock-summary.component.scss'
})
export class StockSummaryComponent implements OnInit, OnChanges {
  @Input() ledgerData: StockLedgerEntry[] = [];
  @Output() toggleView = new EventEmitter<boolean>();

  summaryData: StockSummaryNode[] = [];
  selectedNode: StockSummaryNode | null = null;
  isDetailsVisible: boolean = false;
  detailColumns: any[] = [
    { name: 'Date', prop: 'date' },
    { name: 'Main Category', prop: 'mainCategory' },
    { name: 'Sub Category', prop: 'subCategory' },
    { name: 'Party', prop: 'party' },
    { name: 'Stock In', prop: 'stockIn' },
    { name: 'Stock Out', prop: 'stockOut' },
    { name: 'Balance', prop: 'balance' }
  ];

  ngOnInit() {
    this.buildSummaryData();
  }

  ngOnChanges() {
    this.buildSummaryData();
  }

  private buildSummaryData() {
    if (!this.ledgerData || this.ledgerData.length === 0) {
      this.summaryData = [];
      return;
    }

    // Group data by main category
    const categoryGroups = this.groupBy(this.ledgerData, 'mainCategory');
    
    this.summaryData = Object.keys(categoryGroups).map(categoryName => {
      const categoryEntries = categoryGroups[categoryName];
      const categoryStockIn = categoryEntries.reduce((sum: number, entry: StockLedgerEntry) => sum + (entry.stockIn || 0), 0);
      const categoryStockOut = categoryEntries.reduce((sum: number, entry: StockLedgerEntry) => sum + (entry.stockOut || 0), 0);
      const categoryBalance = categoryStockIn - categoryStockOut;

      // Group by sub-category within this category
      const subCategoryGroups = this.groupBy(categoryEntries, 'subCategory');
      const subCategories = Object.keys(subCategoryGroups).map(subCategoryName => {
        const subCategoryEntries = subCategoryGroups[subCategoryName];
        const subCategoryStockIn = subCategoryEntries.reduce((sum: number, entry: StockLedgerEntry) => sum + (entry.stockIn || 0), 0);
        const subCategoryStockOut = subCategoryEntries.reduce((sum: number, entry: StockLedgerEntry) => sum + (entry.stockOut || 0), 0);
        const subCategoryBalance = subCategoryStockIn - subCategoryStockOut;

        // Group by party within this sub-category
        const partyGroups = this.groupBy(subCategoryEntries, 'party');
        const parties = Object.keys(partyGroups).map(partyName => {
          const partyEntries = partyGroups[partyName];
          const partyStockIn = partyEntries.reduce((sum: number, entry: StockLedgerEntry) => sum + (entry.stockIn || 0), 0);
          const partyStockOut = partyEntries.reduce((sum: number, entry: StockLedgerEntry) => sum + (entry.stockOut || 0), 0);
          const partyBalance = partyStockIn - partyStockOut;

          return {
            id: `${categoryName}-${subCategoryName}-${partyName}`,
            name: partyName,
            type: 'party' as const,
            parentId: `${categoryName}-${subCategoryName}`,
            stockIn: partyStockIn,
            stockOut: partyStockOut,
            balance: partyBalance,
            isExpanded: false,
            children: [],
            entries: partyEntries
          };
        });

        return {
          id: `${categoryName}-${subCategoryName}`,
          name: subCategoryName,
          type: 'subcategory' as const,
          parentId: categoryName,
          stockIn: subCategoryStockIn,
          stockOut: subCategoryStockOut,
          balance: subCategoryBalance,
          isExpanded: false,
          children: parties,
          entries: subCategoryEntries
        };
      });

      return {
        id: categoryName,
        name: categoryName,
        type: 'category' as const,
        stockIn: categoryStockIn,
        stockOut: categoryStockOut,
        balance: categoryBalance,
        isExpanded: false,
        children: subCategories,
        entries: categoryEntries
      };
    });
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'Unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  toggleExpansion(node: StockSummaryNode) {
    node.isExpanded = !node.isExpanded;
  }

  showDetails(node: StockSummaryNode) {
    this.selectedNode = node;
    this.isDetailsVisible = true;
    this.toggleView.emit(true);
  }

  hideDetails() {
    this.selectedNode = null;
    this.isDetailsVisible = false;
    this.toggleView.emit(false);
  }

  getIconClass(node: StockSummaryNode): string {
    if (node.children.length === 0) return 'bi-circle';
    return node.isExpanded ? 'bi-chevron-down' : 'bi-chevron-right';
  }

  getRowClass(node: StockSummaryNode): string {
    let classes = 'summary-row';
    if (node.type === 'category') classes += ' category-row';
    else if (node.type === 'subcategory') classes += ' subcategory-row';
    else if (node.type === 'party') classes += ' party-row';
    return classes;
  }

  getIndentClass(node: StockSummaryNode): string {
    if (node.type === 'category') return 'ps-0';
    if (node.type === 'subcategory') return 'ps-3';
    if (node.type === 'party') return 'ps-5';
    return 'ps-0';
  }

  closeSummary() {
    this.toggleView.emit(false);
  }
}
