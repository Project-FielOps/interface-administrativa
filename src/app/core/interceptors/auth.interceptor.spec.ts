import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let tokens: TokenStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        TokenStorageService,
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorageService);
    tokens.setAccessToken('access-old');
    tokens.setRefreshToken('refresh-old');
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('refreshes once and retries the failed request once', async () => {
    const response = firstValueFrom(TestBed.inject(HttpClient).get('/protected'));
    const initial = http.expectOne('/protected');
    expect(initial.request.headers.get('Authorization')).toBe('Bearer access-old');
    initial.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    refresh.flush({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      mustChangePassword: false,
    });

    const retried = http.expectOne('/protected');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer access-new');
    retried.flush({ ok: true });
    await expect(response).resolves.toEqual({ ok: true });
  });

  it('does not refresh again when the retried request still returns 401', async () => {
    const response = firstValueFrom(TestBed.inject(HttpClient).get('/protected'));
    http.expectOne('/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      mustChangePassword: false,
    });
    http.expectOne('/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne(`${environment.apiUrl}/auth/logout`)
      .flush(null, { status: 204, statusText: 'No Content' });

    await expect(response).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(http.match(`${environment.apiUrl}/auth/refresh`)).toHaveLength(0);
  });
});
