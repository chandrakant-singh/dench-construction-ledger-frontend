import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-admins',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">Manage Admins</h2>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="card-title mb-0">Create Admin</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Create new admin users who can manage supervisors and view ledgers.</p>
              <button class="btn btn-primary" routerLink="/super-admin/create-admin">
                <i class="bi bi-person-plus-fill me-2"></i>Create Admin
              </button>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="card-title mb-0">Create Supervisor</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Create new supervisor users who can manage ledger entries.</p>
              <button class="btn btn-success" routerLink="/super-admin/create-supervisor">
                <i class="bi bi-person-badge-fill me-2"></i>Create Supervisor
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">User Management</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Manage existing users, view their roles, and perform administrative actions.</p>
              <div class="d-grid gap-2 d-md-flex">
                <button class="btn btn-outline-primary">
                  <i class="bi bi-list-ul me-2"></i>View All Users
                </button>
                <button class="btn btn-outline-warning">
                  <i class="bi bi-gear me-2"></i>User Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> -->
    </div>
  `,
  styles: []
})
export class ManageAdminsComponent {
  constructor() { }

  ngOnInit(): void {
  }
} 