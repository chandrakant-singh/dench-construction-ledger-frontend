import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  CollectionReference,
  DocumentData
} from '@angular/fire/firestore';
import { from, Observable, map } from 'rxjs';
import { limit, orderBy } from 'firebase/firestore';

import { StoreLedgerCategory } from '../models/stock-ledger-category.model';
import { StorageUtils } from '../utils/storage.utils';

@Injectable({
  providedIn: 'root'
})
export class StockLedgerCategoryService {

  private collectionRef: CollectionReference<DocumentData>;

    constructor(
      private firestore: Firestore,
    ) {
      this.collectionRef = collection(this.firestore, 'category');
    }

    // ➕ Create a new category entry
    public createCategory(category: StoreLedgerCategory): Observable<string> {
      const timestamp = new Date();
      const data: StoreLedgerCategory = {
        ...category,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdByName: StorageUtils.getUserName()
      };
      return from(addDoc(this.collectionRef, data)).pipe(
        map(docRef => docRef.id)
      );
    }

    // 📝 Update existing category
    public updateCategory(id: string | undefined, updates: Partial<StoreLedgerCategory>): Observable<void> {
      const docRef = doc(this.firestore, `category/${id}`);
      return from(updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      }));
    }

    // ❌ Delete category
    public deleteLedger(id: string): Observable<void> {
      const docRef = doc(this.firestore, `category/${id}`);
      return from(deleteDoc(docRef));
    }

    // 📄 Get all StoreLedgerCategory (optionally filter by user or date)
    public getCategories(createdBy?: string, date?: string): Observable<StoreLedgerCategory[]> {
      let q = query(this.collectionRef);

      if (createdBy) {
        q = query(q, where('createdBy', '==', createdBy));
      }

      if (date) {
        q = query(q, where('date', '==', date));
      }

      q = query(q, orderBy('createdAt', 'desc')); // 'desc' for latest first

      return from(getDocs(q)).pipe(
        map(snapshot =>
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as StoreLedgerCategory)
          }))
        )
      );
    }

    async getCategoryById(id: string): Promise<any> {
      const docRef = doc(this.firestore, `category/${id}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as StoreLedgerCategory;
      }
    }

    public getLatestEntry(): Observable<StoreLedgerCategory | null> {
      const q = query(this.collectionRef, orderBy('createdAt', 'desc'), limit(1));
      return from(getDocs(q)).pipe(
        map(snapshot => {
          if (snapshot.empty) return null;
          const doc = snapshot.docs[0];
          return { id: doc.id, ...(doc.data() as StoreLedgerCategory) };
        })
      );
    }
}
