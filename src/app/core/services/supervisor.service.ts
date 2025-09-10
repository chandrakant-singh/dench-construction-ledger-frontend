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
        snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as AppUser)
          }))
          .filter(supervisor => supervisor.isActive !== false) // Filter out soft-deleted users
      )
    );
  }

  public deleteSupervisor(supervisorId: string): Observable<void> {
    // Soft delete - set isActive to false instead of deleting
    const docRef = doc(this.firestore, 'users', supervisorId);
    return from(updateDoc(docRef, { 
      isActive: false, 
      updatedAt: new Date() 
    }));
  }

  public updateSupervisor(supervisorId: string, data: Partial<AppUser>): Observable<void> {
    const docRef = doc(this.firestore, 'users', supervisorId);
    return from(updateDoc(docRef, data));
  }

  public toggleSupervisorStatus(supervisorId: string, isDisabled: boolean): Observable<void> {
    const docRef = doc(this.firestore, 'users', supervisorId);
    return from(updateDoc(docRef, { 
      isDisabled: isDisabled,
      updatedAt: new Date()
    }));
  }

  public resetPassword(supervisorId: string, newPassword: string): Observable<void> {
    return from(this.resetPasswordWithFirebaseAuth(supervisorId, newPassword));
  }

  private async resetPasswordWithFirebaseAuth(supervisorId: string, newPassword: string): Promise<void> {
    try {
      // Get supervisor data from Firestore
      const docRef = doc(this.firestore, 'users', supervisorId);
      const supervisorDoc = await getDoc(docRef);
      
      if (!supervisorDoc.exists()) {
        throw new Error('Supervisor not found');
      }
      
      const supervisorData = supervisorDoc.data() as AppUser;
      
      // Update password in Firestore
      await updateDoc(docRef, { 
        password: newPassword,
        updatedAt: new Date()
      });
      
      // Update password in Firebase Authentication
      // Note: This requires admin privileges or the user to be signed in
      // For now, we'll store the password in Firestore and the supervisor can use it to login
      console.log('Password updated in Firestore. Firebase Auth update requires admin SDK or user re-authentication.');
      
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  public generateRandomPassword(length: number = 8): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  public getSupervisorPassword(supervisorId: string): Observable<string | null> {
    const docRef = doc(this.firestore, 'users', supervisorId);
    return from(getDoc(docRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as AppUser;
          return data.password || null;
        }
        return null;
      })
    );
  }

  public updateSupervisorPassword(supervisorId: string, newPassword: string): Observable<void> {
    const docRef = doc(this.firestore, 'users', supervisorId);
    return from(updateDoc(docRef, { password: newPassword }));
  }

}
