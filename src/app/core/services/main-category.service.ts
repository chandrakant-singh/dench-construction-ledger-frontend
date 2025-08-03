import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { MainCategory, MainCategoryReq } from '../models/main-category.model';

@Injectable({
  providedIn: 'root'
})
export class MainCategoryService {
  private collectionName = 'mainCategories';

  constructor(private firestore: Firestore) { }

  // Create a new main category
  create(mainCategory: Omit<MainCategory, 'id'>): Observable<string> {
    const id = doc(collection(this.firestore, 'temp')).id; // Generate ID
    const mainCategoryWithId: MainCategoryReq = {
      id,
      ...mainCategory
    };
    return from(setDoc(doc(this.firestore, this.collectionName, id), mainCategoryWithId).then(() => id));
  }

  // Get all main categories
  getAll(): Observable<MainCategory[]> {
    return collectionData(collection(this.firestore, this.collectionName)) as Observable<MainCategory[]>;
  }

  // Get main category by ID
  getById(id: string): Observable<MainCategory | undefined> {
    return from(getDoc(doc(this.firestore, this.collectionName, id)).then(doc => doc.data() as MainCategory | undefined));
  }

  // Update main category
  update(id: string, mainCategory: Partial<MainCategory>): Observable<void> {
    return from(updateDoc(doc(this.firestore, this.collectionName, id), mainCategory));
  }

  // Delete main category
  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.collectionName, id)));
  }
} 