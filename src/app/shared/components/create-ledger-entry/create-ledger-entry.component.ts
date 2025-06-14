import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LedgerService } from '../../../core/services/ledger.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AppUser } from '../../../core/models/user.model';
import { LedgerEntry } from '../../../core/models/ledger.model';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { DateUtils } from '../../../core/utils/date.utils';
import { HttpErrorResponse } from '@angular/common/http';
import { creditOrDebitRequired } from '../../../core/utils/form.utils';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-create-ledger-entry',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './create-ledger-entry.component.html',
  styleUrl: './create-ledger-entry.component.scss'
})
export class CreateLedgerEntryComponent {
  @Output() closeLedgerForm = new EventEmitter<boolean>();

  ledgerForm!: FormGroup;
  appUser!: AppUser;
  existingLedger: LedgerEntry | null = null;
  ledgerId!: string;
  isLoading: boolean = false;
  lastLedgerEntry: LedgerEntry | null = null;
  allUsers: AppUser[] = [];

  constructor(
    private fb: FormBuilder,
    private readonly ledgerService: LedgerService,
    private readonly userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.route.queryParams.subscribe(params => {
      this.isLoading = true;
      this.resetAllTheForms();
      this.existingLedger = null;
      this.initializeFormData();
    });
  }

  private initializeFormData() {
    forkJoin({
      userDetails: this.userService.getUser(),
      latestLedger: this.ledgerService.getLatestEntry(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: ({ userDetails, latestLedger, users }) => {
        console.log('User:', userDetails);
        console.log('Ledger:', latestLedger);
        console.log('All Users:', users);
        this.appUser = userDetails;
        this.lastLedgerEntry = latestLedger;
        this.allUsers = users;
      },
      error: (err) => {
        console.error('Error in one of the API calls', err);
      },
      complete: () => {
        this.initializeLoggedInUserDetails();
        this.initializeLatestLedgerEntry();
      }
    });
  }

  onSubmit() {
    if (this.ledgerForm.valid) {
      // You can emit this or add it to the table
      this.isLoading = true;
      if (this.existingLedger) {
        this.updateLedgerEntry();
      } else {
        this.createLedgerEntry();
      }
    }
  }

  createLedgerEntry() {
    if (this.ledgerForm.valid) {
      this.handleBalanceAmount();
      this.ledgerService.createLedger(
        {
          ...this.ledgerForm.getRawValue(),
          status: 'pending',
          createdBy: this.appUser.uid,
          updatedBy: this.appUser.uid,
          depositedBy: this.ledgerForm.get('credit')?.value && (this.ledgerForm.get('depositedBy')?.value || this.appUser.uid),
          depositedByName: this.ledgerForm.get('credit')?.value && (this.ledgerForm.get('depositedByName')?.value || this.appUser.name),
          debitedBy: this.ledgerForm.get('debit')?.value && (this.ledgerForm.get('debitedBy')?.value || this.appUser.uid),
          debitedByName: this.ledgerForm.get('debit')?.value && (this.ledgerForm.get('debitedByName')?.value || this.appUser.name)
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
      this.ledgerService.updateLedger(this.ledgerId, this.ledgerForm.getRawValue())
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

  public get isAdmin() {
    return this.appUser.role === 'admin';
  }

  private initializeForm() {
    this.ledgerForm = this.fb.group({
      balance: [{ value: 0, disabled: true }],
      debit: [''],
      credit: [''],
      description: [''],
      hintBy: [''],
      paymentMode: ['bank'],
      depositedBy: [''],
      debitedBy: [''],
      date: [DateUtils.getTodayDate()],
      approvedBy: [''],
      status: [{ value: 'pending', disabled: true }],
      approvedByName: [''],
      depositedByName: [''],
      debitedByName: ['']
      ,
    }, { validators: creditOrDebitRequired() });
  }

  public onUserChange(event: Event, field: 'depositedBy' | 'debitedBy'): void {
    const selectedUid = (event.target as HTMLSelectElement).value;
    const selectedUser = this.allUsers.find(user => user.uid === selectedUid);
    console.log(`${field} selected user:`, selectedUser);
    if (field === 'depositedBy') {
      // handle depositedBy logic
      this.ledgerForm.patchValue({ 'depositedByName': selectedUser?.name });
    } else if (field === 'debitedBy') {
      // handle debitedBy logic
      this.ledgerForm.patchValue({ 'debitedByName': selectedUser?.name });
    }
  }

  public onCancel() {
    this.checkAndRedirect();
  }

  private initializeLoggedInUserDetails() {
    this.getLedgerIdFromUrlAndPatchForm();
    this.handleFormValidation();
  }

  private handleFormValidation() {
    this.ledgerForm.get('hintBy')?.setValidators([Validators.required]);

    // This is common for new ledger
    if (this.appUser.role === 'admin' && this.existingLedger) {
      // this.ledgerForm.get('status')?.enable();
      this.ledgerForm.get('depositedBy')?.setValidators([Validators.required]);
      this.ledgerForm.get('paymentMode')?.setValidators([Validators.required]);
      this.ledgerForm.get('approvedBy')?.setValidators([Validators.required]);
    } else {
      this.ledgerForm.get('hintBy')?.setValidators([Validators.required]);
    }

    // For existing ledger
    if (this.existingLedger) {
      this.ledgerForm.get('credit')?.disable();
      this.ledgerForm.get('debit')?.disable();
    } else {
      this.ledgerForm.get('credit')?.enable();
      this.ledgerForm.get('debit')?.enable();
    }

    this.ledgerForm.updateValueAndValidity();
  }

  private checkAndRedirect() {
    // const redirectUrl = this.route.snapshot.queryParamMap.get('redirect')
    // if (redirectUrl) {
    //   this.router.navigate([redirectUrl]);
    // }
    this.closeLedgerForm.emit(true);
  }

  private getLedgerIdFromUrlAndPatchForm() {
    this.ledgerId = this.route.snapshot.queryParams['id'];
    if (this.ledgerId) {
      this.ledgerService.getLedgerEntryById(this.ledgerId)
        .then((ledgerEntry: any) => {
          console.log("======= LEDGER ENTRY ========", ledgerEntry);
          this.existingLedger = ledgerEntry;
          this.ledgerForm.patchValue(ledgerEntry);
          this.handleFormValidation();
          this.isLoading = false;
        })
        .catch((error) => {
          console.log("======= ERROR ========", error);
        })
        .finally(() => {
          this.isLoading = false;
        })
    } else {
      this.existingLedger = null;
      this.isLoading = false;
    }
  }

  private initializeLatestLedgerEntry(): any {
    this.ledgerForm.patchValue({ balance: this.lastLedgerEntry?.balance || 0 });
  }

  /*
    We'll implement a hybrid model where:
    - You calculate and store the running balance at the time of saving.
    - You dynamically re-display it in the table in case any data changes after saving.
  */

  calculateBalance() {
    const stockIn = +this.ledgerForm.get('credit')?.value || 0;
    const stockOut = +this.ledgerForm.get('debit')?.value || 0;
    const balance = (this.lastLedgerEntry?.balance || 0) + stockIn - stockOut;
    this.ledgerForm.patchValue({ balance });
  }

  private handleBalanceAmount() {
    // balance = previousBalance + credit - debit
    const formValue = this.ledgerForm.getRawValue();
    const credit = Number(formValue.credit || 0);
    const debit = Number(formValue.debit || 0);
    const runningBalance = this.lastLedgerEntry?.balance || 0;

    const newBalance = runningBalance + credit - debit;
    this.ledgerForm.patchValue({ balance: newBalance });
  }

  private resetAllTheForms() {
    this.initializeForm();
  }
}
