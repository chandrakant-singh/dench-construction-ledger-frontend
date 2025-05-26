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

import { LedgerEntry } from '../models/ledger.model';
import { UserService } from './user.service';
import { StorageUtils } from '../utils/storage.utils';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private collectionRef: CollectionReference<DocumentData>;

  constructor(
    private firestore: Firestore,
    private userService: UserService
  ) {
    this.collectionRef = collection(this.firestore, 'ledger');
  }

  // ➕ Create a new ledger entry
  createLedger(entry: LedgerEntry): Observable<string> {
    const timestamp = new Date();
    const data: LedgerEntry = {
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
  updateLedger(id: string, updates: Partial<LedgerEntry>): Observable<void> {
    const docRef = doc(this.firestore, `ledger/${id}`);
    return from(updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    }));
  }

  // ❌ Delete ledger entry
  deleteLedger(id: string): Observable<void> {
    const docRef = doc(this.firestore, `ledger/${id}`);
    return from(deleteDoc(docRef));
  }

  // 📄 Get all ledger entries (optionally filter by user or date)
  getLedgerEntries(createdBy?: string, date?: string): Observable<LedgerEntry[]> {
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
          ...(doc.data() as LedgerEntry)
        }))
      )
    );
  }

  async getLedgerEntryById(id: string): Promise<any> {
    const docRef = doc(this.firestore, `ledger/${id}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LedgerEntry;
    }
  }

  getLatestEntry(): Observable<LedgerEntry | null> {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'), limit(1));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...(doc.data() as LedgerEntry) };
      })
    );
  }

}
