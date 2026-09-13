import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/equipment-list.component').then((m) => m.EquipmentListComponent),
  },
];
