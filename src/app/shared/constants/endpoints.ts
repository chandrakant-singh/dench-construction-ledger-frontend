export enum EndPoints {
  BASE_URL = 'http://localhost:3000',
  AUTH_LOGIN = 'auth/login',
  AUTH_REGISTER = 'auth/signup',

  // Super Admin
  SUPER_ADMIN_DASHBOARD = 'super-admin/dashboard',
  SUPER_ADMIN_MANAGE_ADMINS = 'super-admin/manage-admins',
  SUPER_ADMIN_SETTINGS = 'super-admin/settings',
  SUPER_ADMIN_REPORTS = 'super-admin/reports',
  SUPER_ADMIN_CREATE_ADMIN = 'super-admin/create-admin',
  SUPER_ADMIN_CREATE_SUPERVISOR = 'super-admin/create-supervisor',
  SUPER_ADMIN_LIST_ADMIN = 'super-admin/list-admin',
  SUPER_ADMIN_LIST_SUPERVISOR = 'super-admin/list-supervisor',

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
  SUPERVISOR_ADD_ENTRY = 'supervisor/add-entry',
  SUPERVISOR_LIST_STOCK_LEDGER = 'supervisor/list-stock-ledger',
  SUPERVISOR_LIST_BALANCE_LEDGER = 'supervisor/list-balance-ledger'
}
