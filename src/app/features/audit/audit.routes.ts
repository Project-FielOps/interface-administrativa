import { Routes } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    // Os filtros de período usam matDatepicker, que exige um DateAdapter.
    // Fornecido aqui (e não em app.config) para não entrar no bundle inicial.
    providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
    loadComponent: () => import('./list/audit-list.component').then((m) => m.AuditListComponent),
  },
];
