import { Routes } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    // O diálogo de equipamento tem campo de data (matDatepicker).
    providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
    loadComponent: () => import('./list/equipment-list.component').then((m) => m.EquipmentListComponent),
  },
];
