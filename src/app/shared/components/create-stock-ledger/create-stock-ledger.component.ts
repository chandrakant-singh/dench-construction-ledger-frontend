import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AppUser } from '../../../core/models/user.model';
import { StockLedgerService } from '../../../core/services/stock-ledger.service';
import { UserService } from '../../../core/services/user.service';
import { StockLedgerEntry } from '../../../core/models/stock-ledger';
import { DateUtils } from '../../../core/utils/date.utils';
import { creditOrDebitRequired } from '../../../core/utils/form.utils';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { DialogComponent } from "../dialog/dialog.component";
import { StockLedgerCategoryService } from '../../../core/services/stock-ledger-category.service';
import { StoreLedgerCategory } from '../../../core/models/stock-ledger-category.model';
declare var bootstrap: any;

@Component({
  selector: 'app-create-stock-ledger',
  imports: [CommonModule, ReactiveFormsModule, LoadingButtonComponent, DialogComponent],
  templateUrl: './create-stock-ledger.component.html',
  styleUrl: './create-stock-ledger.component.scss'
})
export class CreateStockLedgerComponent {
  @ViewChild('createMainCategory') createMainCategoryTemplate!: TemplateRef<any>;
  @ViewChild('createSubCategory') createSubCategoryTemplate!: TemplateRef<any>;
  dialogTemplate!: TemplateRef<any>;
  dialogTitle: string = '';
  dialogType: 'main' | 'sub' | null = null;

  stockLedgerForm!: FormGroup;
  mainCategoryForm!: FormGroup;
  subCategoryForm!: FormGroup;

  appUser!: AppUser;
  lastStockLedger: StockLedgerEntry | null = null;
  ledgerId!: string;
  existingLedger: StockLedgerEntry | null = null;
  isLoading: boolean = false;
  existingStockLedgerCategory!: StoreLedgerCategory;

  constructor(
    private readonly fb: FormBuilder,
    private readonly stockLedgerService: StockLedgerService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly stockLedgerCategoryService: StockLedgerCategoryService
  ) {
    this.initializeForm();
    this.initializeMainCategoryForm();
    this.initializeSubCategoryForm();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeFormData();
    this.getCategories();
  }

