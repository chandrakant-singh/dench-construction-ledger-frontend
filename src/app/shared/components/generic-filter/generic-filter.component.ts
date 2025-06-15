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
      formGroup[filter] = [''];
    });
    this.filterForm = this.fb.group(formGroup);
  }

  applyFilters() {
    const activeFilters: any = {};
    for (const key of this.filters) {
      const value = this.filterForm.get(key)?.value;
      if (value !== '' && value !== null) {
        activeFilters[key] = value;
      }
    }
    this.filterChanged.emit(activeFilters);
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterChanged.emit({});
  }
}
