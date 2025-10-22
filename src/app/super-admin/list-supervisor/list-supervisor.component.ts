import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SupervisorService } from '../../core/services/supervisor.service';
import { AppUser } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toaster.service';
import { SupervisorDetailsComponent } from '../../shared/components/supervisor-details/supervisor-details.component';

@Component({
  selector: 'app-super-admin-list-supervisor',
  imports: [CommonModule, FormsModule, RouterModule, SupervisorDetailsComponent],
  templateUrl: './list-supervisor.component.html',
  styleUrl: './list-supervisor.component.scss'
})
export class SuperAdminListSupervisorComponent implements OnInit {
  supervisors: AppUser[] = [];
  filteredSupervisors: AppUser[] = [];
  editingSupervisor: AppUser | null = null;
  showPasswordModal: boolean = false;
  selectedSupervisor: AppUser | null = null;
  supervisorPassword: string | null = null;
  showPasswordText: boolean = false;
  isLoadingPassword: boolean = false;
  newPassword: string = '';
  showPasswordResetForm: boolean = false;
  isResettingPassword: boolean = false;
  
  // Supervisor Details Modal
  showSupervisorDetailsModal: boolean = false;
  selectedSupervisorForDetails: AppUser | null = null;
  
  // Filter properties
  searchTerm: string = '';
  statusFilter: string = '';

  constructor(
    private supervisorService: SupervisorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.getSupervisors();
  }

  private getSupervisors(): void {
    this.supervisorService.getSupervisors()
      .subscribe({
        next: (supervisors) => {
          console.log('Supervisors loaded:', supervisors);
          this.supervisors = supervisors;
          this.filteredSupervisors = supervisors;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error fetching supervisors:', error);
          this.toastService.show('Error loading supervisors', 'danger');
        }
      });
  }

  deleteSupervisor(supervisor: AppUser): void {
    if (confirm(`Are you sure you want to deactivate ${supervisor.name}? This will remove them from the active supervisors list.`)) {
      this.supervisorService.deleteSupervisor(supervisor.uid)
        .subscribe({
          next: () => {
            this.toastService.show('Supervisor deactivated successfully', 'success');
            this.getSupervisors(); // Refresh the list
          },
          error: (error) => {
            console.error('Error deactivating supervisor:', error);
            this.toastService.show('Error deactivating supervisor', 'danger');
          }
        });
    }
  }

  toggleSupervisorStatus(supervisor: AppUser): void {
    const newStatus = !supervisor.isDisabled;
    this.supervisorService.toggleSupervisorStatus(supervisor.uid, newStatus)
      .subscribe({
        next: () => {
          supervisor.isDisabled = newStatus;
          const statusText = newStatus ? 'disabled' : 'enabled';
          this.toastService.show(`Supervisor ${statusText} successfully`, 'success');
        },
        error: (error) => {
          console.error('Error updating supervisor status:', error);
          this.toastService.show('Error updating supervisor status', 'danger');
        }
      });
  }

  editSupervisor(supervisor: AppUser): void {
    this.editingSupervisor = { ...supervisor };
  }

  saveEdit(): void {
    if (this.editingSupervisor) {
      this.supervisorService.updateSupervisor(this.editingSupervisor.uid, {
        name: this.editingSupervisor.name,
        email: this.editingSupervisor.email
      })
      .subscribe({
        next: () => {
          this.toastService.show('Supervisor updated successfully', 'success');
          this.editingSupervisor = null;
          this.getSupervisors(); // Refresh the list
        },
        error: (error) => {
          console.error('Error updating supervisor:', error);
          this.toastService.show('Error updating supervisor', 'danger');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingSupervisor = null;
  }

  showPassword(supervisor: AppUser): void {
    this.selectedSupervisor = supervisor;
    this.showPasswordModal = true;
    this.supervisorPassword = null;
    this.showPasswordText = false;
    this.isLoadingPassword = true;
    
    // Fetch the supervisor's password
    this.supervisorService.getSupervisorPassword(supervisor.uid)
      .subscribe({
        next: (password) => {
          this.supervisorPassword = password;
          this.isLoadingPassword = false;
        },
        error: (error) => {
          console.error('Error fetching supervisor password:', error);
          this.toastService.show('Error fetching supervisor password', 'danger');
          this.isLoadingPassword = false;
        }
      });
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.selectedSupervisor = null;
    this.supervisorPassword = null;
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
    if (this.supervisorPassword) {
      navigator.clipboard.writeText(this.supervisorPassword).then(() => {
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
    this.newPassword = this.supervisorService.generateRandomPassword(12);
  }

  saveNewPassword(): void {
    if (!this.selectedSupervisor || !this.newPassword.trim()) {
      this.toastService.show('Please enter a new password', 'danger');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.show('Password must be at least 6 characters long', 'danger');
      return;
    }

    this.isResettingPassword = true;
    
    this.supervisorService.resetPassword(this.selectedSupervisor.uid, this.newPassword)
      .subscribe({
        next: () => {
          this.toastService.show('Password updated successfully', 'success');
          this.supervisorPassword = this.newPassword;
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

  showSupervisorDetails(supervisor: AppUser): void {
    this.selectedSupervisorForDetails = supervisor;
    this.showSupervisorDetailsModal = true;
  }

  closeSupervisorDetailsModal(): void {
    this.showSupervisorDetailsModal = false;
    this.selectedSupervisorForDetails = null;
  }

  trackByFn(index: number, supervisor: AppUser): string {
    return supervisor.uid;
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
    this.filteredSupervisors = this.supervisors.filter(supervisor => {
      // Search filter
      const matchesSearch = !this.searchTerm || 
        supervisor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        supervisor.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = !this.statusFilter || 
        (this.statusFilter === 'active' && !supervisor.isDisabled) ||
        (this.statusFilter === 'disabled' && supervisor.isDisabled);

      return matchesSearch && matchesStatus;
    });
  }
}
