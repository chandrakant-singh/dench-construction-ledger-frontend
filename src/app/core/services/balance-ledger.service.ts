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

import { StorageUtils } from '../utils/storage.utils';
import { BalanceLedgerEntry } from '../models/balance-ledger';

@Injectable({
  providedIn: 'root'
})
export class BalanceLedgerService {

  private collectionRef: CollectionReference<DocumentData>;

  constructor(
    private firestore: Firestore,
  ) {
    this.collectionRef = collection(this.firestore, 'balance-ledger');
  }

  // ➕ Create a new balance-ledger entry
  public createLedger(entry: BalanceLedgerEntry): Observable<string> {
    const timestamp = new Date();
    const data: BalanceLedgerEntry = {
      ...entry,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdByName: StorageUtils.getUserName()
    };
    return from(addDoc(this.collectionRef, data)).pipe(
      map(docRef => docRef.id)
    );
  }

  // 📝 Update existing ledger entry
  public updateLedger(id: string, updates: Partial<BalanceLedgerEntry>): Observable<void> {
    const docRef = doc(this.firestore, `balance-ledger/${id}`);
    return from(updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    }));
  }

  // ❌ Delete ledger entry
  public deleteLedger(id: string): Observable<void> {
    const docRef = doc(this.firestore, `balance-ledger/${id}`);
    return from(deleteDoc(docRef));
  }

  // 📄 Get all ledger entries (optionally filter by user or date)
  public getLedgerEntries(createdBy?: string, date?: string): Observable<BalanceLedgerEntry[]> {
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
          ...(doc.data() as BalanceLedgerEntry)
        }))
      )
    );
  }

  async getLedgerEntryById(id: string): Promise<any> {
    const docRef = doc(this.firestore, `balance-ledger/${id}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as BalanceLedgerEntry;
    }
  }

  public getLatestEntry(): Observable<BalanceLedgerEntry | null> {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'), limit(1));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...(doc.data() as BalanceLedgerEntry) };
      })
    );
  }

}
