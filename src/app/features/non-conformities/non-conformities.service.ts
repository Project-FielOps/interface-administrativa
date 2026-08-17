import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NonConformity } from '../../core/models/inspection.model';

export type NonConformityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Non-conformities are always nested under an inspection on the real backend
 * (/api/v1/inspections/{inspectionId}/non-conformities) — there is no flat, top-level list endpoint.
 */
@Injectable({ providedIn: 'root' })
export class NonConformitiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listByInspection(inspectionId: string): Observable<NonConformity[]> {
    return this.http.get<NonConformity[]>(`${this.baseUrl}/inspections/${inspectionId}/non-conformities`);
  }

  get(inspectionId: string, id: string): Observable<NonConformity> {
    return this.http.get<NonConformity>(`${this.baseUrl}/inspections/${inspectionId}/non-conformities/${id}`);
  }

  updateStatus(inspectionId: string, id: string, status: NonConformityStatus): Observable<NonConformity> {
    return this.http.patch<NonConformity>(`${this.baseUrl}/inspections/${inspectionId}/non-conformities/${id}/status`, { status });
  }
}
