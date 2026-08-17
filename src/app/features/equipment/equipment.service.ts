import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { Equipment, EquipmentRequest } from '../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService extends CrudService<Equipment, EquipmentRequest, EquipmentRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/equipment`);
  }

  listBySite(siteId: string): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${environment.apiUrl}/sites/${siteId}/equipment`);
  }

  findByQrCode(qrCode: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.baseUrl}/by-qr/${encodeURIComponent(qrCode)}`);
  }

  inactivate(id: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/inactivate`, {});
  }

  decommission(id: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/decommission`, {});
  }

  activate(id: string): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/${id}/activate`, {});
  }
}
