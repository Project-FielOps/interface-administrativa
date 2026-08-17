import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { InspectionSite, SiteRequest } from '../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class SitesService extends CrudService<InspectionSite, SiteRequest, SiteRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/sites`);
  }

  listByClient(clientId: string): Observable<InspectionSite[]> {
    return this.http.get<InspectionSite[]>(`${environment.apiUrl}/clients/${clientId}/sites`);
  }

  inactivate(id: string): Observable<InspectionSite> {
    return this.http.post<InspectionSite>(`${this.baseUrl}/${id}/inactivate`, {});
  }

  activate(id: string): Observable<InspectionSite> {
    return this.http.post<InspectionSite>(`${this.baseUrl}/${id}/activate`, {});
  }
}
