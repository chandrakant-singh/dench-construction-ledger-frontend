import { Component } from '@angular/core';
import { CreateLedgerEntryComponent } from '../../shared/components/create-ledger-entry/create-ledger-entry.component';

@Component({
  selector: 'app-add-entry',
  imports: [CreateLedgerEntryComponent],
  templateUrl: './add-entry.component.html',
  styleUrl: './add-entry.component.scss'
})
export class AddEntryComponent {

}
