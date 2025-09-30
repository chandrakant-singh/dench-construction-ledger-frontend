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
        loadComponent: () => import('./supervisor-dashboard/supervisor-dashboard.component').then((m) => m.SupervisorDashboardComponent)
      },
      {
        path: 'add-entry',
        loadComponent: () => import('./add-entry/add-entry.component').then((m) => m.AddEntryComponent)
      },
      {
        path: 'list-stock-ledger',
        loadComponent: () => import('./list-stock-ledger/list-stock-ledger.component').then((m) => m.SupervisorListStockLedgerComponent)
      },
      {
        path: 'list-balance-ledger',
        loadComponent: () => import('./list-balance-ledger/list-balance-ledger.component').then((m) => m.SupervisorListBalanceLedgerComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SupervisorRoutingModule { }
