import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, deleteUser, updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from '@angular/fire/auth';
import { DocumentData, CollectionReference, Firestore, collection, doc, deleteDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { query, where, getDocs } from 'firebase/firestore';

import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private collectionRef: CollectionReference<DocumentData>;

  constructor() {
    this.collectionRef = collection(this.firestore, 'users');
  }

  public getAdmins(): Observable<AppUser[]> {
    const q = query(this.collectionRef, where('role', '==', 'admin'));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        ...(doc.data() as AppUser)
      })))
    );
  }

  public deleteAdmin(uid: string): Observable<void> {
    const docRef = doc(this.firestore, 'users', uid);
    return from(updateDoc(docRef, { isActive: false }));
  }

  public toggleAdminStatus(uid: string, isDisabled: boolean): Observable<void> {
    const docRef = doc(this.firestore, 'users', uid);
    return from(updateDoc(docRef, { isDisabled }));
  }

  public updateAdmin(uid: string, data: Partial<AppUser>): Observable<void> {
    const docRef = doc(this.firestore, 'users', uid);
    return from(updateDoc(docRef, { ...data, updatedAt: new Date() }));
  }

  public getAdminPassword(uid: string): Observable<string> {
    const docRef = doc(this.firestore, 'users', uid);
    return from(getDoc(docRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AppUser;
          return data.password || '';
        }
        return '';
      })
    );
  }

  public resetPassword(uid: string, newPassword: string): Observable<void> {
    const docRef = doc(this.firestore, 'users', uid);
    return from(updateDoc(docRef, { 
      password: newPassword, 
      updatedAt: new Date() 
    }));
  }

  public generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
