import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, TemplateRef } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { RoleUtils } from '../../../core/utils/role.utils';
import { ToastService } from '../../../core/services/toaster.service';

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
  @Input() statusTemplate?: TemplateRef<any>;
  @Input() canEdit: boolean = true;
  @Input() canDelete: boolean = true;
  @Input() canApprove: boolean = true;

  @Output() rowClick = new EventEmitter<any>();
  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<any>();
  @Output() statusChange = new EventEmitter<any>();

  roleUtils: RoleUtils = inject(RoleUtils);
  toastService: ToastService = inject(ToastService);

  onRowClick(event: any) {
    this.rowClick.emit(event);
  }

  onEdit(row: any) {
    this.rowEdit.emit(row);
  }

  onDelete(row: any) {
    this.rowDelete.emit(row);
  }

  onStatusChange(row: any) {
    console.log('Status changed for row:', row);
    if (!this.roleUtils.canApproveEntries()) {
      this.toastService.show('You do not have permission to approve entries', 'danger');
      return;
    }
    this.statusChange.emit(row);
  }
}
