import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  @Input() title: string = 'Dialog';
  @Input() contentTemplate?: TemplateRef<any>; // for custom template like a form
  @Input() message?: string;                   // plain text message
  @Input() showCloseButton: boolean = true;
  @Input() confirmText: string = 'OK';
  @Input() cancelText: string = 'Cancel';
  @Output() confirmEvent = new EventEmitter<boolean>();

  close(modal: any) {
    modal.hide();
  }

  onConfirm() {
    this.confirmEvent.emit(true);
  }
}
