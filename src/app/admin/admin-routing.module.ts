import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from '../shared/layout/main-layout/main-layout.component';

const routes: Routes = [
  {
    path:'',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent)
      },
      {
        path: 'create-supervisor',
        loadComponent:  () => import('./create-supervisor/create-supervisor.component').then((m) => m.CreateSupervisorComponent)
      },
      {
        path: 'create-ledger-entry',
        loadComponent: () => import('../shared/components/create-ledger-entry/create-ledger-entry.component').then((m) => m.CreateLedgerEntryComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
