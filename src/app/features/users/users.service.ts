import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { User, UserCreateRequest, UserUpdateRequest } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService extends CrudService<User, UserCreateRequest, UserUpdateRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/users`);
  }

  activate(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/activate`, {});
  }

  inactivate(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/inactivate`, {});
  }

  block(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/block`, {});
  }

  resetPassword(id: string): Observable<{ temporaryPassword?: string }> {
    return this.http.post<{ temporaryPassword?: string }>(`${this.baseUrl}/${id}/reset-password`, {});
  }
}
