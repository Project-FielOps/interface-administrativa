import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { Equipment, EquipmentRequest, EquipmentStatus } from '../../core/models/client.model';
import { Page } from '../../core/models/common.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService extends CrudService<Equipment, EquipmentRequest, EquipmentRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/equipment`);
  }

  /** POST /sites/{siteId}/equipment — equipment is always created nested under a site. */
  createForSite(siteId: string, payload: EquipmentRequest): Observable<Equipment> {
    return this.http.post<Equipment>(`${environment.apiUrl}/sites/${siteId}/equipment`, payload);
  }

  listBySite(siteId: string): Observable<Equipment[]> {
    return this.http
      .get<Page<Equipment>>(`${environment.apiUrl}/sites/${siteId}/equipment`, { params: { size: 200 } })
      .pipe(map((page) => page.content));
  }

  findByQrCode(qrCode: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.baseUrl}/by-qr/${encodeURIComponent(qrCode)}`);
  }

  updateStatus(id: string, status: EquipmentStatus): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.baseUrl}/${id}/status`, { status });
  }
}
