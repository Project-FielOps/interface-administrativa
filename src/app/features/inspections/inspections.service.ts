import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import {
  Inspection,
  InspectionCreateRequest,
  InspectionItemSnapshot,
  InspectionReview,
  ReviewRequest,
} from '../../core/models/inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionsService extends CrudService<Inspection, InspectionCreateRequest, Partial<InspectionCreateRequest>> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/inspections`);
  }

  getItems(inspectionId: string): Observable<InspectionItemSnapshot[]> {
    return this.http.get<InspectionItemSnapshot[]>(`${this.baseUrl}/${inspectionId}/items`);
  }

  cancel(inspectionId: string, reason: string): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/${inspectionId}/cancel`, { reason });
  }

  getReviews(inspectionId: string): Observable<InspectionReview[]> {
    return this.http.get<InspectionReview[]>(`${this.baseUrl}/${inspectionId}/reviews`);
  }

  review(inspectionId: string, req: ReviewRequest): Observable<InspectionReview> {
    return this.http.post<InspectionReview>(`${this.baseUrl}/${inspectionId}/reviews`, req);
  }
}
