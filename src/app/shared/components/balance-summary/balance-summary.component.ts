import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BalanceLedgerEntry } from '../../../core/models/balance-ledger';

export interface BalanceSummaryNode {
  id: string;
  name: string;
  type: 'party' | 'category' | 'subcategory';
  parentId?: string;
  quantity: number;
  amount: number;
  credit: number;
  balance: number;
  isExpanded: boolean;
  children: BalanceSummaryNode[];
  entries: BalanceLedgerEntry[];
}

@Component({
  selector: 'app-balance-summary',
  imports: [CommonModule, NgxDatatableModule],
  templateUrl: './balance-summary.component.html',
  styleUrl: './balance-summary.component.scss'
})
export class BalanceSummaryComponent implements OnInit, OnChanges {
  @Input() ledgerData: BalanceLedgerEntry[] = [];
  @Output() toggleView = new EventEmitter<boolean>();

  summaryData: BalanceSummaryNode[] = [];
  selectedNode: BalanceSummaryNode | null = null;
  isDetailsVisible: boolean = false;
  detailColumns: any[] = [
    { name: 'Date', prop: 'date' },
    { name: 'Party', prop: 'party' },
    { name: 'Main Category', prop: 'mainCategory' },
    { name: 'Sub Category', prop: 'subCategory' },
    { name: 'Item', prop: 'itemName' },
    { name: 'Quantity', prop: 'quantity' },
    { name: 'Amount', prop: 'amount' },
    { name: 'Credit', prop: 'credit' },
    { name: 'Balance', prop: 'balance' }
  ];

  ngOnInit() {
    this.buildSummaryData();
  }

  ngOnChanges() {
    this.buildSummaryData();
  }

  /**
   * Build summary data with Party as parent → Main Category → Sub Category hierarchy
   * This matches the Balance Ledger form where Party is mandatory
   */
  private buildSummaryData() {
    if (!this.ledgerData || this.ledgerData.length === 0) {
      this.summaryData = [];
      return;
    }

    // Group data by Party (parent level - mandatory field)
    const partyGroups = this.groupBy(this.ledgerData, 'party');
    
    this.summaryData = Object.keys(partyGroups).map(partyName => {
      const partyEntries = partyGroups[partyName];
      const partyQuantity = partyEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.quantity || 0), 0);
      const partyAmount = partyEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.amount || 0), 0);
      const partyCredit = partyEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.credit || 0), 0);
      const partyBalance = partyAmount - partyCredit;

      // Group by main category within this party
      const categoryGroups = this.groupBy(partyEntries, 'mainCategory');
      const categories = Object.keys(categoryGroups).map(categoryName => {
        const categoryEntries = categoryGroups[categoryName];
        const categoryQuantity = categoryEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.quantity || 0), 0);
        const categoryAmount = categoryEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.amount || 0), 0);
        const categoryCredit = categoryEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.credit || 0), 0);
        const categoryBalance = categoryAmount - categoryCredit;

        // Group by sub-category within this category
        const subCategoryGroups = this.groupBy(categoryEntries, 'subCategory');
        const subCategories = Object.keys(subCategoryGroups).map(subCategoryName => {
          const subCategoryEntries = subCategoryGroups[subCategoryName];
          const subCategoryQuantity = subCategoryEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.quantity || 0), 0);
          const subCategoryAmount = subCategoryEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.amount || 0), 0);
          const subCategoryCredit = subCategoryEntries.reduce((sum: number, entry: BalanceLedgerEntry) => sum + (entry.credit || 0), 0);
          const subCategoryBalance = subCategoryAmount - subCategoryCredit;

          return {
            id: `${partyName}-${categoryName}-${subCategoryName}`,
            name: subCategoryName,
            type: 'subcategory' as const,
            parentId: `${partyName}-${categoryName}`,
            quantity: subCategoryQuantity,
            amount: subCategoryAmount,
            credit: subCategoryCredit,
            balance: subCategoryBalance,
            isExpanded: false,
            children: [],
            entries: subCategoryEntries
          };
        });

        return {
          id: `${partyName}-${categoryName}`,
          name: categoryName,
          type: 'category' as const,
          parentId: partyName,
          quantity: categoryQuantity,
          amount: categoryAmount,
          credit: categoryCredit,
          balance: categoryBalance,
          isExpanded: false,
          children: subCategories,
          entries: categoryEntries
        };
      });

      return {
        id: partyName,
        name: partyName,
        type: 'party' as const,
        quantity: partyQuantity,
        amount: partyAmount,
        credit: partyCredit,
        balance: partyBalance,
        isExpanded: false,
        children: categories,
        entries: partyEntries
      };
    });
  }

  /**
   * Group array items by a specific key
   * Handles empty/null values by grouping under 'Unknown'
   */
  private groupBy(array: BalanceLedgerEntry[], key: string): Record<string, BalanceLedgerEntry[]> {
    return array.reduce((groups, item) => {
      const group = item[key as keyof BalanceLedgerEntry] || '-';
      const groupKey = String(group);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, BalanceLedgerEntry[]>);
  }

  toggleExpansion(node: BalanceSummaryNode) {
    node.isExpanded = !node.isExpanded;
  }

  showDetails(node: BalanceSummaryNode) {
    this.selectedNode = node;
    this.isDetailsVisible = true;
    this.toggleView.emit(true);
  }

  hideDetails() {
    this.selectedNode = null;
    this.isDetailsVisible = false;
    this.toggleView.emit(false);
  }

  getIconClass(node: BalanceSummaryNode): string {
    if (node.children.length === 0) return 'bi-circle';
    return node.isExpanded ? 'bi-chevron-down' : 'bi-chevron-right';
  }

  /**
   * Get CSS classes for table rows based on node type
   * Party (parent) → Category → SubCategory (child)
   */
  getRowClass(node: BalanceSummaryNode): string {
    let classes = 'summary-row';
    if (node.type === 'party') classes += ' party-row';
    else if (node.type === 'category') classes += ' category-row';
    else if (node.type === 'subcategory') classes += ' subcategory-row';
    return classes;
  }

  /**
   * Get responsive indent classes for hierarchical display
   * Party (no indent) → Category (small indent) → SubCategory (larger indent)
   */
  getIndentClass(node: BalanceSummaryNode): string {
    if (node.type === 'party') return 'ps-0';
    if (node.type === 'category') return 'ps-3';
    if (node.type === 'subcategory') return 'ps-5';
    return 'ps-0';
  }

  closeSummary() {
    this.toggleView.emit(false);
  }
}

