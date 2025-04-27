import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LedgerService } from '../../../core/services/ledger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AppUser } from '../../../core/models/user.model';
import { LedgerEntry } from '../../../core/models/ledger.model';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';

@Component({
  selector: 'app-create-ledger-entry',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './create-ledger-entry.component.html',
  styleUrl: './create-ledger-entry.component.scss'
})
export class CreateLedgerEntryComponent {
  ledgerForm: FormGroup;
  appUser!: AppUser;
  existingLedger: LedgerEntry | null = null;
  ledgerId!: string;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private readonly ledgerService: LedgerService,
    private readonly userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.ledgerForm = this.fb.group({
      balance: [, [Validators.required]],
      debit: [],
      credit: [],
      description: ['', [Validators.required]],
      hintBy: [''],
      paymentMode: ['', [Validators.required]],
      depositedBy: [''],
      debitedBy: [''],
      date: ['', [Validators.required]],
      verifiedBy: [''],
      status: [{ value: 'pending', disabled: true }, [Validators.required]],
    });
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getLoggedInUserDetails();
  }

  private getLoggedInUserDetails() {
    this.userService.getUser()
      .then((user: AppUser) => {
        console.log("======= USER ========", user);
        this.appUser = user;
        this.getLedgerIdFromUrlAndPatchForm();
      })
      .catch((error) => {
        console.log("======= ERROR ========", error);
      })
      .finally(() => {
        this.handleStatusEnableDisable();
      });
  }

  private handleStatusEnableDisable() {
    if (this.appUser.role === 'admin' && this.existingLedger) {
      this.ledgerForm.get('status')?.enable();
    }
  }

  onSubmit() {
    if (this.ledgerForm.valid) {
      // You can emit this or add it to the table
      this.isLoading = true;
      if(this.existingLedger) {
        this.updateLedgerEntry();
      } else {
        this.createLedgerEntry();
      }
    }
  }

  createLedgerEntry() {
    if (this.ledgerForm.valid) {
      this.ledgerService.createLedger(
        {
          ...this.ledgerForm.value,
          status: 'pending',
          createdBy: this.appUser.uid,
          updatedBy: this.appUser.uid
        })
        .subscribe(
          {
            next: (id) => {
              console.log('Ledger entry created with ID:', id);
              this.ledgerForm.reset();
              this.checkAndRedirect();
            },
            error: (error) => {
              console.error('Error creating ledger entry:', error);
            },
            complete: () => {
              this.isLoading = false;
            }
          }
        )
      this.ledgerForm.reset();
    }
  }

  updateLedgerEntry() {
    if (this.ledgerForm.valid && this.existingLedger) {
      this.ledgerService.updateLedger(this.ledgerId, this.ledgerForm.value)
        .subscribe(
          {
            next: () => {
              console.log('Ledger entry updated successfully');
              this.checkAndRedirect();
            },
            error: (error) => {
              console.error('Error updating ledger entry:', error);
            },
            complete: () => {
              this.isLoading = false;
            }
          }
        )
    }
  }

  private checkAndRedirect() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect')
    if (redirectUrl) {
      this.router.navigate([redirectUrl]);
    }
  }

  private getLedgerIdFromUrlAndPatchForm() {
    this.ledgerId = this.route.snapshot.queryParams['id'];
    if (this.ledgerId) {
      this.ledgerService.getLedgerEntryById(this.ledgerId)
        .then((ledgerEntry: any) => {
          console.log("======= LEDGER ENTRY ========", ledgerEntry);
          this.existingLedger = ledgerEntry;
          this.ledgerForm.patchValue(ledgerEntry);
          this.handleStatusEnableDisable();
        })
        .catch((error) => {
          console.log("======= ERROR ========", error);
        })
    }
  }
}