  createLedgerEntry() {
    if (this.stockLedgerForm.valid) {
      this.handleBalanceAmount();
      this.stockLedgerService.createLedger(
        {
          ...this.stockLedgerForm.getRawValue(),
          createdBy: this.appUser.uid,
          updatedBy: this.appUser.uid,
        })
        .subscribe(
          {
            next: (id) => {
              console.log('Ledger entry created with ID:', id);
              this.stockLedgerForm.reset();
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
      this.stockLedgerForm.reset();
    }
  }

  updateLedgerEntry() {
    if (this.stockLedgerForm.valid && this.existingLedger) {
      this.stockLedgerService.updateLedger(this.ledgerId, this.stockLedgerForm.getRawValue())
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

  // Main Category Methods

  public createCategory(category: string) {
    this.stockLedgerCategoryService.createCategory({
      category: { [category]: [null] },
      createdBy: this.appUser.uid,
      updatedBy: this.appUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByName: this.appUser.name
    }).subscribe({
      next: (id) => {
        console.log('Category created with ID:', id);
      },
      error: (error) => {
        console.error('Error creating category:', error);
      },
      complete: () => {
        this.isLoading = false;
        this.subCategoryForm.reset();
      }
    })
  }

  public updateCategory(payload: StoreLedgerCategory) {
    this.stockLedgerCategoryService.updateCategory(this.existingStockLedgerCategory.id, payload).subscribe({
      next: () => {
        console.log('Category updated successfully');
        this.getCategories();
      },
      error: (error) => {
        console.error('Error updating category:', error);
      },
      complete: () => {
        this.isLoading = false;
        this.subCategoryForm.reset();
        this.mainCategoryForm.reset();
      }
    })
  }

  public getCategories() {
    this.stockLedgerCategoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories:', categories);
        this.existingStockLedgerCategory = categories[0];
      },
      error: (error) => {
        console.error('Error getting categories:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  public get mainCategories(): string[] {
    return Object.keys(this.existingStockLedgerCategory?.category || {});
  }

  public get mainSubCategories(): [string | null] {
    return this.existingStockLedgerCategory?.category[this.stockLedgerForm.get('mainCategory')?.value] || [];
  }

  public handleDialogConfirm(event: any) {
    if (this.dialogType === 'main' && event) {
      this.confirmMainCategory();
    } else if (this.dialogType === 'sub' && event) {
      this.confirmSubCategory();
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

  openDialog(type: 'main' | 'sub') {
    this.dialogType = type;

    if (type === 'main') {
      this.dialogTemplate = this.createMainCategoryTemplate;
      this.dialogTitle = 'Add Main Category';
    } else {
      this.dialogTemplate = this.createSubCategoryTemplate;
      this.dialogTitle = 'Add Sub Category';
    }

    // Manually trigger modal open if required
    const modal = new bootstrap.Modal(document.getElementById('reusableModal')!);
    modal.show();
  }

  confirmMainCategory() {
    const newCategory = this.mainCategoryForm.get('category')?.value;
    // Save logic
    console.log('Saving Main Category:', newCategory);
    if (this.existingStockLedgerCategory) {
      const payload = this.existingStockLedgerCategory;
      payload.category[newCategory] = [null];
      this.updateCategory(payload);
    } else {
      this.createCategory(newCategory);
    }
  }

  confirmSubCategory() {
    const newSubCategory = this.subCategoryForm.get('subCategory')?.value;
    const newCategory = this.subCategoryForm.get('category')?.value;
    // Save logic
    console.log('Saving Sub Category:', newSubCategory);
    if (this.existingStockLedgerCategory) {
      const payload = this.existingStockLedgerCategory;
      payload.category[newCategory].push(newSubCategory);
      payload.category[newCategory] = payload.category[newCategory].filter(Boolean) as [string | null];
      this.updateCategory(payload);
    }
  }
  // END

  private initializeFormData() {
    forkJoin({
      userDetails: this.userService.getUser(),
      latestLedger: this.stockLedgerService.getLatestEntry(),
    }).subscribe({
      next: ({ userDetails, latestLedger }) => {
        console.log('User:', userDetails);
        console.log('Ledger:', latestLedger);
        this.appUser = userDetails;
        this.lastStockLedger = latestLedger;
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
      this.stockLedgerService.getLedgerEntryById(this.ledgerId)
        .then((ledgerEntry: any) => {
          console.log("======= LEDGER ENTRY ========", ledgerEntry);
          this.existingLedger = ledgerEntry;
          this.stockLedgerForm.patchValue(ledgerEntry);
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
      this.stockLedgerForm.get('stockIn')?.disable();
      this.stockLedgerForm.get('stockOut')?.disable();
    }

    this.stockLedgerForm.updateValueAndValidity();
  }

  private initializeLatestLedgerEntry(): any {
    this.stockLedgerForm.patchValue({ balance: this.lastStockLedger?.balance || 0 });
  }

  onMainCategoryChange(event: Event) {
    console.log('Main Category:', (event.target as HTMLSelectElement).value);
  }

  calculateBalance() {
    const stockIn = +this.stockLedgerForm.get('stockIn')?.value || 0;
    const stockOut = +this.stockLedgerForm.get('stockOut')?.value || 0;
    const balance = (this.lastStockLedger?.balance || 0) + stockIn - stockOut;
    this.stockLedgerForm.patchValue({ balance });
  }

  onSubmit() {
    if (this.stockLedgerForm.valid) {
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
    this.stockLedgerForm = this.fb.group({
      mainCategory: ['', Validators.required],
      subCategory: ['', Validators.required],
      stockIn: [0],
      stockOut: [0],
      balance: [{ value: 0, disabled: true }],
      date: [DateUtils.getTodayDate()],
      description: [''],
    }, { validators: creditOrDebitRequired('stockIn', 'stockOut') });
  }

  private initializeMainCategoryForm() {
    this.mainCategoryForm = this.fb.group({
      category: ['', Validators.required],
    });
  }

  private initializeSubCategoryForm() {
    this.subCategoryForm = this.fb.group({
      category: ['', Validators.required],
      subCategory: ['', Validators.required],
    });
  }

  private handleBalanceAmount() {
    // balance = previousBalance + credit - debit
    const formValue = this.stockLedgerForm.getRawValue();
    const credit = Number(formValue.stockIn || 0);
    const debit = Number(formValue.stockOut || 0);
    const runningBalance = this.lastStockLedger?.balance || 0;

    const newBalance = runningBalance + credit - debit;
    this.stockLedgerForm.patchValue({ balance: newBalance });
  }
}
