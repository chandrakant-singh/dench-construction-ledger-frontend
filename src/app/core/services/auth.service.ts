import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { EndPoints } from '../../shared/constants/endpoints';
import { AppUser } from '../models/user.model';
import { Roles } from '../../shared/constants/roles';
import { Constants } from '../../shared/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // 🔐 Login
  async login(email: string, password: string): Promise<void> {
    const credential: any = await signInWithEmailAndPassword(this.auth, email, password);
    console.log('Credential:', credential);
    const uid = credential.user.uid;

    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as AppUser;
      
      // Check if user is disabled
      if (userData.isDisabled === true) {
        await signOut(this.auth);
        throw new Error('Your account has been disabled. Please contact administrator.');
      }
      
      // Check if user is inactive (soft deleted)
      if (userData.isActive === false) {
        await signOut(this.auth);
        throw new Error('Your account is no longer active. Please contact administrator.');
      }
      
      localStorage.setItem(Constants.USER, JSON.stringify(userData));
      localStorage.setItem(Constants.USER_ID, uid);
      console.log("========== USER DATA ==========", userData);
      
      if (userData.role === Roles.SUPER_ADMIN) {
        localStorage.setItem(Constants.SUPER_ADMIN_TOKEN, credential.user.accessToken);
        this.router.navigate([EndPoints.SUPER_ADMIN_DASHBOARD]);
      } else if (userData.role === Roles.ADMIN) {
        localStorage.setItem(Constants.ADMIN_TOKEN, credential.user.accessToken);
        this.router.navigate([EndPoints.ADMIN_DASHBOARD]);
      } else if (userData.role === Roles.SUPERVISOR) {
        localStorage.setItem(Constants.SUPERVISOR_TOKEN, credential.user.accessToken);
        this.router.navigate([EndPoints.SUPERVISOR_DASHBOARD]);
      }
    }
  }


  // ➕ Create Supervisor (Admin only)
  async createSupervisor(name: string, email: string, password: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = userCredential.user.uid;

    // Store supervisor details including password in Firestore
    const supervisorRef = doc(this.firestore, 'users', uid);
    await setDoc(supervisorRef, {
      uid,
      name,
      email,
      password,
      role: 'supervisor',
      isActive: true,
      isDisabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // ➕ Create Admin (SuperAdmin only)
  async createAdmin(name: string, email: string, password: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = userCredential.user.uid;

    // Store admin details including password in Firestore
    const adminRef = doc(this.firestore, 'users', uid);
    await setDoc(adminRef, {
      uid,
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
      isDisabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 🚪 Logout
  async logout(): Promise<any> {
    localStorage.clear();
    sessionStorage.clear();
    return signOut(this.auth).then(() => this.router.navigate(['auth/login']));
  }

  async getLoggedInUserDetails(): Promise<any> {
    const uid = localStorage.getItem(Constants.USER_ID);
    const userRef = doc(this.firestore, 'users', uid || '');
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as AppUser;
    }
  }
}
