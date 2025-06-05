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

import { BalanceLedgerItem } from '../models/balance-ledger';
import { StorageUtils } from '../utils/storage.utils';
@Injectable({
  providedIn: 'root'
})
export class BalanceLedgerItemService {
  private collectionRef: CollectionReference<DocumentData>;

  constructor(
    private firestore: Firestore,
  ) {
    this.collectionRef = collection(this.firestore, 'balance-ledger-item');
  }

  // ➕ Create
  public create(item: BalanceLedgerItem): Observable<string> {
    const timestamp = new Date();
    const data: BalanceLedgerItem = {
      ...item,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdByName: StorageUtils.getUserName()
    };
    return from(addDoc(this.collectionRef, data)).pipe(
      map(docRef => docRef.id)
    );
  }

  // 📝 Update
  public update(id: string | undefined, updates: Partial<BalanceLedgerItem>): Observable<void> {
    const docRef = doc(this.firestore, `balance-ledger-item/${id}`);
    return from(updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    }));
  }

  // ❌ Delete
  public delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, `balance-ledger-item/${id}`);
    return from(deleteDoc(docRef));
  }

  // 📄 Get all
  public getAll(createdBy?: string, date?: string): Observable<BalanceLedgerItem[]> {
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
          ...(doc.data() as BalanceLedgerItem)
        }))
      )
    );
  }

  // 📄 Get One
  async getOneById(id: string): Promise<any> {
    const docRef = doc(this.firestore, `balance-ledger-item/${id}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as BalanceLedgerItem;
    }
  }

  // 📄 Get latest one
  public getLatestEntry(): Observable<BalanceLedgerItem | null> {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'), limit(1));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...(doc.data() as BalanceLedgerItem) };
      })
    );
  }
}
