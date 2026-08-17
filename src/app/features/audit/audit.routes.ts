import { Routes } from '@angular/router';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/audit-list.component').then((m) => m.AuditListComponent),
  },
];
