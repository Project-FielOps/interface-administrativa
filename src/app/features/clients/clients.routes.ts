import { Routes } from '@angular/router';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/clients-list.component').then((m) => m.ClientsListComponent),
  },
  {
    path: ':clientId/sites',
    loadComponent: () => import('../sites/list/sites-list.component').then((m) => m.SitesListComponent),
  },
];
