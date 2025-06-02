export const NAV_ITEMS = [
  // Admin
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    roles: ['admin']
  },
  {
    label: 'Add Ledger Entry',
    path: '/admin/create-ledger-entry',
    roles: ['admin']
  },
  {
    label: 'Create Supervisor',
    path: '/admin/create-supervisor',
    roles: ['admin']
  },
  {
    label: 'List Supervisor',
    path: '/admin/list-supervisor',
    roles: ['admin']
  },
  {
    label: 'List Stock Ledger',
    path: '/admin/list-stock-ledger',
    roles: ['admin']
  },
  {
    label: 'List Balance Ledger',
    path: '/admin/list-balance-ledger',
    roles: ['admin']
  },

  // Supervisor
  {
    label: 'Dashboard',
    path: '/supervisor/dashboard',
    roles: ['supervisor']
  },
  {
    label: 'Add Ledger Entry',
    path: '/supervisor/add-entry',
    roles: ['supervisor']
  },
];
