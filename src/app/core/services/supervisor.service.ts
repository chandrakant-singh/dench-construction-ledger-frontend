import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';
import { DocumentData, CollectionReference, Firestore, collection } from '@angular/fire/firestore';
import { query, where, getDocs } from 'firebase/firestore';

import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SupervisorService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private collectionRef: CollectionReference<DocumentData>;

  constructor() {
    this.collectionRef = collection(this.firestore, 'users');
  }

  public getSupervisors(): Observable<AppUser[]> {
    const q = query(this.collectionRef, where('role', '==', 'supervisor'));
    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as AppUser)
        }))
      )
    );
  }

}
