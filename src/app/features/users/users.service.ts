import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../core/http/crud.service';
import { User, UserCreateRequest, UserStatus, UserUpdateRequest } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService extends CrudService<User, UserCreateRequest, UserUpdateRequest> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/users`);
  }

  updateStatus(id: string, status: UserStatus): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/status`, { status });
  }
}
