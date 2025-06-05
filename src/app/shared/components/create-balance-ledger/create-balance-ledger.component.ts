import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';

import { AppUser } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { DateUtils } from '../../../core/utils/date.utils';
import { balanceLedgerFormValidation, creditOrDebitRequired } from '../../../core/utils/form.utils';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { DialogComponent } from "../dialog/dialog.component";
import { BalanceLedgerItemService } from '../../../core/services/balance-ledger-item.service';
import { BalanceLedgerEntry, BalanceLedgerItem } from '../../../core/models/balance-ledger';
import { BalanceLedgerService } from '../../../core/services/balance-ledger.service';
declare var bootstrap: any;

@Component({
  selector: 'app-create-balance-ledger',
  imports: [CommonModule, ReactiveFormsModule, LoadingButtonComponent, DialogComponent],
  templateUrl: './create-balance-ledger.component.html',
  styleUrl: './create-balance-ledger.component.scss'
})
export class CreateBalanceLedgerComponent {
  @ViewChild('createItem') createItemTemplate!: TemplateRef<any>;
  dialogTemplate!: TemplateRef<any>;
  dialogTitle: string = '';
  dialogType: 'item' | null = null;

  balanceLedgerForm!: FormGroup;
  itemForm!: FormGroup;

  appUser!: AppUser;
  lastLedger: BalanceLedgerEntry | null = null;
  ledgerId!: string;
  existingLedger: BalanceLedgerItem | null = null;
  isLoading: boolean = false;
  balanceLedgerItems: BalanceLedgerItem[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly balanceLedgerService: BalanceLedgerService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly balanceLedgerItemService: BalanceLedgerItemService
  ) {
    this.initializeForm();
    this.initializeItemForm();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeFormData();
    this.getItems();
  }

