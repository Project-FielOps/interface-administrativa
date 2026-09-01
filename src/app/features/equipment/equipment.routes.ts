import { Routes } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    // O diálogo de equipamento tem campo de data (matDatepicker).
    providers: [provideNativeDateAdapter()],
    loadComponent: () => import('./list/equipment-list.component').then((m) => m.EquipmentListComponent),
  },
];
