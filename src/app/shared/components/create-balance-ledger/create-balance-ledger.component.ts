import { Component, TemplateRef, ViewChild, EventEmitter, Output, } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';

import { AppUser } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { DateUtils } from '../../../core/utils/date.utils';
import { NumberUtils } from '../../../core/utils/number.utils';
import { balanceLedgerFormValidation } from '../../../core/utils/form.utils';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { DialogComponent } from "../dialog/dialog.component";
import { BalanceLedgerItemService } from '../../../core/services/balance-ledger-item.service';
import { BalanceLedgerEntry, BalanceLedgerItem } from '../../../core/models/balance-ledger';
import { BalanceLedgerService } from '../../../core/services/balance-ledger.service';
import { HierarchyService } from '../../../core/services/hierarchy.service';
import { Party } from '../../../core/models/party.model';
import { MainCategory } from '../../../core/models/main-category.model';
import { SubCategory } from '../../../core/models/sub-category.model';
import { PartyService } from '../../../core/services/party.service';
import { MainCategoryService } from '../../../core/services/main-category.service';
import { SubCategoryService } from '../../../core/services/sub-category.service';
import { PartyMainCategoryMapService } from '../../../core/services/party-main-category-map.service';
import { Roles } from '../../../shared/constants/roles';
declare var bootstrap: any;

@Component({
  selector: 'app-create-balance-ledger',
  imports: [CommonModule, ReactiveFormsModule, LoadingButtonComponent, DialogComponent],
  providers: [
    HierarchyService,
    BalanceLedgerItemService,
    BalanceLedgerService,
    PartyService,
    MainCategoryService,
    SubCategoryService,
    PartyMainCategoryMapService
  ],
  templateUrl: './create-balance-ledger.component.html',
  styleUrl: './create-balance-ledger.component.scss'
})
export class CreateBalanceLedgerComponent {
  @ViewChild('createItem') createItemTemplate!: TemplateRef<any>;
  @ViewChild('createMainCategory') createMainCategoryTemplate!: TemplateRef<any>;
  @ViewChild('createParty') createPartyTemplate!: TemplateRef<any>;
  @ViewChild('createSubCategory') createSubCategoryTemplate!: TemplateRef<any>;
  @ViewChild('manageMainCategory') manageMainCategoryTemplate!: TemplateRef<any>;
  @ViewChild('manageParty') managePartyTemplate!: TemplateRef<any>;
  @ViewChild('manageSubCategory') manageSubCategoryTemplate!: TemplateRef<any>;

  @Output() closeLedgerForm = new EventEmitter<boolean>();

  dialogTemplate!: TemplateRef<any>;
  dialogTitle: string = '';
  dialogType: 'item' | 'main' | 'party' | 'sub' | 'manage-main' | 'manage-party' | 'manage-sub' | null = null;

  balanceLedgerForm!: FormGroup;
  itemForm!: FormGroup;
  mainCategoryForm!: FormGroup;
  partyForm!: FormGroup;
  subCategoryForm!: FormGroup;

  appUser!: AppUser;
  lastLedger: BalanceLedgerEntry | null = null;
  ledgerId!: string;
  existingLedger: BalanceLedgerEntry | null = null;
  isLoading: boolean = false;
  balanceLedgerItems: BalanceLedgerItem[] = [];
  
