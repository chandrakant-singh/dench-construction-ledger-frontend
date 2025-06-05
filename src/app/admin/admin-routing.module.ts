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
        path: 'create-ledger-entry',
        loadComponent: () => import('../shared/components/create-ledger-entry/create-ledger-entry.component').then((m) => m.CreateLedgerEntryComponent)
      },
      {
        path: 'create-supervisor',
        loadComponent:  () => import('./create-supervisor/create-supervisor.component').then((m) => m.CreateSupervisorComponent)
      },
      {
        path: 'create-stock-ledger',
        loadComponent: () => import('../shared/components/create-stock-ledger/create-stock-ledger.component').then((m) => m.CreateStockLedgerComponent)
      },
      {
        path: 'create-balance-ledger',
        loadComponent: () => import('../shared/components/create-balance-ledger/create-balance-ledger.component').then((m) => m.CreateBalanceLedgerComponent)
      },
      {
        path: 'list-supervisor',
        loadComponent: () => import('./list-supervisor/list-supervisor.component').then((m) => m.ListSupervisorComponent)
      },
      {
        path: 'list-stock-ledger',
        loadComponent: () => import('./list-stock-ledger/list-stock-ledger.component').then((m) => m.ListStockLedgerComponent)
      },
      {
        path: 'list-balance-ledger',
        loadComponent: () => import('./list-balance-ledger/list-balance-ledger.component').then((m) => m.ListBalanceLedgerComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
