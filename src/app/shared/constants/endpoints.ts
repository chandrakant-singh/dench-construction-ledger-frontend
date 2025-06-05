export enum EndPoints {
  BASE_URL = 'http://localhost:3000',
  AUTH_LOGIN = 'auth/login',
  AUTH_REGISTER = 'auth/signup',

  // Admin
  ADMIN_DASHBOARD = 'admin/dashboard',
  CREATE_SUPERVISOR = 'admin/create-supervisor',
  CREATE_LEDGER_ENTRY = 'admin/create-ledger-entry',
  CREATE_STOCK_LEDGER = 'admin/create-stock-ledger',
  CREATE_BALANCE_LEDGER = 'admin/create-balance-ledger',

  LIST_SUPERVISOR = 'admin/list-supervisor',
  LIST_STOCK_LEDGER = 'admin/list-stock-ledger',
  LIST_BALANCE_LEDGER = 'admin/list-balance-ledger',

  // Supervisor
  SUPERVISOR_DASHBOARD = 'supervisor/dashboard',
  SUPERVISOR_ADD_ENTRY = 'supervisor/add-entry'
}
