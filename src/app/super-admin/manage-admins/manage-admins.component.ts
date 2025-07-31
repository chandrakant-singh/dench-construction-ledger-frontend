import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-admins',
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">Manage Admins</h2>
          <div class="card">
            <div class="card-body">
              <p>Manage admin users functionality will be implemented here.</p>
              <button class="btn btn-primary">Add New Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ManageAdminsComponent {
  constructor() { }

  ngOnInit(): void {
  }
} 