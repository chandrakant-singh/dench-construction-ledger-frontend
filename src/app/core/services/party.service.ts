import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Party, PartyReq } from '../models/party.model';

@Injectable({
  providedIn: 'root'
})
export class PartyService {
  private collectionName = 'parties';

  constructor(private firestore: Firestore) { }

  // Create a new party
  create(party: Omit<Party, 'id'>): Observable<string> {
    const id = doc(collection(this.firestore, 'temp')).id; // Generate ID
    const partyWithId: PartyReq = {
      id,
      ...party
    };
    return from(setDoc(doc(this.firestore, this.collectionName, id), partyWithId).then(() => id));
  }

  // Get all parties
  getAll(): Observable<Party[]> {
    return collectionData(collection(this.firestore, this.collectionName)) as Observable<Party[]>;
  }

  // Get party by ID
  getById(id: string): Observable<Party | undefined> {
    return from(getDoc(doc(this.firestore, this.collectionName, id)).then(doc => doc.data() as Party | undefined));
  }

  // Update party
  update(id: string, party: Partial<Party>): Observable<void> {
    return from(updateDoc(doc(this.firestore, this.collectionName, id), party));
  }

  // Delete party
  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.collectionName, id)));
  }
} 