import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { AppUser } from '../models/user.model';
import { Roles } from '../../shared/constants/roles';
import { Constants } from '../../shared/constants/constants';
import { StorageUtils } from './storage.utils';

/**
 * Role Utils Service
 * Centralized service for managing user roles, permissions, and user details
 * 
 * Usage Examples:
 * 
 * // Check user role
 * if (this.roleUtils.isAdmin()) { ... }
 * 
 * // Check permissions
 * if (this.roleUtils.canDeleteEntries()) { ... }
 * 
 * // Get user details
 * const userName = this.roleUtils.getCurrentUserName();
 * const userRole = this.roleUtils.getCurrentUserRole();
 * 
 * // In templates
 * *ngIf="roleUtils.canCreateEntries()"
 * *ngIf="roleUtils.isAdmin()"
 * 
 * // Subscribe to user changes
 * this.roleUtils.currentUser$.subscribe(user => { ... });
 */
@Injectable({
  providedIn: 'root'
})
export class RoleUtils {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.initializeCurrentUser();
  }

  /**
   * Initialize current user from localStorage
   */
  private initializeCurrentUser(): void {
    const userData = this.getCurrentUserFromStorage();
    if (userData) {
      this.currentUserSubject.next(userData);
    }
  }

  /**
   * Get current user details from localStorage
   */
  getCurrentUserFromStorage(): AppUser | null {
    try {
      const userData = StorageUtils.getItem(Constants.USER);
      return userData as AppUser;
    } catch (error) {
      console.error('Error getting current user from storage:', error);
      return null;
    }
  }

  /**
   * Get current user details as Observable
   */
  getCurrentUser(): Observable<AppUser | null> {
    const user = this.getCurrentUserFromStorage();
    return of(user);
  }

  /**
   * Get current user details synchronously
   */
  getCurrentUserSync(): AppUser | null {
    return this.getCurrentUserFromStorage();
  }

  /**
   * Update current user in both localStorage and BehaviorSubject
   */
  updateCurrentUser(user: AppUser): void {
    StorageUtils.setItem(Constants.USER, user);
    this.currentUserSubject.next(user);
  }

  /**
   * Clear current user data
   */
  clearCurrentUser(): void {
    localStorage.removeItem(Constants.USER);
    localStorage.removeItem(Constants.USER_ID);
    localStorage.removeItem(Constants.ADMIN_TOKEN);
    localStorage.removeItem(Constants.SUPERVISOR_TOKEN);
    this.currentUserSubject.next(null);
  }

  // ==================== ROLE CHECKING METHODS ====================

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserSync();
    return user?.role === role;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.hasRole(Roles.ADMIN);
  }

  /**
   * Check if current user is supervisor
   */
  isSupervisor(): boolean {
    return this.hasRole(Roles.SUPERVISOR);
  }

  /**
   * Check if current user is super admin
   */
  isSuperAdmin(): boolean {
    return this.hasRole(Roles.SUPER_ADMIN);
  }

  /**
   * Check if current user has admin or super admin privileges
   */
  isAdminOrSuperAdmin(): boolean {
    return this.isAdmin() || this.isSuperAdmin();
  }

  /**
   * Check if current user has any admin privileges (admin, super admin, or supervisor)
   */
  hasAdminPrivileges(): boolean {
    return this.isAdmin() || this.isSupervisor() || this.isSuperAdmin();
  }

  // ==================== PERMISSION METHODS ====================

  /**
   * Check if user can create entries
   */
  canCreateEntries(): boolean {
    return this.hasAdminPrivileges();
  }

  /**
   * Check if user can edit entries
   */
  canEditEntries(): boolean {
    return this.hasAdminPrivileges();
  }

  /**
   * Check if user can delete entries
   */
  canDeleteEntries(): boolean {
    return this.isAdminOrSuperAdmin();
  }

  /**
   * Check if user can approve entries
   */
  canApproveEntries(): boolean {
    return this.isAdminOrSuperAdmin();
  }

  /**
   * Check if user can view all entries (not just today's)
   */
  canViewAllEntries(): boolean {
    return this.isAdminOrSuperAdmin();
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    return this.isAdminOrSuperAdmin();
  }

  /**
   * Check if user can access admin dashboard
   */
  canAccessAdminDashboard(): boolean {
    return this.isAdminOrSuperAdmin();
  }

  /**
   * Check if user can access supervisor dashboard
   */
  canAccessSupervisorDashboard(): boolean {
    return this.hasAdminPrivileges();
  }

  /**
   * Check if user can export data
   */
  canExportData(): boolean {
    return this.hasAdminPrivileges();
  }

  // ==================== USER DETAILS METHODS ====================

  /**
   * Get current user's UID
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUserSync();
    return user?.uid || null;
  }

  /**
   * Get current user's name
   */
  getCurrentUserName(): string | null {
    const user = this.getCurrentUserSync();
    return user?.name || null;
  }

  /**
   * Get current user's email
   */
  getCurrentUserEmail(): string | null {
    const user = this.getCurrentUserSync();
    return user?.email || null;
  }

  /**
   * Get current user's role
   */
  getCurrentUserRole(): string | null {
    const user = this.getCurrentUserSync();
    return user?.role || null;
  }

  /**
   * Check if current user is active
   */
  isCurrentUserActive(): boolean {
    const user = this.getCurrentUserSync();
    return user?.isActive !== false;
  }

  /**
   * Check if current user is disabled
   */
  isCurrentUserDisabled(): boolean {
    const user = this.getCurrentUserSync();
    return user?.isDisabled === true;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get user display name (fallback to email if name not available)
   */
  getUserDisplayName(): string {
    const name = this.getCurrentUserName();
    const email = this.getCurrentUserEmail();
    return name || email || 'Unknown User';
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(): string {
    const role = this.getCurrentUserRole();
    switch (role) {
      case Roles.ADMIN:
        return 'Administrator';
      case Roles.SUPERVISOR:
        return 'Supervisor';
      case Roles.SUPER_ADMIN:
        return 'Super Administrator';
      default:
        return 'User';
    }
  }

  /**
   * Get all available roles
   */
  getAllRoles(): string[] {
    return Object.values(Roles);
  }

  /**
   * Check if a role is valid
   */
  isValidRole(role: string): boolean {
    return this.getAllRoles().includes(role);
  }

  /**
   * Get role hierarchy level (higher number = more privileges)
   */
  getRoleLevel(role: string): number {
    switch (role) {
      case Roles.SUPER_ADMIN:
        return 3;
      case Roles.ADMIN:
        return 2;
      case Roles.SUPERVISOR:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Check if current user has higher or equal role level than specified role
   */
  hasRoleLevelOrHigher(requiredRole: string): boolean {
    const currentRole = this.getCurrentUserRole();
    if (!currentRole) return false;
    
    const currentLevel = this.getRoleLevel(currentRole);
    const requiredLevel = this.getRoleLevel(requiredRole);
    
    return currentLevel >= requiredLevel;
  }

  // ==================== DEBUGGING METHODS ====================

  /**
   * Log current user details (for debugging)
   */
  logCurrentUserDetails(): void {
    const user = this.getCurrentUserSync();
    console.log('Current User Details:', {
      user,
      role: this.getCurrentUserRole(),
      isAdmin: this.isAdmin(),
      isSupervisor: this.isSupervisor(),
      isSuperAdmin: this.isSuperAdmin(),
      canCreateEntries: this.canCreateEntries(),
      canEditEntries: this.canEditEntries(),
      canDeleteEntries: this.canDeleteEntries(),
      canApproveEntries: this.canApproveEntries()
    });
  }
}
