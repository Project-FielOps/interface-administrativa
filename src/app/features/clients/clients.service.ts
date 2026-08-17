import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { Client, ClientRequest } from '../../core/models/client.model';
import { EntityStatus } from '../../core/models/common.model';

@Injectable({ providedIn: 'root' })
export class ClientsService extends CrudService<Client, ClientRequest, ClientRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/clients`);
  }

  updateStatus(id: string, status: EntityStatus): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/${id}/status`, { status });
  }
}
