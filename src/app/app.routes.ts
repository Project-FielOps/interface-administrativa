import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { passwordChangeGuard } from './core/guards/password-change.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [passwordChangeGuard],
    loadComponent: () => import('./core/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./features/auth/change-password.component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'users',
        canActivate: [roleGuard('ADMIN')],
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./features/clients/clients.routes').then((m) => m.CLIENTS_ROUTES),
      },
      {
        path: 'sites',
        loadChildren: () => import('./features/sites/sites.routes').then((m) => m.SITES_ROUTES),
      },
      {
        path: 'equipment',
        loadChildren: () =>
          import('./features/equipment/equipment.routes').then((m) => m.EQUIPMENT_ROUTES),
      },
      {
        path: 'inspection-templates',
        loadChildren: () =>
          import('./features/templates/templates.routes').then((m) => m.TEMPLATES_ROUTES),
      },
      {
        path: 'inspections',
        loadChildren: () =>
          import('./features/inspections/inspections.routes').then((m) => m.INSPECTIONS_ROUTES),
      },
      {
        path: 'non-conformities',
        loadChildren: () =>
          import('./features/non-conformities/non-conformities.routes').then(
            (m) => m.NON_CONFORMITIES_ROUTES,
          ),
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.routes').then((m) => m.AUDIT_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
