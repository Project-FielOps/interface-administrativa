import { Routes } from '@angular/router';

export const NON_CONFORMITIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/non-conformities-list.component').then((m) => m.NonConformitiesListComponent),
  },
];
