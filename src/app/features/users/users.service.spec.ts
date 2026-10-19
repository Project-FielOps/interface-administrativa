import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests assignable users with role and pagination instead of the admin list', async () => {
    const response = firstValueFrom(
      service.listAssignable('SUPERVISOR', { page: 2, size: 100, sort: 'name,asc' }),
    );
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/users/assignable`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('role')).toBe('SUPERVISOR');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('100');
    request.flush({ content: [], page: 2, size: 100, totalElements: 0, totalPages: 0 });

    await expect(response).resolves.toMatchObject({ content: [] });
  });

  it('does not add an unsupported textual search parameter to the user list', () => {
    service.list({ role: 'TECHNICIAN', status: 'ACTIVE', page: 0, size: 10 }).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/users`);

    expect(request.request.params.get('role')).toBe('TECHNICIAN');
    expect(request.request.params.get('status')).toBe('ACTIVE');
    expect(request.request.params.get('search')).toBeNull();
    request.flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });
});
