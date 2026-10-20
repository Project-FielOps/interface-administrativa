import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService, toHttpParams } from '../../core/http/crud.service';
import { InspectionSite, SiteRequest } from '../../core/models/client.model';
import { EntityStatus, Page, PageQuery } from '../../core/models/common.model';

@Injectable({ providedIn: 'root' })
export class SitesService extends CrudService<InspectionSite, SiteRequest, SiteRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/sites`);
  }

  /** POST /clients/{clientId}/sites — sites are always created nested under a client. */
  createForClient(clientId: string, payload: SiteRequest): Observable<InspectionSite> {
    return this.http.post<InspectionSite>(
      `${environment.apiUrl}/clients/${clientId}/sites`,
      payload,
    );
  }

  listByClient(clientId: string, status?: EntityStatus): Observable<InspectionSite[]> {
    return this.http
      .get<Page<InspectionSite>>(`${environment.apiUrl}/clients/${clientId}/sites`, {
        params: status ? { size: 200, status } : { size: 200 },
      })
      .pipe(map((page) => page.content));
  }

  listPageByClient(
    clientId: string,
    query: PageQuery & { status?: EntityStatus } = {},
  ): Observable<Page<InspectionSite>> {
    return this.http.get<Page<InspectionSite>>(`${environment.apiUrl}/clients/${clientId}/sites`, {
      params: toHttpParams({ page: 0, size: 10, sort: 'name,asc', ...query }),
    });
  }

  updateStatus(id: string, status: EntityStatus): Observable<InspectionSite> {
    return this.http.patch<InspectionSite>(`${this.baseUrl}/${id}/status`, { status });
  }
}
