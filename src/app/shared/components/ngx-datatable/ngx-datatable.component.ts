import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-ngx-datatable',
  imports: [CommonModule, NgxDatatableModule],
  templateUrl: './ngx-datatable.component.html',
  styleUrl: './ngx-datatable.component.scss'
})
export class NgxDatatableComponent {
  @Input() rows: any[] = [];
  @Input() columns: any[] = [];
  @Input() header: string = '';
  @Input() headerHelperText: string = '';
  @Input() limit: number = 10;

  @Output() rowClick = new EventEmitter<any>();
  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<any>();

  onRowClick(event: any) {
    this.rowClick.emit(event);
  }

  onEdit(row: any) {
    this.rowEdit.emit(row);
  }

  onDelete(row: any) {
    this.rowDelete.emit(row);
  }
}
