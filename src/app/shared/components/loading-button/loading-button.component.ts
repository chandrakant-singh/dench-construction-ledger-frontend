import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-button',
  imports: [CommonModule],
  templateUrl: './loading-button.component.html',
  styleUrl: './loading-button.component.scss'
})
export class LoadingButtonComponent {
  @Input() isLoading: boolean = true;
  @Input() btnDisable: boolean = false;
  @Input() label: string = 'Submit';
  @Input() loadingLabel: string = 'Submitting...';
  @Input() type: 'button' | 'submit' = 'submit'; // Optional for form submits
  @Input() btnClass: string = 'btn-primary'; // To allow passing btn-primary, btn-danger etc
}
