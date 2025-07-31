import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent {
  stats = [
    { title: 'Total Admins', value: 5, icon: 'bi-people-fill', color: 'primary' },
    { title: 'Total Supervisors', value: 25, icon: 'bi-person-badge-fill', color: 'success' },
    { title: 'Total Ledger Entries', value: 1250, icon: 'bi-journal-text', color: 'info' },
    { title: 'System Health', value: '99.9%', icon: 'bi-heart-pulse-fill', color: 'warning' }
  ];

  recentActivities = [
    { action: 'New Admin Created', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { action: 'Supervisor Approved', user: 'Jane Smith', time: '4 hours ago', type: 'info' },
    { action: 'System Backup', user: 'System', time: '6 hours ago', type: 'primary' },
    { action: 'Report Generated', user: 'Mike Johnson', time: '8 hours ago', type: 'warning' }
  ];

  constructor() { }

  ngOnInit(): void {
  }
} 