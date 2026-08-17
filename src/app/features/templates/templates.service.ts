import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import {
  InspectionTemplate,
  InspectionTemplateVersion,
  TemplateItem,
  TemplateItemRequest,
  TemplateRequest,
  TemplateSection,
  TemplateSectionRequest,
} from '../../core/models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplatesService extends CrudService<InspectionTemplate, TemplateRequest, TemplateRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/inspection-templates`);
  }

  getSections(templateId: string): Observable<TemplateSection[]> {
    return this.http.get<TemplateSection[]>(`${this.baseUrl}/${templateId}/sections`);
  }

  createSection(templateId: string, req: TemplateSectionRequest): Observable<TemplateSection> {
    return this.http.post<TemplateSection>(`${this.baseUrl}/${templateId}/sections`, req);
  }

  updateSection(templateId: string, sectionId: string, req: TemplateSectionRequest): Observable<TemplateSection> {
    return this.http.put<TemplateSection>(`${this.baseUrl}/${templateId}/sections/${sectionId}`, req);
  }

  deleteSection(templateId: string, sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${templateId}/sections/${sectionId}`);
  }

  reorderSections(templateId: string, orderedSectionIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${templateId}/sections/reorder`, { orderedSectionIds });
  }

  createItem(templateId: string, sectionId: string, req: TemplateItemRequest): Observable<TemplateItem> {
    return this.http.post<TemplateItem>(`${this.baseUrl}/${templateId}/sections/${sectionId}/items`, req);
  }

  updateItem(templateId: string, sectionId: string, itemId: string, req: TemplateItemRequest): Observable<TemplateItem> {
    return this.http.put<TemplateItem>(`${this.baseUrl}/${templateId}/sections/${sectionId}/items/${itemId}`, req);
  }

  deleteItem(templateId: string, sectionId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${templateId}/sections/${sectionId}/items/${itemId}`);
  }

  reorderItems(templateId: string, sectionId: string, orderedItemIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${templateId}/sections/${sectionId}/items/reorder`, { orderedItemIds });
  }

  publish(templateId: string): Observable<InspectionTemplateVersion> {
    return this.http.post<InspectionTemplateVersion>(`${this.baseUrl}/${templateId}/publish`, {});
  }

  getVersions(templateId: string): Observable<InspectionTemplateVersion[]> {
    return this.http.get<InspectionTemplateVersion[]>(`${this.baseUrl}/${templateId}/versions`);
  }

  getVersion(templateId: string, versionId: string): Observable<InspectionTemplateVersion & { sections: TemplateSection[] }> {
    return this.http.get<InspectionTemplateVersion & { sections: TemplateSection[] }>(
      `${this.baseUrl}/${templateId}/versions/${versionId}`,
    );
  }

  inactivate(id: string): Observable<InspectionTemplate> {
    return this.http.post<InspectionTemplate>(`${this.baseUrl}/${id}/inactivate`, {});
  }
}
