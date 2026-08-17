import { Routes } from '@angular/router';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/templates-list.component').then((m) => m.TemplatesListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./list/template-new.component').then((m) => m.TemplateNewComponent),
  },
  {
    path: ':templateId/edit',
    loadComponent: () => import('./builder/template-builder.component').then((m) => m.TemplateBuilderComponent),
  },
  {
    path: ':templateId/preview',
    loadComponent: () => import('./preview/template-preview.component').then((m) => m.TemplatePreviewComponent),
  },
  {
    path: ':templateId/versions',
    loadComponent: () => import('./versions/template-versions.component').then((m) => m.TemplateVersionsComponent),
  },
];
