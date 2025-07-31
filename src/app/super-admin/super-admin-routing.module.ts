import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from '../shared/layout/main-layout/main-layout.component';
import { SuperAdminDashboardComponent } from './super-admin-dashboard/super-admin-dashboard.component';
import { ManageAdminsComponent } from './manage-admins/manage-admins.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';
import { ReportsAnalyticsComponent } from './reports-analytics/reports-analytics.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SuperAdminDashboardComponent
      },
      {
        path: 'manage-admins',
        component: ManageAdminsComponent
      },
      {
        path: 'settings',
        component: SystemSettingsComponent
      },
      {
        path: 'reports',
        component: ReportsAnalyticsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperAdminRoutingModule { } 