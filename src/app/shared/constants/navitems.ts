export const NAV_ITEMS = [
  // Super Admin specific items
  {
    label: 'Super Admin Dashboard',
    path: '/super-admin/dashboard',
    roles: ['super_admin']
  },
  {
    label: 'Manage Admins',
    path: '/super-admin/manage-admins',
    roles: ['super_admin']
  },
  {
    label: 'System Settings',
    path: '/super-admin/settings',
    roles: ['super_admin']
  },
  {
    label: 'Reports & Analytics',
    path: '/super-admin/reports',
    roles: ['super_admin']
  },

  // Admin (accessible by both admin and super admin)
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    roles: ['admin', 'super_admin']
  },
  // {
  //   label: 'Add Ledger Entry',
  //   path: '/admin/create-ledger-entry',
  //   roles: ['admin', 'super_admin']
  // },
  {
    label: 'List Stock Ledger',
    path: '/admin/list-stock-ledger',
    roles: ['admin', 'super_admin']
  },
  {
    label: 'List Balance Ledger',
    path: '/admin/list-balance-ledger',
    roles: ['admin', 'super_admin']
  },
  {
    label: 'Create Supervisor',
    path: '/admin/create-supervisor',
    roles: ['admin', 'super_admin']
  },
  {
    label: 'List Supervisor',
    path: '/admin/list-supervisor',
    roles: ['admin', 'super_admin']
  },

  // Supervisor
  {
    label: 'Dashboard',
    path: '/supervisor/dashboard',
    roles: ['supervisor']
  },
  // {
  //   label: 'Add Ledger Entry',
  //   path: '/supervisor/add-entry',
  //   roles: ['supervisor']
  // },
];
