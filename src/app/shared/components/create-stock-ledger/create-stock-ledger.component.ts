import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AppUser } from '../../../core/models/user.model';
import { StockLedgerService } from '../../../core/services/stock-ledger.service';
import { UserService } from '../../../core/services/user.service';
import { StockLedgerEntry } from '../../../core/models/stock-ledger';
import { DateUtils } from '../../../core/utils/date.utils';
import { NumberUtils } from '../../../core/utils/number.utils';
import { creditOrDebitRequired } from '../../../core/utils/form.utils';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { DialogComponent } from "../dialog/dialog.component";
import { StockLedgerCategoryService } from '../../../core/services/stock-ledger-category.service';
import { StoreLedgerCategory } from '../../../core/models/stock-ledger-category.model';
import { HierarchyService } from '../../../core/services/hierarchy.service';
import { Party } from '../../../core/models/party.model';
import { MainCategory } from '../../../core/models/main-category.model';
import { SubCategory } from '../../../core/models/sub-category.model';
declare var bootstrap: any;

@Component({
  selector: 'app-create-stock-ledger',
  imports: [CommonModule, ReactiveFormsModule, LoadingButtonComponent, DialogComponent],
  templateUrl: './create-stock-ledger.component.html',
  styleUrl: './create-stock-ledger.component.scss'
})
export class CreateStockLedgerComponent {
  @ViewChild('createMainCategory') createMainCategoryTemplate!: TemplateRef<any>;
  @ViewChild('createParty') createPartyTemplate!: TemplateRef<any>;
  @ViewChild('createSubCategory') createSubCategoryTemplate!: TemplateRef<any>;
  @ViewChild('manageMainCategory') manageMainCategoryTemplate!: TemplateRef<any>;
  @ViewChild('manageParty') managePartyTemplate!: TemplateRef<any>;
  @ViewChild('manageSubCategory') manageSubCategoryTemplate!: TemplateRef<any>;

  @Output() closeLedgerForm = new EventEmitter<boolean>();

  dialogTemplate!: TemplateRef<any>;
  dialogTitle: string = '';
  dialogType: 'main' | 'party' | 'sub' | 'manage-main' | 'manage-party' | 'manage-sub' | null = null;

  stockLedgerForm!: FormGroup;
  mainCategoryForm!: FormGroup;
  partyForm!: FormGroup;
  subCategoryForm!: FormGroup;

  appUser!: AppUser;
  lastStockLedger: StockLedgerEntry | null = null;
  ledgerId!: string;
  existingLedger: StockLedgerEntry | null = null;
  isLoading: boolean = false;
  existingStockLedgerCategory!: StoreLedgerCategory;

  // Private properties for optimized queries
  private _parties: Party[] = [];
  private _subCategories: SubCategory[] = [];
  private _mainCategories: MainCategory[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly stockLedgerService: StockLedgerService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly stockLedgerCategoryService: StockLedgerCategoryService,
    private readonly hierarchyService: HierarchyService
  ) {
    this.initializeForm();
    this.initializeMainCategoryForm();
    this.initializePartyForm();
    this.initializeSubCategoryForm();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.route.queryParams.subscribe(params => {
      this.isLoading = true;
      this.resetAllTheForms();
      this.existingLedger = null;
      this.getCategories();
      this.initializeFormData();
      this.loadHierarchyData();
    });
  }

  createLedgerEntry() {
    if (this.stockLedgerForm.valid) {
      this.handleBalanceAmount();
      
      // Sanitize form values to ensure numeric fields are integers
      const formValue = this.stockLedgerForm.getRawValue();
      const sanitizedFormValue = {
        ...formValue,
        stockIn: NumberUtils.sanitizeToInteger(formValue.stockIn),
        stockOut: NumberUtils.sanitizeToInteger(formValue.stockOut),
        balance: NumberUtils.sanitizeToInteger(formValue.balance)
      };
      
      this.stockLedgerService.createLedger(
        {
          ...sanitizedFormValue,
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
      // Sanitize form values to ensure numeric fields are integers
      const formValue = this.stockLedgerForm.getRawValue();
      const sanitizedFormValue = {
        ...formValue,
        stockIn: NumberUtils.sanitizeToInteger(formValue.stockIn),
        stockOut: NumberUtils.sanitizeToInteger(formValue.stockOut),
        balance: NumberUtils.sanitizeToInteger(formValue.balance)
      };
      
      this.stockLedgerService.updateLedger(this.ledgerId, sanitizedFormValue)
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
      category: { [category]: {} },
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
        this.partyForm.reset();
        this.mainCategoryForm.reset();
      }
    })
  }

