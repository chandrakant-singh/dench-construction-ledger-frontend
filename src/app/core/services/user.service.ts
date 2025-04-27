import { Injectable } from '@angular/core';
import { Auth, user, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, collection, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, from, map, Observable, of, switchMap } from 'rxjs';

import { AppUser } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject = new BehaviorSubject<any | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private authService: AuthService
  ) { }

  // 🔐 Get current Firebase Auth user (basic info)
  getCurrentUserAuth(): Observable<FirebaseUser | null> {
    return user(this.auth);
  }

  // 🔍 Get current user's Firestore profile
  getCurrentUserProfile(): Observable<AppUser | null> {
    return user(this.auth).pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) return of(null);
        const docRef = doc(this.firestore, `users/${firebaseUser.uid}`);
        return from(getDoc(docRef)).pipe(
          map(snapshot => {
            if (!snapshot.exists()) return null;
            return snapshot.data() as AppUser;
          })
        );
      })
    );
  }

  // 📋 Get all users (for admin usage)
  getAllUsers(): Observable<AppUser[]> {
    const usersRef = collection(this.firestore, 'users');
    return from(getDocs(usersRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        ...(doc.data() as AppUser)
      })))
    );
  }

  setUser(user: any) {
    this.userSubject.next(user);
  }

  async getUser(): Promise<AppUser> {
    return await this.authService.getLoggedInUserDetails();
  }

  isAdmin() {
    return this.userSubject.value?.role === 'admin';
  }

  isSupervisor() {
    return this.userSubject.value?.role === 'supervisor';
  }
}
