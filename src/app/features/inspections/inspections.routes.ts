import { Routes } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

export const INSPECTIONS_ROUTES: Routes = [
  {
    path: '',
    // Filtros de data (lista) e agendamento (nova inspeção) usam matDatepicker,
    // que exige um DateAdapter. Escopado à rota para ficar fora do bundle inicial.
    providers: [provideNativeDateAdapter()],
    children: [
      {
        path: '',
        loadComponent: () => import('./list/inspections-list.component').then((m) => m.InspectionsListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./new/inspection-new.component').then((m) => m.InspectionNewComponent),
      },
      {
        path: ':inspectionId/review',
        loadComponent: () => import('./review/inspection-review.component').then((m) => m.InspectionReviewComponent),
      },
      {
        path: ':inspectionId',
        loadComponent: () => import('./detail/inspection-detail.component').then((m) => m.InspectionDetailComponent),
      },
    ],
  },
];
