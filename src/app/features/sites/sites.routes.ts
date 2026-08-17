import { Routes } from '@angular/router';

export const SITES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/sites-list.component').then((m) => m.SitesListComponent),
  },
  {
    path: ':siteId/equipment',
    loadComponent: () => import('../equipment/list/equipment-list.component').then((m) => m.EquipmentListComponent),
  },
];
