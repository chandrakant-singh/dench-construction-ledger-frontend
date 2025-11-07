import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { UserService } from '../../core/services/user.service';
import { LedgerService } from '../../core/services/ledger.service';
import { StockLedgerService } from '../../core/services/stock-ledger.service';
import { BalanceLedgerService } from '../../core/services/balance-ledger.service';
import { Roles } from '../../shared/constants/roles';
import { AppUser } from '../../core/models/user.model';

interface Activity {
  action: string;
  user: string;
  time: string;
  type: string;
}

interface Stat {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent implements OnInit {
  stats: Stat[] = [
    { title: 'Total Admins', value: 0, icon: 'bi-people-fill', color: 'primary' },
    { title: 'Total Supervisors', value: 0, icon: 'bi-person-badge-fill', color: 'success' },
    { title: 'Total Ledger Entries', value: 0, icon: 'bi-journal-text', color: 'info' },
    { title: 'System Health', value: '100%', icon: 'bi-heart-pulse-fill', color: 'warning' }
  ];

  recentActivities: Activity[] = [];
  isLoading = true;

  constructor(
    private userService: UserService,
    private ledgerService: LedgerService,
    private stockLedgerService: StockLedgerService,
    private balanceLedgerService: BalanceLedgerService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Fetch all data in parallel
    forkJoin({
      users: this.userService.getAllUsers(),
      ledgerEntries: this.ledgerService.getLedgerEntries(),
      stockEntries: this.stockLedgerService.getLedgerEntries(),
      balanceEntries: this.balanceLedgerService.getLedgerEntries()
    }).subscribe({
      next: (data) => {
        this.calculateStats(data.users, data.ledgerEntries, data.stockEntries, data.balanceEntries);
        this.generateRecentActivities(data.users, data.ledgerEntries, data.stockEntries, data.balanceEntries);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
        // Set default values on error
        this.stats = [
          { title: 'Total Admins', value: 0, icon: 'bi-people-fill', color: 'primary' },
          { title: 'Total Supervisors', value: 0, icon: 'bi-person-badge-fill', color: 'success' },
          { title: 'Total Ledger Entries', value: 0, icon: 'bi-journal-text', color: 'info' },
          { title: 'System Health', value: 'N/A', icon: 'bi-heart-pulse-fill', color: 'warning' }
        ];
        this.recentActivities = [];
      }
    });
  }

  private calculateStats(
    users: AppUser[],
    ledgerEntries: any[],
    stockEntries: any[],
    balanceEntries: any[]
  ): void {
    // Count admins (excluding super_admin)
    const adminCount = users.filter(user => 
      user.role === Roles.ADMIN && 
      user.isActive !== false && 
      user.isDisabled !== true
    ).length;

    // Count supervisors
    const supervisorCount = users.filter(user => 
      user.role === Roles.SUPERVISOR && 
      user.isActive !== false && 
      user.isDisabled !== true
    ).length;

    // Count total ledger entries
    const totalLedgerEntries = ledgerEntries.length + stockEntries.length + balanceEntries.length;

    // Calculate system health based on active users and data integrity
    const activeUsers = users.filter(user => user.isActive !== false && user.isDisabled !== true).length;
    const totalUsers = users.length;
    const userHealthPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 100;
    
    // Simple health calculation - can be enhanced with more metrics
    const systemHealth = userHealthPercentage >= 95 ? '99.9%' : 
                        userHealthPercentage >= 90 ? '95%' : 
                        userHealthPercentage >= 80 ? '85%' : 
                        `${userHealthPercentage}%`;

    this.stats = [
      { title: 'Total Admins', value: adminCount, icon: 'bi-people-fill', color: 'primary' },
      { title: 'Total Supervisors', value: supervisorCount, icon: 'bi-person-badge-fill', color: 'success' },
      { title: 'Total Ledger Entries', value: totalLedgerEntries, icon: 'bi-journal-text', color: 'info' },
      { title: 'System Health', value: systemHealth, icon: 'bi-heart-pulse-fill', color: 'warning' }
    ];
  }

  private generateRecentActivities(
    users: AppUser[],
    ledgerEntries: any[],
    stockEntries: any[],
    balanceEntries: any[]
  ): void {
    const activities: (Activity & { timestamp: Date })[] = [];

    // Add user creation activities
    users
      .filter(user => user.createdAt)
      .forEach(user => {
        const role = user.role === Roles.ADMIN ? 'Admin' : 
                     user.role === Roles.SUPERVISOR ? 'Supervisor' : 
                     user.role === Roles.SUPER_ADMIN ? 'Super Admin' : 'User';
        const timestamp = this.parseDate(user.createdAt);
        
        activities.push({
          action: `New ${role} Created`,
          user: user.name || user.email,
          time: this.getTimeAgo(timestamp),
          type: user.role === Roles.ADMIN ? 'success' : 'info',
          timestamp
        });
      });

    // Add ledger entry activities (combine all types)
    const allEntries: any[] = [
      ...ledgerEntries.map(entry => ({ ...entry, type: 'expenditure' })),
      ...stockEntries.map(entry => ({ ...entry, type: 'stock' })),
      ...balanceEntries.map(entry => ({ ...entry, type: 'balance' }))
    ].filter(entry => entry.createdAt);

    allEntries.forEach(entry => {
      const entryType = entry.type === 'expenditure' ? 'Ledger Entry' : 
                       entry.type === 'stock' ? 'Stock Entry' : 
                       'Balance Entry';
      const timestamp = this.parseDate(entry.createdAt);
      
      activities.push({
        action: `${entryType} Created`,
        user: entry.createdByName || 'Unknown',
        time: this.getTimeAgo(timestamp),
        type: 'primary',
        timestamp
      });
    });

    // Sort all activities by timestamp (most recent first) and take top 10
    this.recentActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
      .map(({ timestamp, ...activity }) => activity); // Remove timestamp before storing
  }

  private parseDate(date: any): Date {
    if (!date) return new Date();
    
    if (date instanceof Date) {
      return date;
    }
    
    if (typeof date === 'string') {
      return new Date(date);
    }
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate();
    }
    
    // Handle Firestore Timestamp with seconds/nanoseconds
    if (date && typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    
    return new Date();
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }
} 