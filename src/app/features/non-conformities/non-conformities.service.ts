import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/common.model';
import { NonConformity } from '../../core/models/inspection.model';
import { toHttpParams } from '../../core/http/crud.service';

@Injectable({ providedIn: 'root' })
export class NonConformitiesService {
  private readonly baseUrl = `${environment.apiUrl}/non-conformities`;

  constructor(private readonly http: HttpClient) {}

  list(query: Record<string, unknown> = {}): Observable<Page<NonConformity>> {
    return this.http.get<Page<NonConformity>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: string): Observable<NonConformity> {
    return this.http.get<NonConformity>(`${this.baseUrl}/${id}`);
  }
}