  public getCategories() {
    this.stockLedgerCategoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories:', categories);
        this.existingStockLedgerCategory = categories[0];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting categories:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  // Load hierarchy data
  private loadHierarchyData() {
    this.hierarchyService.getHierarchyData().subscribe({
      next: (data) => {
        this._mainCategories = data.mainCategories;
        this._subCategories = data.subCategories;
        this._parties = data.parties;
      },
      error: (error) => {
        console.error('Error loading hierarchy data:', error);
      }
    });
  }

  public get mainCategories(): MainCategory[] {
    return this._mainCategories || [];
  }

  public get subCategories(): SubCategory[] {
    return this._subCategories || [];
  }

  public get parties(): Party[] {
    return this._parties || [];
  }

  public getSubCategoriesForMainCategory(mainCategoryId: string): SubCategory[] {
    return this._subCategories || [];
  }

  public getPartiesForMainCategoryAndSubCategory(mainCategoryId: string, subCategoryId: string): Party[] {
    return this._parties || [];
  }

  // Load sub categories for a specific main category
  private loadSubCategoriesForMainCategory(mainCategoryName: string): void {
    const mainCategory = this._mainCategories.find(cat => cat.name === mainCategoryName);
    if (!mainCategory) {
      this._subCategories = [];
      return;
    }

    this.hierarchyService.getSubCategoriesForMainCategoryOptimized(mainCategory.id!).subscribe({
      next: (subCategories: SubCategory[]) => {
        this._subCategories = subCategories;
      },
      error: (error: any) => {
        console.error('Error loading sub categories for main category:', error);
        this._subCategories = [];
      }
    });
  }

  // Load parties for a specific main category
  private loadPartiesForMainCategory(mainCategoryName: string): void {
    const mainCategory = this._mainCategories.find(cat => cat.name === mainCategoryName);
    if (!mainCategory) {
      this._parties = [];
      return;
    }

    this.hierarchyService.getPartiesForMainCategoryOptimized(mainCategory.id!).subscribe({
      next: (parties: Party[]) => {
        this._parties = parties;
      },
      error: (error: any) => {
        console.error('Error loading parties for main category:', error);
        this._parties = [];
      }
    });
  }

  public handleDialogConfirm(event: any) {
    if (this.dialogType === 'main' && event) {
      this.confirmMainCategory();
    } else if (this.dialogType === 'party' && event) {
      this.confirmParty();
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

  openDialog(type: 'main' | 'party' | 'sub' | 'manage-main' | 'manage-party' | 'manage-sub') {
    this.dialogType = type;

    if (type === 'main') {
      this.dialogTemplate = this.createMainCategoryTemplate;
      this.dialogTitle = 'Add Main Category';
    } else if (type === 'party') {
      this.dialogTemplate = this.createPartyTemplate;
      this.dialogTitle = 'Add Party';
    } else if (type === 'sub') {
      this.dialogTemplate = this.createSubCategoryTemplate;
      this.dialogTitle = 'Add Sub Category';
    } else if (type === 'manage-main') {
      this.dialogTemplate = this.manageMainCategoryTemplate;
      this.dialogTitle = 'Manage Main Categories';
    } else if (type === 'manage-party') {
      this.dialogTemplate = this.managePartyTemplate;
      this.dialogTitle = 'Manage Parties';
    } else if (type === 'manage-sub') {
      this.dialogTemplate = this.manageSubCategoryTemplate;
      this.dialogTitle = 'Manage Sub Categories';
    }

    // Manually trigger modal open if required
    const modal = new bootstrap.Modal(document.getElementById('reusableModal')!);
    modal.show();
  }

  confirmMainCategory() {
    if (this.mainCategoryForm.invalid) return;

    const newCategory = this.mainCategoryForm.get('category')?.value;
    console.log('Saving Main Category:', newCategory);
    
    // Use the new hierarchy service approach
    this.hierarchyService.createMainCategory({
      name: newCategory,
      createdBy: this.appUser.uid,
      updatedBy: this.appUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByName: this.appUser.name
    }).subscribe({
      next: (id) => {
        console.log('Main Category created with ID:', id);
        this.loadHierarchyData(); // Reload hierarchy data
        this.mainCategoryForm.reset();
      },
      error: (error) => {
        console.error('Error creating main category:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  confirmParty() {
    if (this.partyForm.invalid) return;

    const newParty = this.partyForm.get('party')?.value;
    const selectedCategory = this.partyForm.get('category')?.value;
    console.log('Saving Party:', newParty, 'in Category:', selectedCategory);
    
    // Use the new hierarchy service approach
    this.hierarchyService.createParty({
      name: newParty,
      createdBy: this.appUser.uid,
      updatedBy: this.appUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByName: this.appUser.name
    }).subscribe({
      next: (partyId) => {
        console.log('Party created with ID:', partyId);
        
        // Create the mapping between party and main category
        const mainCategory = this._mainCategories.find(cat => cat.name === selectedCategory);
        if (mainCategory) {
          this.hierarchyService.createPartyMainCategoryMap({
            partyId: partyId,
            mainCategoryId: mainCategory.id!,
            createdBy: this.appUser.uid,
            updatedBy: this.appUser.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdByName: this.appUser.name
          }).subscribe({
            next: (mappingId) => {
              console.log('Party-MainCategory mapping created with ID:', mappingId);
              this.loadHierarchyData(); // Reload hierarchy data
              this.partyForm.reset();
            },
            error: (error) => {
              console.error('Error creating party-main category mapping:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error creating party:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  confirmSubCategory() {
    if (this.subCategoryForm.invalid) return;

    const newSubCategory = this.subCategoryForm.get('subCategory')?.value;
    const selectedCategory = this.subCategoryForm.get('category')?.value;
    console.log('Saving Sub Category:', newSubCategory, 'for Main Category:', selectedCategory);
    
    // Use the new hierarchy service approach
    const mainCategory = this._mainCategories.find(cat => cat.name === selectedCategory);
    if (mainCategory) {
      this.hierarchyService.createSubCategory({
        name: newSubCategory,
        mainCategoryId: mainCategory.id!,
        createdBy: this.appUser.uid,
        updatedBy: this.appUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByName: this.appUser.name
      }).subscribe({
        next: (id) => {
          console.log('Sub Category created with ID:', id);
          this.loadHierarchyData(); // Reload hierarchy data
          this.subCategoryForm.reset();
        },
        error: (error) => {
          console.error('Error creating sub category:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  deleteMainCategory(categoryToDelete: string) {
    if (!this.existingStockLedgerCategory) return;

    const confirmDelete = confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This will also delete all parties and sub-categories under this category.`);
    if (!confirmDelete) return;

    const payload = { ...this.existingStockLedgerCategory };
    delete payload.category[categoryToDelete];

    // Reset form if the deleted category was selected
    if (this.stockLedgerForm.get('mainCategory')?.value === categoryToDelete) {
      this.stockLedgerForm.patchValue({ mainCategory: null, party: null, subCategory: null });
      this.stockLedgerForm.get('party')?.disable();
      this.stockLedgerForm.get('subCategory')?.disable();
    }

    this.updateCategory(payload);
  }

  deleteParty(mainCat: string, partyToDelete: string) {
    if (!this.existingStockLedgerCategory) return;

    const confirmDelete = confirm(`Are you sure you want to delete the party "${partyToDelete}"? This will also delete all sub-categories under this party.`);
    if (!confirmDelete) return;

    const payload = { ...this.existingStockLedgerCategory };
    delete payload.category[mainCat][partyToDelete];

    // Reset form if the deleted party was selected
    if (this.stockLedgerForm.get('party')?.value === partyToDelete) {
      this.stockLedgerForm.patchValue({ party: null, subCategory: null });
      this.stockLedgerForm.get('subCategory')?.disable();
    }

    this.updateCategory(payload);
  }

  deleteSubCategory(mainCat: string, party: string, subCatToDelete: string) {
    if (!this.existingStockLedgerCategory) return;

    const confirmDelete = confirm(`Are you sure you want to delete the sub-category "${subCatToDelete}"?`);
    if (!confirmDelete) return;

    const payload = { ...this.existingStockLedgerCategory };
    payload.category[mainCat][party] = payload.category[mainCat][party]!.filter(sub => sub !== subCatToDelete);

    // Reset subCategory if the deleted sub-category was selected
    if (this.stockLedgerForm.get('subCategory')?.value === subCatToDelete) {
      this.stockLedgerForm.patchValue({ subCategory: null });
    }

    this.updateCategory(payload);
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
    console.log(" ================= ", this.route.snapshot.queryParams['id'], " ================= ")
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
    } else {
      this.existingLedger = null;
    }
  }

  private handleFormValidation() {
    // For existing ledger
    if (this.existingLedger) {
      this.stockLedgerForm.get('stockIn')?.disable();
      this.stockLedgerForm.get('stockOut')?.disable();

      // Enable fields for existing ledger (they have values)
      if (this.existingLedger.mainCategory) {
        this.stockLedgerForm.get('mainCategory')?.enable();
      }
      if (this.existingLedger.subCategory) {
        this.stockLedgerForm.get('subCategory')?.enable();
      }
      if (this.existingLedger.party) {
        this.stockLedgerForm.get('party')?.enable();
      }
    } else {
      this.stockLedgerForm.get('stockIn')?.enable();
      this.stockLedgerForm.get('stockOut')?.enable();

      // For new entries, keep the cascading logic
      // Main category starts enabled, sub category and party start disabled
      this.stockLedgerForm.get('mainCategory')?.enable();
      this.stockLedgerForm.get('subCategory')?.disable();
      this.stockLedgerForm.get('party')?.disable();
    }

    this.stockLedgerForm.updateValueAndValidity();
  }

  private initializeLatestLedgerEntry(): any {
    this.stockLedgerForm.patchValue({ balance: this.lastStockLedger?.balance || 0 });
  }

  onMainCategoryChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Main Category:', selectedValue);

    // Reset dependent fields when main category changes
    this.stockLedgerForm.patchValue({ subCategory: null, party: null });

    // Enable/disable sub category field based on main category selection
    if (selectedValue && selectedValue !== 'null') {
      this.stockLedgerForm.get('subCategory')?.enable();
      // Load sub categories for the selected main category
      this.loadSubCategoriesForMainCategory(selectedValue);
    } else {
      this.stockLedgerForm.get('subCategory')?.disable();
      this.stockLedgerForm.get('party')?.disable();
      this._subCategories = [];
      this._parties = [];
    }
  }

  onSubCategoryChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Sub Category:', selectedValue);

    // Reset party when sub category changes
    this.stockLedgerForm.patchValue({ party: null });

    // Enable/disable party field based on sub category selection
    if (selectedValue && selectedValue !== 'null') {
      this.stockLedgerForm.get('party')?.enable();
      // Load parties for the selected main category
      const mainCategory = this.stockLedgerForm.get('mainCategory')?.value;
      if (mainCategory) {
        this.loadPartiesForMainCategory(mainCategory);
      }
    } else {
      this.stockLedgerForm.get('party')?.disable();
      this._parties = [];
    }
  }

  calculateBalance() {
    const stockIn = NumberUtils.sanitizeToInteger(this.stockLedgerForm.get('stockIn')?.value);
    const stockOut = NumberUtils.sanitizeToInteger(this.stockLedgerForm.get('stockOut')?.value);
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
    // const redirectUrl = this.route.snapshot.queryParamMap.get('redirect')
    // if (redirectUrl) {
    //   this.router.navigate([redirectUrl]);
    // }
    this.closeLedgerForm.emit(true);
  }

  private initializeForm() {
    this.stockLedgerForm = this.fb.group({
      mainCategory: [null, Validators.required],
      subCategory: [{ value: null, disabled: true }, Validators.required],
      party: [{ value: null, disabled: true }, Validators.required],
      stockIn: [''],
      stockOut: [''],
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

  private initializePartyForm() {
    this.partyForm = this.fb.group({
      category: ['', Validators.required],
      party: ['', Validators.required],
    });
  }

  private initializeSubCategoryForm() {
    this.subCategoryForm = this.fb.group({
      category: ['', Validators.required],
      subCategory: ['', Validators.required],
    });
  }

  private handleBalanceAmount() {
    // balance = previousBalance + stockIn - stockOut
    const formValue = this.stockLedgerForm.getRawValue();
    const stockIn = NumberUtils.sanitizeToInteger(formValue.stockIn);
    const stockOut = NumberUtils.sanitizeToInteger(formValue.stockOut);
    const runningBalance = this.lastStockLedger?.balance || 0;

    const newBalance = runningBalance + stockIn - stockOut;
    this.stockLedgerForm.patchValue({ balance: newBalance });
  }

  private resetAllTheForms() {
    this.initializeForm();
    this.initializeMainCategoryForm();
    this.initializePartyForm();
    this.initializeSubCategoryForm();
  }
}
