import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import {
  ApproveRequest,
  Inspection,
  InspectionCreateRequest,
  InspectionReview,
  RejectRequest,
} from '../../core/models/inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionsService extends CrudService<Inspection, InspectionCreateRequest, Partial<InspectionCreateRequest>> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/inspections`);
  }

  cancel(inspectionId: string, reason: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/cancel`, { reason });
  }

  assign(inspectionId: string, technicianId: string, supervisorId: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/assign`, { technicianId, supervisorId });
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
