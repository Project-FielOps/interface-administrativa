import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { Client, ClientRequest } from '../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientsService extends CrudService<Client, ClientRequest, ClientRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/clients`);
  }

  inactivate(id: string): Observable<Client> {
    return this.http.post<Client>(`${this.baseUrl}/${id}/inactivate`, {});
  }

  activate(id: string): Observable<Client> {
    return this.http.post<Client>(`${this.baseUrl}/${id}/activate`, {});
  }
}
