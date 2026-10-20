import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService, toHttpParams } from '../../core/http/crud.service';
import { Page } from '../../core/models/common.model';
import {
  ApproveRequest,
  Inspection,
  InspectionCreateRequest,
  InspectionReview,
  AuditEvent,
  RejectRequest,
  InspectionAnswer,
} from '../../core/models/inspection.model';

export interface InspectionListQuery {
  technicianId?: string;
  supervisorId?: string;
  clientId?: string;
  siteId?: string;
  status?: string;
  priority?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  overdue?: boolean;
  awaitingReview?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class InspectionsService extends CrudService<
  Inspection,
  InspectionCreateRequest,
  Partial<InspectionCreateRequest>
> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/inspections`);
  }

  listPage(query: InspectionListQuery = {}): Observable<Page<Inspection>> {
    return this.http.get<Page<Inspection>>(this.baseUrl, { params: toHttpParams(query) });
  }

  cancel(inspectionId: string, reason: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/cancel`, { reason });
  }

  assign(inspectionId: string, technicianId: string, supervisorId: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/assign`, {
      technicianId,
      supervisorId,
    });
  }

  start(inspectionId: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/start`, {});
  }

  submit(inspectionId: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/submit`, {});
  }

  getReviews(inspectionId: string): Observable<InspectionReview[]> {
    return this.http.get<InspectionReview[]>(`${this.baseUrl}/${inspectionId}/reviews`);
  }

  getResponses(inspectionId: string): Observable<InspectionAnswer[]> {
    return this.http.get<InspectionAnswer[]>(`${this.baseUrl}/${inspectionId}/responses`);
  }

  getHistory(inspectionId: string): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/${inspectionId}/history`);
  }

  /** Moves a SUBMITTED inspection into UNDER_REVIEW. No request body. */
  beginReview(inspectionId: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/begin-review`, {});
  }

  approve(inspectionId: string, comments?: string): Observable<Inspection> {
    const body: ApproveRequest = { comments };
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/approve`, body);
  }

  reject(inspectionId: string, reason: string, comments?: string): Observable<Inspection> {
    const body: RejectRequest = { reason, comments };
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/reject`, body);
  }
}
