import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { PartyMainCategoryMap, PartyMainCategoryMapReq } from '../models/party-main-category-map.model';

@Injectable({
  providedIn: 'root'
})
export class PartyMainCategoryMapService {
  private collectionName = 'partyMainCategoryMaps';

  constructor(private firestore: Firestore) { }

  // Create a new mapping
  create(mapping: Omit<PartyMainCategoryMap, 'id'>): Observable<string> {
    const id = doc(collection(this.firestore, 'temp')).id; // Generate ID
    const mappingWithId: PartyMainCategoryMapReq = {
      id,
      ...mapping
    };
    return from(setDoc(doc(this.firestore, this.collectionName, id), mappingWithId).then(() => id));
  }

  // Get all mappings
  getAll(): Observable<PartyMainCategoryMap[]> {
    return collectionData(collection(this.firestore, this.collectionName)) as Observable<PartyMainCategoryMap[]>;
  }

  // Get mappings by party ID
  getByPartyId(partyId: string): Observable<PartyMainCategoryMap[]> {
    const q = query(collection(this.firestore, this.collectionName), where('partyId', '==', partyId));
    return collectionData(q) as Observable<PartyMainCategoryMap[]>;
  }

  // Get mappings by main category ID
  getByMainCategoryId(mainCategoryId: string): Observable<PartyMainCategoryMap[]> {
    const q = query(collection(this.firestore, this.collectionName), where('mainCategoryId', '==', mainCategoryId));
    return collectionData(q) as Observable<PartyMainCategoryMap[]>;
  }

  // Get mapping by ID
  getById(id: string): Observable<PartyMainCategoryMap | undefined> {
    return from(getDoc(doc(this.firestore, this.collectionName, id)).then(doc => doc.data() as PartyMainCategoryMap | undefined));
  }

  // Update mapping
  update(id: string, mapping: Partial<PartyMainCategoryMap>): Observable<void> {
    return from(updateDoc(doc(this.firestore, this.collectionName, id), mapping));
  }

  // Delete mapping
  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.collectionName, id)));
  }

  // Check if mapping exists
  exists(partyId: string, mainCategoryId: string): Observable<boolean> {
    const q = query(
      collection(this.firestore, this.collectionName), 
      where('partyId', '==', partyId), 
      where('mainCategoryId', '==', mainCategoryId)
    );
    return from(getDocs(q).then(snapshot => !snapshot.empty));
  }
} 