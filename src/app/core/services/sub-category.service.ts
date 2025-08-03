import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { SubCategory, SubCategoryReq } from '../models/sub-category.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private collectionName = 'subCategories';

  constructor(private firestore: Firestore) { }

  // Create a new sub category
  create(subCategory: Omit<SubCategory, 'id'>): Observable<string> {
    const id = doc(collection(this.firestore, 'temp')).id; // Generate ID
    const subCategoryWithId: SubCategoryReq = {
      id,
      ...subCategory
    };
    return from(setDoc(doc(this.firestore, this.collectionName, id), subCategoryWithId).then(() => id));
  }

  // Get all sub categories
  getAll(): Observable<SubCategory[]> {
    return collectionData(collection(this.firestore, this.collectionName)) as Observable<SubCategory[]>;
  }

  // Get sub categories by main category ID
  getByMainCategoryId(mainCategoryId: string): Observable<SubCategory[]> {
    const q = query(collection(this.firestore, this.collectionName), where('mainCategoryId', '==', mainCategoryId));
    return collectionData(q) as Observable<SubCategory[]>;
  }

  // Get sub category by ID
  getById(id: string): Observable<SubCategory | undefined> {
    return from(getDoc(doc(this.firestore, this.collectionName, id)).then(doc => doc.data() as SubCategory | undefined));
  }

  // Update sub category
  update(id: string, subCategory: Partial<SubCategory>): Observable<void> {
    return from(updateDoc(doc(this.firestore, this.collectionName, id), subCategory));
  }

  // Delete sub category
  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.collectionName, id)));
  }
} 