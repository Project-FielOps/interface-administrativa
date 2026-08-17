import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/common.model';
import { AuditEvent } from '../../core/models/inspection.model';
import { toHttpParams } from '../../core/http/crud.service';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly baseUrl = `${environment.apiUrl}/audit-events`;

  constructor(private readonly http: HttpClient) {}

  list(query: Record<string, unknown> = {}): Observable<Page<AuditEvent>> {
    return this.http.get<Page<AuditEvent>>(this.baseUrl, { params: toHttpParams(query) });
  }
}
