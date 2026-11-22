import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NonConformity } from '../../core/models/inspection.model';
import { Page } from '../../core/models/common.model';
import { toHttpParams } from '../../core/http/crud.service';

export type NonConformityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

@Injectable({ providedIn: 'root' })
export class NonConformitiesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listPage(
    query: {
      inspectionId?: string;
      severity?: string;
      status?: string;
      page?: number;
      size?: number;
      sort?: string;
    } = {},
  ): Observable<Page<NonConformity>> {
    return this.http.get<Page<NonConformity>>(`${this.baseUrl}/non-conformities`, {
      params: toHttpParams(query),
    });
  }

  listByInspection(inspectionId: string): Observable<NonConformity[]> {
    return this.http.get<NonConformity[]>(
      `${this.baseUrl}/inspections/${inspectionId}/non-conformities`,
    );
  }

  get(inspectionId: string, id: string): Observable<NonConformity> {
    return this.http.get<NonConformity>(
      `${this.baseUrl}/inspections/${inspectionId}/non-conformities/${id}`,
    );
  }

  updateStatus(
    inspectionId: string,
    id: string,
    status: NonConformityStatus,
  ): Observable<NonConformity> {
    return this.http.patch<NonConformity>(
      `${this.baseUrl}/inspections/${inspectionId}/non-conformities/${id}/status`,
      { status },
    );
  }
}