  // Status and role-based properties
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];
  
  // Hierarchy data
  parties: Party[] = [];
  mainCategories: MainCategory[] = [];
  subCategories: SubCategory[] = [];

  // Role-based permission methods
  get isSupervisor(): boolean {
    return this.appUser?.role === Roles.SUPERVISOR;
  }

  get isAdmin(): boolean {
    return this.appUser?.role === Roles.ADMIN || this.appUser?.role === Roles.SUPER_ADMIN;
  }

  get canManageHierarchy(): boolean {
    return this.isAdmin; // Only admins can manage categories, parties, subcategories, items
  }

  get canEditEntry(): boolean {
    if (this.isAdmin) return true;
    if (this.isSupervisor) {
      return this.existingLedger?.status === 'pending' || !this.existingLedger;
    }
    return false;
  }

  // Unit options for dropdown
  unitOptions = [
    { value: '', label: 'Select Unit' },
    { value: 'per kg', label: 'Per Kilogram' },
    { value: 'per gram', label: 'Per Gram' },
    { value: 'per ton', label: 'Per Ton' },
    { value: 'per piece', label: 'Per Piece' },
    { value: 'per item', label: 'Per Item' },
    { value: 'per hour', label: 'Per Hour' },
    { value: 'per day', label: 'Per Day' },
    { value: 'per month', label: 'Per Month' },
    { value: 'per meter', label: 'Per Meter' },
    { value: 'per foot', label: 'Per Foot' },
    { value: 'per inch', label: 'Per Inch' },
    { value: 'per liter', label: 'Per Liter' },
    { value: 'per gallon', label: 'Per Gallon' },
    { value: 'per square meter', label: 'Per Square Meter' },
    { value: 'per square foot', label: 'Per Square Foot' },
    { value: 'per cubic meter', label: 'Per Cubic Meter' },
    { value: 'per cubic foot', label: 'Per Cubic Foot' },
    { value: 'per box', label: 'Per Box' },
    { value: 'per bag', label: 'Per Bag' },
    { value: 'per dozen', label: 'Per Dozen' },
    { value: 'per unit', label: 'Per Unit' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly balanceLedgerService: BalanceLedgerService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly balanceLedgerItemService: BalanceLedgerItemService,
    private readonly hierarchyService: HierarchyService
  ) {
    this.initializeForm();
    this.initializeItemForm();
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
      this.initializeFormData();
      this.getItems();
      this.loadHierarchyData();
    });
  }

  createLedgerEntry() {
    if (this.balanceLedgerForm.valid) {
      this.handleBalanceAmount();
      
      // Sanitize form values to ensure numeric fields are integers
      const formValue = this.balanceLedgerForm.getRawValue();
      const sanitizedFormValue = {
        ...formValue,
        quantity: NumberUtils.sanitizeToInteger(formValue.quantity),
        rate: NumberUtils.sanitizeToInteger(formValue.rate),
        amount: NumberUtils.sanitizeToInteger(formValue.amount),
        credit: NumberUtils.sanitizeToInteger(formValue.credit),
        balance: NumberUtils.sanitizeToInteger(formValue.balance),
        status: this.isSupervisor ? 'pending' : formValue.status // Supervisors can only create pending entries
      };
      
      this.balanceLedgerService.createLedger(
        {
          ...sanitizedFormValue,
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
      // Sanitize form values to ensure numeric fields are integers
      const formValue = this.balanceLedgerForm.getRawValue();
      const sanitizedFormValue = {
        ...formValue,
        quantity: NumberUtils.sanitizeToInteger(formValue.quantity),
        rate: NumberUtils.sanitizeToInteger(formValue.rate),
        amount: NumberUtils.sanitizeToInteger(formValue.amount),
        credit: NumberUtils.sanitizeToInteger(formValue.credit),
        balance: NumberUtils.sanitizeToInteger(formValue.balance),
        status: this.isSupervisor ? 'pending' : formValue.status // Supervisors can only create pending entries
      };
      
      this.balanceLedgerService.updateLedger(this.ledgerId, sanitizedFormValue)
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

  // Load hierarchy data
  private loadHierarchyData() {
    this.hierarchyService.getHierarchyData().subscribe({
      next: (data) => {
        this.parties = data.parties;
        this.mainCategories = data.mainCategories;
        this.subCategories = data.subCategories;
      },
      error: (error) => {
        console.error('Error loading hierarchy data:', error);
      }
    });
  }

  // Helper methods for Party → Main Category → Sub Category hierarchy
  public getAllParties(): string[] {
    return this.parties.map(party => party.name);
  }

  public getMainCategoriesForParty(partyName: string): string[] {
    return this.mainCategories.map(cat => cat.name);
  }

  public getSubCategoriesForPartyAndMainCategory(partyName: string, mainCategoryName: string): string[] {
    return this.subCategories.map(sub => sub.name);
  }

  // Load main categories for a specific party
  private loadMainCategoriesForParty(partyName: string): void {
    const party = this.parties.find(p => p.name === partyName);
    if (!party) {
      this.mainCategories = [];
      return;
    }

    this.hierarchyService.getMainCategoriesForPartyOptimized(party.id!).subscribe({
      next: (categories) => {
        this.mainCategories = categories;
      },
      error: (error) => {
        console.error('Error loading main categories for party:', error);
        this.mainCategories = [];
      }
    });
  }

  // Load sub categories for a specific main category
  private loadSubCategoriesForMainCategory(mainCategoryName: string): void {
    const mainCategory = this.mainCategories.find(cat => cat.name === mainCategoryName);
    if (!mainCategory) {
      this.subCategories = [];
      return;
    }

    this.hierarchyService.getSubCategoriesForMainCategoryOptimized(mainCategory.id!).subscribe({
      next: (subCategories) => {
        this.subCategories = subCategories;
      },
      error: (error) => {
        console.error('Error loading sub categories for main category:', error);
        this.subCategories = [];
      }
    });
  }

  public handleDialogConfirm(event: any) {
    if (this.dialogType === 'item' && event) {
      this.confirmItem();
    } else if (this.dialogType === 'main' && event) {
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

  openDialog(type: 'item' | 'main' | 'party' | 'sub' | 'manage-main' | 'manage-party' | 'manage-sub') {
    this.dialogType = type;

    if (type === 'item') {
      this.dialogTemplate = this.createItemTemplate;
      this.dialogTitle = 'Add Item';
    } else if (type === 'main') {
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

  confirmItem() {
    const newCategory = this.itemForm.get('itemName')?.value;
    this.createItem(newCategory);
  }

  confirmMainCategory() {
    if (this.mainCategoryForm.invalid) return;
    const newCategory = this.mainCategoryForm.get('category')?.value;
    console.log('Saving Main Category:', newCategory);
    
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
        this.loadHierarchyData();
        this.mainCategoryForm.reset();
      },
      error: (error) => {
        console.error('Error creating main category:', error);
      }
    });
  }

  confirmParty() {
    if (this.partyForm.invalid) return;
    const newParty = this.partyForm.get('party')?.value;
    console.log('Saving Party:', newParty);
    
    this.hierarchyService.createParty({
      name: newParty,
      createdBy: this.appUser.uid,
      updatedBy: this.appUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByName: this.appUser.name
    }).subscribe({
      next: (id) => {
        console.log('Party created with ID:', id);
        this.loadHierarchyData();
        this.partyForm.reset();
      },
      error: (error) => {
        console.error('Error creating party:', error);
      }
    });
  }

  confirmSubCategory() {
    if (this.subCategoryForm.invalid) return;
    const newSubCategory = this.subCategoryForm.get('subCategory')?.value;
    const selectedMainCategory = this.subCategoryForm.get('mainCategory')?.value;
    console.log('Saving Sub Category:', newSubCategory, 'for Main Category:', selectedMainCategory);
    
    const mainCategory = this.mainCategories.find(cat => cat.name === selectedMainCategory);
    if (!mainCategory) {
      console.error('Main category not found');
      return;
    }
    
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
        this.loadHierarchyData();
        this.subCategoryForm.reset();
      },
      error: (error) => {
        console.error('Error creating sub category:', error);
      }
    });
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
    } else {
      this.existingLedger = null;
    }
  }

  private handleFormValidation() {
    // Check if user can edit this entry
    if (!this.canEditEntry && this.existingLedger) {
      // Disable all fields if user cannot edit
      this.balanceLedgerForm.disable();
      return;
    }

    // For existing ledger
    if (this.existingLedger) {
      // Only disable quantity/rate/credit for approved entries (supervisors can't edit)
      if (this.existingLedger.status === 'approved' && this.isSupervisor) {
        this.balanceLedgerForm.get('rate')?.disable();
        this.balanceLedgerForm.get('quantity')?.disable();
        this.balanceLedgerForm.get('credit')?.disable();
      } else {
        this.balanceLedgerForm.get('rate')?.enable();
        this.balanceLedgerForm.get('quantity')?.enable();
        this.balanceLedgerForm.get('credit')?.enable();
      }
      
      // Enable party and main category for existing ledger (they have values)
      if (this.existingLedger.party) {
        this.balanceLedgerForm.get('party')?.enable();
      }
      if (this.existingLedger.mainCategory) {
        this.balanceLedgerForm.get('mainCategory')?.enable();
      }
      if (this.existingLedger.subCategory) {
        this.balanceLedgerForm.get('subCategory')?.enable();
      }
    } else {
      this.balanceLedgerForm.get('rate')?.enable();
      this.balanceLedgerForm.get('quantity')?.enable();
      this.balanceLedgerForm.get('credit')?.enable();
      
      // For new entries, keep the cascading logic
      // Party starts enabled, main category and sub category start disabled
      this.balanceLedgerForm.get('party')?.enable();
      this.balanceLedgerForm.get('mainCategory')?.disable();
      this.balanceLedgerForm.get('subCategory')?.disable();
    }

    // Handle status field based on role and mode
    if (this.isAdmin && this.existingLedger) {
      // Enable status field for admins in edit mode
      this.balanceLedgerForm.get('status')?.enable();
    } else {
      // Disable status field for supervisors or new entries
      this.balanceLedgerForm.get('status')?.disable();
      this.balanceLedgerForm.get('status')?.setValue('pending');
    }

    this.balanceLedgerForm.updateValueAndValidity();
  }

  private initializeLatestLedgerEntry(): any {
    this.balanceLedgerForm.patchValue({ balance: this.lastLedger?.balance || 0 });
  }

  onPartyChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Party:', selectedValue);
    
    // Reset dependent fields when party changes
    this.balanceLedgerForm.patchValue({ mainCategory: null, subCategory: null });
    
    // Enable/disable main category field based on party selection
    if (selectedValue && selectedValue !== 'null') {
      this.balanceLedgerForm.get('mainCategory')?.enable();
      // Load main categories for the selected party
      this.loadMainCategoriesForParty(selectedValue);
    } else {
      this.balanceLedgerForm.get('mainCategory')?.disable();
      this.balanceLedgerForm.get('subCategory')?.disable();
      this.mainCategories = [];
      this.subCategories = [];
    }
  }

  onMainCategoryChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Main Category:', selectedValue);
    
    // Reset dependent fields when main category changes
    this.balanceLedgerForm.patchValue({ subCategory: null });
    
    // Enable/disable sub category field based on main category selection
    if (selectedValue && selectedValue !== 'null') {
      this.balanceLedgerForm.get('subCategory')?.enable();
      // Load sub categories for the selected main category
      this.loadSubCategoriesForMainCategory(selectedValue);
    } else {
      this.balanceLedgerForm.get('subCategory')?.disable();
      this.subCategories = [];
    }
  }

  onSubCategoryChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Sub Category:', selectedValue);
  }

  calculateBalance() {
    const amount = NumberUtils.sanitizeToInteger(this.balanceLedgerForm.get('amount')?.value);
    const credit = NumberUtils.sanitizeToInteger(this.balanceLedgerForm.get('credit')?.value);
    const balance = (this.lastLedger?.balance || 0) + amount - credit;
    this.balanceLedgerForm.patchValue({ balance });
  }

  calculateAmount() {
    const quantity = NumberUtils.sanitizeToInteger(this.balanceLedgerForm.get('quantity')?.value);
    const rate = NumberUtils.sanitizeToInteger(this.balanceLedgerForm.get('rate')?.value);
    const amount = quantity * rate;
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
    // const redirectUrl = this.route.snapshot.queryParamMap.get('redirect')
    // if (redirectUrl) {
    //   this.router.navigate([redirectUrl]);
    // }
    this.closeLedgerForm.emit(true);
  }

  private initializeForm() {
    this.balanceLedgerForm = this.fb.group({
      party: [{ value: null, disabled: true }, Validators.required],
      mainCategory: [{ value: null, disabled: true }, Validators.required],
      subCategory: [{ value: null, disabled: true }, Validators.required],
      itemName: [''],
      quantity: [''],
      rate: [''],
      unit: [''],
      amount: [{ value: 0, disabled: true }],
      credit: [''],
      balance: [{ value: 0, disabled: true }],
      date: [DateUtils.getTodayDate()],
      description: [''],
      status: [{ value: 'pending', disabled: true }], // Default status, disabled by default
      approvedBy: [''],
      approvedByName: [''],
    }, { validators: balanceLedgerFormValidation() });
  }

  private initializeItemForm() {
    this.itemForm = this.fb.group({
      itemName: ['', Validators.required],
    });
  }

  private initializeMainCategoryForm() {
    this.mainCategoryForm = this.fb.group({
      category: ['', Validators.required],
    });
  }

  private initializePartyForm() {
    this.partyForm = this.fb.group({
      party: ['', Validators.required],
    });
  }

  private initializeSubCategoryForm() {
    this.subCategoryForm = this.fb.group({
      mainCategory: ['', Validators.required],
      subCategory: ['', Validators.required],
    });
  }

  private handleBalanceAmount() {
    // balance = previousBalance + amount - credit
    const formValue = this.balanceLedgerForm.getRawValue();
    const amount = NumberUtils.sanitizeToInteger(formValue.amount);
    const credit = NumberUtils.sanitizeToInteger(formValue.credit);
    const runningBalance = this.lastLedger?.balance || 0;

    const newBalance = runningBalance + amount - credit;
    this.balanceLedgerForm.patchValue({ balance: newBalance });
  }

  private resetAllTheForms() {
    this.initializeForm();
    this.initializeMainCategoryForm();
    this.initializePartyForm();
    this.initializeSubCategoryForm();
  }
}
