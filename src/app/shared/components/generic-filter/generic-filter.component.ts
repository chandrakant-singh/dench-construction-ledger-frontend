import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-generic-filter',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './generic-filter.component.html',
  styleUrl: './generic-filter.component.scss'
})
export class GenericFilterComponent {
  @Input() filters: string[] = []; // e.g. ['credit', 'mainCategory']
  @Input() options: any = {}; // e.g. { mainCategory: ['A', 'B'] }

  @Output() filterChanged = new EventEmitter<any>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    const formGroup: any = {};
    this.filters.forEach(filter => {
      if (filter === 'dateFilter') {
        // Add date filter specific controls
        formGroup['dateFilterType'] = [''];
        formGroup['fromDate'] = [''];
        formGroup['toDate'] = [''];
      } else {
        formGroup[filter] = [''];
      }
    });
    this.filterForm = this.fb.group(formGroup);
  }

  applyFilters() {
    const activeFilters: any = {};
    for (const key of this.filters) {
      if (key === 'dateFilter') {
        // Handle date filter specially
        const dateFilterType = this.filterForm.get('dateFilterType')?.value;
        if (dateFilterType) {
          activeFilters['dateFilter'] = this.getDateFilterRange(dateFilterType);
        }
      } else {
        const value = this.filterForm.get(key)?.value;
        if (value !== '' && value !== null) {
          activeFilters[key] = value;
        }
      }
    }
    this.filterChanged.emit(activeFilters);
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterChanged.emit({});
  }

  onDateFilterTypeChange(event: Event) {
    const selectedType = (event.target as HTMLSelectElement).value;
    if (selectedType !== 'custom') {
      // Clear custom date inputs when not using custom range
      this.filterForm.patchValue({
        fromDate: '',
        toDate: ''
      });
    }
  }

  private getDateFilterRange(filterType: string): { type: string, fromDate?: string, toDate?: string } {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (filterType) {
      case 'today':
        return {
          type: 'today',
          fromDate: formatDate(today),
          toDate: formatDate(today)
        };
      
      case 'last7days':
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 7);
        return {
          type: 'last7days',
          fromDate: formatDate(last7Days),
          toDate: formatDate(today)
        };
      
      case 'custom':
        const fromDate = this.filterForm.get('fromDate')?.value;
        const toDate = this.filterForm.get('toDate')?.value;
        return {
          type: 'custom',
          fromDate: fromDate || '',
          toDate: toDate || ''
        };
      
      default:
        return { type: 'all' };
    }
  }
}