  createLedgerEntry() {
    if (this.balanceLedgerForm.valid) {
      this.handleBalanceAmount();
      this.balanceLedgerService.createLedger(
        {
          ...this.balanceLedgerForm.getRawValue(),
          createdBy: this.appUser.uid,
          updatedBy: this.appUser.uid,
        })
        .subscribe(
          {
            next: (id) => {
              console.log('Ledger entry created with ID:', id);
              this.balanceLedgerForm.reset();
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
      this.balanceLedgerForm.reset();
    }
  }

  updateLedgerEntry() {
    if (this.balanceLedgerForm.valid && this.existingLedger) {
      this.balanceLedgerService.updateLedger(this.ledgerId, this.balanceLedgerForm.getRawValue())
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

  // Item Methods
  public createItem(item: string) {
    this.balanceLedgerItemService.create({
      name: item,
      createdBy: this.appUser.uid,
      updatedBy: this.appUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByName: this.appUser.name
    }).subscribe({
      next: (id) => {
        console.log('Created with ID:', id);
        this.getItems();
      },
      error: (error) => {
        console.error('Error creating:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  public getItems() {
    this.balanceLedgerItemService.getAll().subscribe({
      next: (items) => {
        console.log('Items:', items);
        this.balanceLedgerItems = items;
      },
      error: (error) => {
        console.error('Error getting categories:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  public get items(): BalanceLedgerItem[] {
    return this.balanceLedgerItems || [];
  }

  public handleDialogConfirm(event: any) {
    if (this.dialogType === 'item' && event) {
      this.confirmItem();
    }
    this.hideDialog();
  }

  hideDialog() {
    const modalElement = document.getElementById('reusableModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }

  openDialog(type: 'item') {
    this.dialogType = type;

    if (type === 'item') {
      this.dialogTemplate = this.createItemTemplate;
      this.dialogTitle = 'Add Item';
    }

    // Manually trigger modal open if required
    const modal = new bootstrap.Modal(document.getElementById('reusableModal')!);
    modal.show();
  }

  confirmItem() {
    const newCategory = this.itemForm.get('itemName')?.value;
    this.createItem(newCategory);
  }
  // END

  private initializeFormData() {
    forkJoin({
      userDetails: this.userService.getUser(),
      latestLedger: this.balanceLedgerService.getLatestEntry(),
    }).subscribe({
      next: ({ userDetails, latestLedger }) => {
        console.log('User:', userDetails);
        console.log('Ledger:', latestLedger);
        this.appUser = userDetails;
        this.lastLedger = latestLedger;
      },
      error: (err) => {
        console.error('Error in one of the API calls', err);
      },
      complete: () => {
        this.initializeLoggedInUserDetails();
        this.initializeLatestLedgerEntry();
      }
    })
  }

  private initializeLoggedInUserDetails() {
    this.getLedgerIdFromUrlAndPatchForm();
    this.handleFormValidation();
  }

  private getLedgerIdFromUrlAndPatchForm() {
    this.ledgerId = this.route.snapshot.queryParams['id'];
    if (this.ledgerId) {
      this.balanceLedgerService.getLedgerEntryById(this.ledgerId)
        .then((ledgerEntry: any) => {
          console.log("======= LEDGER ENTRY ========", ledgerEntry);
          this.existingLedger = ledgerEntry;
          this.balanceLedgerForm.patchValue(ledgerEntry);
          this.handleFormValidation();
        })
        .catch((error) => {
          console.log("======= ERROR ========", error);
        })
    }
  }

  private handleFormValidation() {
    // For existing ledger
    if (this.existingLedger) {
      this.balanceLedgerForm.get('rate')?.disable();
      this.balanceLedgerForm.get('quantity')?.disable();
      this.balanceLedgerForm.get('credit')?.disable();
    }

    this.balanceLedgerForm.updateValueAndValidity();
  }

  private initializeLatestLedgerEntry(): any {
    this.balanceLedgerForm.patchValue({ balance: this.lastLedger?.balance || 0 });
  }

  onMainCategoryChange(event: Event) {
    console.log('Main Category:', (event.target as HTMLSelectElement).value);
    const selectedItem = this.balanceLedgerItems.find(item => item.id === (event.target as HTMLSelectElement).value);
    console.log('Selected Item:', selectedItem);
    if (selectedItem) {
      this.balanceLedgerForm.patchValue({ itemName: selectedItem.name });
    }
  }

  calculateBalance() {
    const amount = +this.balanceLedgerForm.get('amount')?.value || 0;
    const debit = +this.balanceLedgerForm.get('credit')?.value || 0;
    const balance = (this.lastLedger?.balance || 0) + amount - debit;
    this.balanceLedgerForm.patchValue({ balance });
  }

  calculateAmount() {
    const quantity = +this.balanceLedgerForm.get('quantity')?.value || 0;
    const rate = +this.balanceLedgerForm.get('rate')?.value || 0;
    const amount = (quantity && rate) ? quantity * rate : (quantity ?? 0) * (rate ?? 0);
    this.balanceLedgerForm.patchValue({ amount });
    if(amount > 0) {
      this.calculateBalance();
    }
  }

  onSubmit() {
    if (this.balanceLedgerForm.valid) {
      this.isLoading = true;
      if (this.existingLedger) {
        this.updateLedgerEntry();
      } else {
        this.createLedgerEntry();
      }
    }
  }

  onCancel() {
    this.checkAndRedirect();
  }

  private checkAndRedirect() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect')
    if (redirectUrl) {
      this.router.navigate([redirectUrl]);
    }
  }

  private initializeForm() {
    this.balanceLedgerForm = this.fb.group({
      itemId: ['', Validators.required],
      itemName: [''],
      quantity: [''],
      rate: [''],
      amount: [{ value: 0, disabled: true }],
      credit: [''],
      balance: [{ value: 0, disabled: true }],
      date: [DateUtils.getTodayDate()],
      description: [''],
    }, { validators: balanceLedgerFormValidation() });
  }

  private initializeItemForm() {
    this.itemForm = this.fb.group({
      itemName: ['', Validators.required],
    });
  }

  private handleBalanceAmount() {
    // balance = previousBalance + credit - debit
    const formValue = this.balanceLedgerForm.getRawValue();
    const credit = Number(formValue.amount || 0);
    const debit = Number(formValue.credit || 0);
    const runningBalance = this.lastLedger?.balance || 0;

    const newBalance = runningBalance + credit - debit;
    this.balanceLedgerForm.patchValue({ balance: newBalance });
  }
}
