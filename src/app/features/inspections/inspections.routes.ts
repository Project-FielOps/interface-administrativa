import { Routes } from '@angular/router';

export const INSPECTIONS_ROUTES: Routes = [
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
];
