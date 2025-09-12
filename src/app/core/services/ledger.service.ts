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
  startAfter,
  CollectionReference,
  DocumentData,
  writeBatch
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

  // ❌ Delete ledger entry with efficient balance recalculation
  deleteLedgerWithRecalculation(entryId: string, progressCallback?: (progress: number) => void): Observable<void> {
    return from(this.deleteLedgerEntryWithEfficientRecalculation(entryId, progressCallback));
  }

  private async deleteLedgerEntryWithEfficientRecalculation(entryId: string, progressCallback?: (progress: number) => void): Promise<void> {
    try {
      // 1. Get the entry to be deleted first
      const entryToDelete = await this.getLedgerEntryById(entryId);
      if (!entryToDelete) {
        throw new Error('Entry not found');
      }

      // 2. Get entries after the deleted entry using efficient query
      const entriesAfterDeleted = await this.getEntriesAfterDate(entryToDelete.createdAt);
      
      // 3. Get the previous balance efficiently
      const previousBalance = await this.getPreviousBalance(entryToDelete.createdAt);

      // 4. Delete the entry from Firestore
      const docRef = doc(this.firestore, 'ledger', entryId);
      await deleteDoc(docRef);

      // 5. Batch update subsequent entries if any exist
      if (entriesAfterDeleted.length > 0) {
        await this.batchUpdateBalances(entriesAfterDeleted, previousBalance, progressCallback);
      }

      console.log(`Entry deleted and ${entriesAfterDeleted.length} subsequent entries updated`);
    } catch (error) {
      console.error('Error deleting entry with recalculation:', error);
      throw error;
    }
  }

  private async getEntriesAfterDate(targetDate: any): Promise<LedgerEntry[]> {
    // For very large datasets, process in chunks
    const CHUNK_SIZE = 1000;
    let allEntries: LedgerEntry[] = [];
    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      let q = query(
        this.collectionRef,
        where('createdAt', '>', targetDate),
        orderBy('createdAt', 'asc'),
        limit(CHUNK_SIZE)
      );

      // If we have a last document, start after it for pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LedgerEntry));

      allEntries = allEntries.concat(entries);
      
      // If we got fewer than CHUNK_SIZE, we're done
      if (entries.length < CHUNK_SIZE) {
        hasMore = false;
      } else {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      console.log(`Loaded ${allEntries.length} entries so far...`);
    }

    console.log(`Total entries to update: ${allEntries.length}`);
    return allEntries;
  }

  private async getPreviousBalance(targetDate: any): Promise<number> {
    // Get the last entry before the target date to get its balance
    const q = query(
      this.collectionRef,
      where('createdAt', '<', targetDate),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return 0; // No previous entries, starting balance is 0
    }
    
    const lastEntry = snapshot.docs[0].data() as LedgerEntry;
    return lastEntry.balance || 0;
  }

  private async batchUpdateBalances(entries: LedgerEntry[], startingBalance: number, progressCallback?: (progress: number) => void): Promise<void> {
    
    // Process in batches of 500 (Firestore batch limit)
    const BATCH_SIZE = 500;
    let runningBalance = startingBalance;
    
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      const batchEntries = entries.slice(i, i + BATCH_SIZE);
      
      for (const entry of batchEntries) {
        runningBalance = runningBalance + (entry.credit || 0) - (entry.debit || 0);
        
        const entryDocRef = doc(this.firestore, 'ledger', entry.id!);
        batch.update(entryDocRef, {
          balance: runningBalance,
          updatedAt: new Date()
        });
      }
      
      // Commit this batch
      await batch.commit();
      
      // Report progress
      const processedEntries = Math.min(i + BATCH_SIZE, entries.length);
      const progress = (processedEntries / entries.length) * 100;
      
      if (progressCallback) {
        progressCallback(progress);
      }
      
      console.log(`Updated batch ${Math.floor(i / BATCH_SIZE) + 1} - ${batchEntries.length} entries (${progress.toFixed(1)}% complete)`);
    }
  }

  // Keep the old method for backward compatibility but mark as deprecated
  private async getAllLedgerEntriesSorted(): Promise<LedgerEntry[]> {
    console.warn('getAllLedgerEntriesSorted is deprecated - use more efficient queries');
    const q = query(this.collectionRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LedgerEntry));
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
