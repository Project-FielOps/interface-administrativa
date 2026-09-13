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
  TemplateStatus,
} from '../../core/models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplatesService extends CrudService<
  InspectionTemplate,
  TemplateRequest,
  TemplateRequest
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/inspection-templates`);
  }

  /** Returns the current editable draft (sections + items). There is no separate flat sections endpoint. */
  getDraft(templateId: string): Observable<InspectionTemplateVersion> {
    return this.http.get<InspectionTemplateVersion>(`${this.baseUrl}/${templateId}/draft`);
  }

  createSection(templateId: string, req: TemplateSectionRequest): Observable<TemplateSection> {
    return this.http.post<TemplateSection>(`${this.baseUrl}/${templateId}/sections`, req);
  }

  updateSection(
    templateId: string,
    sectionId: string,
    req: TemplateSectionRequest,
  ): Observable<TemplateSection> {
    return this.http.put<TemplateSection>(
      `${this.baseUrl}/${templateId}/sections/${sectionId}`,
      req,
    );
  }

  deleteSection(templateId: string, sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${templateId}/sections/${sectionId}`);
  }

  createItem(
    templateId: string,
    sectionId: string,
    req: TemplateItemRequest,
  ): Observable<TemplateItem> {
    return this.http.post<TemplateItem>(
      `${this.baseUrl}/${templateId}/sections/${sectionId}/items`,
      req,
    );
  }

  updateItem(
    templateId: string,
    sectionId: string,
    itemId: string,
    req: TemplateItemRequest,
  ): Observable<TemplateItem> {
    return this.http.put<TemplateItem>(
      `${this.baseUrl}/${templateId}/sections/${sectionId}/items/${itemId}`,
      req,
    );
  }

  deleteItem(templateId: string, sectionId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${templateId}/sections/${sectionId}/items/${itemId}`,
    );
  }

  publish(templateId: string): Observable<InspectionTemplateVersion> {
    return this.http.post<InspectionTemplateVersion>(`${this.baseUrl}/${templateId}/publish`, {});
  }

  getVersions(templateId: string): Observable<InspectionTemplateVersion[]> {
    return this.http.get<InspectionTemplateVersion[]>(`${this.baseUrl}/${templateId}/versions`);
  }

  /** versionNumber is the integer version number (1, 2, ...), not a version UUID. */
  getVersion(templateId: string, versionNumber: number): Observable<InspectionTemplateVersion> {
    return this.http.get<InspectionTemplateVersion>(
      `${this.baseUrl}/${templateId}/versions/${versionNumber}`,
    );
  }

  updateStatus(id: string, status: TemplateStatus): Observable<InspectionTemplate> {
    return this.http.patch<InspectionTemplate>(`${this.baseUrl}/${id}/status`, { status });
  }
}
