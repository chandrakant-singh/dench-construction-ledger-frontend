import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminService } from '../../core/services/admin.service';
import { AppUser } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toaster.service';

@Component({
  selector: 'app-list-admin',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './list-admin.component.html',
  styleUrl: './list-admin.component.scss'
})
export class ListAdminComponent implements OnInit {
  admins: AppUser[] = [];
  filteredAdmins: AppUser[] = [];
  editingAdmin: AppUser | null = null;
  showPasswordModal: boolean = false;
  selectedAdmin: AppUser | null = null;
  adminPassword: string | null = null;
  showPasswordText: boolean = false;
  isLoadingPassword: boolean = false;
  newPassword: string = '';
  showPasswordResetForm: boolean = false;
  isResettingPassword: boolean = false;
  
  // Filter properties
  searchTerm: string = '';
  statusFilter: string = '';

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.getAdmins();
  }

  private getAdmins(): void {
    this.adminService.getAdmins()
      .subscribe({
        next: (admins) => {
          console.log('Admins loaded:', admins);
          this.admins = admins;
          this.filteredAdmins = admins;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error fetching admins:', error);
          this.toastService.show('Error loading admins', 'danger');
        }
      });
  }

  deleteAdmin(admin: AppUser): void {
    if (confirm(`Are you sure you want to deactivate ${admin.name}? This will remove them from the active admins list.`)) {
      this.adminService.deleteAdmin(admin.uid)
        .subscribe({
          next: () => {
            this.toastService.show('Admin deactivated successfully', 'success');
            this.getAdmins(); // Refresh the list
          },
          error: (error) => {
            console.error('Error deactivating admin:', error);
            this.toastService.show('Error deactivating admin', 'danger');
          }
        });
    }
  }

  toggleAdminStatus(admin: AppUser): void {
    const newStatus = !admin.isDisabled;
    this.adminService.toggleAdminStatus(admin.uid, newStatus)
      .subscribe({
        next: () => {
          admin.isDisabled = newStatus;
          const statusText = newStatus ? 'disabled' : 'enabled';
          this.toastService.show(`Admin ${statusText} successfully`, 'success');
        },
        error: (error) => {
          console.error('Error updating admin status:', error);
          this.toastService.show('Error updating admin status', 'danger');
        }
      });
  }

  editAdmin(admin: AppUser): void {
    this.editingAdmin = { ...admin };
  }

  saveEdit(): void {
    if (this.editingAdmin) {
      this.adminService.updateAdmin(this.editingAdmin.uid, {
        name: this.editingAdmin.name,
        email: this.editingAdmin.email
      })
      .subscribe({
        next: () => {
          this.toastService.show('Admin updated successfully', 'success');
          this.editingAdmin = null;
          this.getAdmins(); // Refresh the list
        },
        error: (error) => {
          console.error('Error updating admin:', error);
          this.toastService.show('Error updating admin', 'danger');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingAdmin = null;
  }

  showPassword(admin: AppUser): void {
    this.selectedAdmin = admin;
    this.showPasswordModal = true;
    this.adminPassword = null;
    this.showPasswordText = false;
    this.isLoadingPassword = true;
    
    // Fetch the admin's password
    this.adminService.getAdminPassword(admin.uid)
      .subscribe({
        next: (password) => {
          this.adminPassword = password;
          this.isLoadingPassword = false;
        },
        error: (error) => {
          console.error('Error fetching admin password:', error);
          this.toastService.show('Error fetching admin password', 'danger');
          this.isLoadingPassword = false;
        }
      });
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.selectedAdmin = null;
    this.adminPassword = null;
    this.showPasswordText = false;
    this.isLoadingPassword = false;
    this.showPasswordResetForm = false;
    this.newPassword = '';
    this.isResettingPassword = false;
  }

  togglePasswordVisibility(): void {
    this.showPasswordText = !this.showPasswordText;
  }

  copyPasswordToClipboard(): void {
    if (this.adminPassword) {
      navigator.clipboard.writeText(this.adminPassword).then(() => {
        this.toastService.show('Password copied to clipboard', 'success');
      }).catch(() => {
        this.toastService.show('Failed to copy password', 'danger');
      });
    }
  }

  resetPassword(): void {
    this.showPasswordResetForm = true;
  }

  generateRandomPassword(): void {
    this.newPassword = this.adminService.generateRandomPassword(12);
  }

  saveNewPassword(): void {
    if (!this.selectedAdmin || !this.newPassword.trim()) {
      this.toastService.show('Please enter a new password', 'danger');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.show('Password must be at least 6 characters long', 'danger');
      return;
    }

    this.isResettingPassword = true;
    
    this.adminService.resetPassword(this.selectedAdmin.uid, this.newPassword)
      .subscribe({
        next: () => {
          this.toastService.show('Password updated successfully', 'success');
          this.adminPassword = this.newPassword;
          this.showPasswordResetForm = false;
          this.newPassword = '';
          this.isResettingPassword = false;
        },
        error: (error) => {
          console.error('Error updating password:', error);
          this.toastService.show('Error updating password', 'danger');
          this.isResettingPassword = false;
        }
      });
  }

  cancelPasswordReset(): void {
    this.showPasswordResetForm = false;
    this.newPassword = '';
    this.isResettingPassword = false;
  }

  trackByFn(index: number, admin: AppUser): string {
    return admin.uid;
  }

  // Filter methods
  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredAdmins = this.admins.filter(admin => {
      // Search filter
      const matchesSearch = !this.searchTerm || 
        admin.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = !this.statusFilter || 
        (this.statusFilter === 'active' && !admin.isDisabled) ||
        (this.statusFilter === 'disabled' && admin.isDisabled);

      return matchesSearch && matchesStatus;
    });
  }
}
