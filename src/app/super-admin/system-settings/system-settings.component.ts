import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-settings',
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">System Settings</h2>
          <div class="card">
            <div class="card-body">
              <p>System configuration and settings will be managed here.</p>
              <div class="row">
                <div class="col-md-6">
                  <h5>General Settings</h5>
                  <p>Application configuration options</p>
                </div>
                <div class="col-md-6">
                  <h5>Security Settings</h5>
                  <p>Security and authentication configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemSettingsComponent {
  constructor() { }

  ngOnInit(): void {
  }
} 