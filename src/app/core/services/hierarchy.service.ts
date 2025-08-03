import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { PartyService } from './party.service';
import { MainCategoryService } from './main-category.service';
import { SubCategoryService } from './sub-category.service';
import { PartyMainCategoryMapService } from './party-main-category-map.service';
import { Party } from '../models/party.model';
import { MainCategory } from '../models/main-category.model';
import { SubCategory } from '../models/sub-category.model';

export interface HierarchyData {
  parties: Party[];
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  partyMainCategoryMaps: any[];
}

@Injectable({
  providedIn: 'root'
})
export class HierarchyService {
  constructor(
    private partyService: PartyService,
    private mainCategoryService: MainCategoryService,
    private subCategoryService: SubCategoryService,
    private partyMainCategoryMapService: PartyMainCategoryMapService
  ) { }

  // Get all hierarchy data
  getHierarchyData(): Observable<HierarchyData> {
    return combineLatest({
      parties: this.partyService.getAll(),
      mainCategories: this.mainCategoryService.getAll(),
      subCategories: this.subCategoryService.getAll(),
      partyMainCategoryMaps: this.partyMainCategoryMapService.getAll()
    });
  }

  // Balance Ledger Flow: Get main categories for a specific party
  getMainCategoriesForParty(partyId: string): Observable<MainCategory[]> {
    return this.partyMainCategoryMapService.getByPartyId(partyId).pipe(
      switchMap(mappings => {
        if (mappings.length === 0) return [];
        const mainCategoryIds = mappings.map(m => m.mainCategoryId);
        return this.mainCategoryService.getAll().pipe(
          map(categories => categories.filter(cat => mainCategoryIds.includes(cat.id!)))
        );
      })
    );
  }

  // Balance Ledger Flow: Get sub categories for a party and main category
  getSubCategoriesForPartyAndMainCategory(partyId: string, mainCategoryId: string): Observable<SubCategory[]> {
    return this.subCategoryService.getByMainCategoryId(mainCategoryId);
  }

  // Stock Ledger Flow: Get sub categories for a main category
  getSubCategoriesForMainCategory(mainCategoryId: string): Observable<SubCategory[]> {
    return this.subCategoryService.getByMainCategoryId(mainCategoryId);
  }

  // Stock Ledger Flow: Get parties for a main category and sub category
  getPartiesForMainCategoryAndSubCategory(mainCategoryId: string, subCategoryId: string): Observable<Party[]> {
    return this.partyMainCategoryMapService.getByMainCategoryId(mainCategoryId).pipe(
      switchMap(mappings => {
        if (mappings.length === 0) return [];
        const partyIds = mappings.map(m => m.partyId);
        return this.partyService.getAll().pipe(
          map(parties => parties.filter(party => partyIds.includes(party.id!)))
        );
      })
    );
  }

  // Optimized queries for real-time updates
  getMainCategoriesForPartyOptimized(partyId: string): Observable<MainCategory[]> {
    return this.partyMainCategoryMapService.getByPartyId(partyId).pipe(
      switchMap(mappings => {
        if (mappings.length === 0) return [];
        const mainCategoryIds = mappings.map(m => m.mainCategoryId);
        return this.mainCategoryService.getAll().pipe(
          map(categories => categories.filter(cat => mainCategoryIds.includes(cat.id!)))
        );
      })
    );
  }

  getSubCategoriesForMainCategoryOptimized(mainCategoryId: string): Observable<SubCategory[]> {
    return this.subCategoryService.getByMainCategoryId(mainCategoryId);
  }

  getPartiesForMainCategoryOptimized(mainCategoryId: string): Observable<Party[]> {
    return this.partyMainCategoryMapService.getByMainCategoryId(mainCategoryId).pipe(
      switchMap(mappings => {
        if (mappings.length === 0) return [];
        const partyIds = mappings.map(m => m.partyId);
        return this.partyService.getAll().pipe(
          map(parties => parties.filter(party => partyIds.includes(party.id!)))
        );
      })
    );
  }

  // Get all parties (for Balance Ledger)
  getAllParties(): Observable<Party[]> {
    return this.partyService.getAll();
  }

  // Get all main categories (for Stock Ledger)
  getAllMainCategories(): Observable<MainCategory[]> {
    return this.mainCategoryService.getAll();
  }

  // Create a new party
  createParty(party: Omit<Party, 'id'>): Observable<string> {
    return this.partyService.create(party);
  }

  // Create a new main category
  createMainCategory(mainCategory: Omit<MainCategory, 'id'>): Observable<string> {
    return this.mainCategoryService.create(mainCategory);
  }

  // Create a new sub category
  createSubCategory(subCategory: Omit<SubCategory, 'id'>): Observable<string> {
    return this.subCategoryService.create(subCategory);
  }

  // Create a mapping between party and main category
  createPartyMainCategoryMap(mapping: Omit<any, 'id'>): Observable<string> {
    return this.partyMainCategoryMapService.create(mapping);
  }

  // Delete a party (and all its mappings)
  deleteParty(partyId: string): Observable<void> {
    return this.partyMainCategoryMapService.getByPartyId(partyId).pipe(
      switchMap(mappings => {
        const deleteMappings = mappings.map(mapping => 
          this.partyMainCategoryMapService.delete(mapping.id!)
        );
        return combineLatest([...deleteMappings, this.partyService.delete(partyId)]);
      }),
      map(() => {})
    );
  }

  // Delete a main category (and all its sub categories and mappings)
  deleteMainCategory(mainCategoryId: string): Observable<void> {
    return combineLatest({
      mappings: this.partyMainCategoryMapService.getByMainCategoryId(mainCategoryId),
      subCategories: this.subCategoryService.getByMainCategoryId(mainCategoryId)
    }).pipe(
      switchMap(({ mappings, subCategories }) => {
        const deleteMappings = mappings.map(mapping => 
          this.partyMainCategoryMapService.delete(mapping.id!)
        );
        const deleteSubCategories = subCategories.map(subCat => 
          this.subCategoryService.delete(subCat.id!)
        );
        return combineLatest([
          ...deleteMappings, 
          ...deleteSubCategories, 
          this.mainCategoryService.delete(mainCategoryId)
        ]);
      }),
      map(() => {})
    );
  }

  // Delete a sub category
  deleteSubCategory(subCategoryId: string): Observable<void> {
    return this.subCategoryService.delete(subCategoryId);
  }
} 