import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let tokens: TokenStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        TokenStorageService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('shares one rotating refresh request between concurrent callers', async () => {
    tokens.setRefreshToken('refresh-old');

    const first = firstValueFrom(auth.refresh());
    const second = firstValueFrom(auth.refresh());
    const requests = http.match(`${environment.apiUrl}/auth/refresh`);

    expect(requests).toHaveLength(1);
    expect(requests[0].request.body).toEqual({ refreshToken: 'refresh-old' });
    requests[0].flush({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      mustChangePassword: false,
    });

    await expect(first).resolves.toMatchObject({ accessToken: 'access-new' });
    await expect(second).resolves.toMatchObject({ refreshToken: 'refresh-new' });
    expect(tokens.getAccessToken()).toBe('access-new');
    expect(tokens.getRefreshToken()).toBe('refresh-new');
  });

  it('clears local state even when remote logout fails', () => {
    tokens.setAccessToken('access');
    tokens.setRefreshToken('refresh');

    auth.logout(false);

    expect(tokens.getAccessToken()).toBeNull();
    expect(tokens.getRefreshToken()).toBeNull();
    const request = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(request.request.body).toEqual({ refreshToken: 'refresh' });
    request.flush({ message: 'unavailable' }, { status: 503, statusText: 'Unavailable' });
  });

  it('requests recovery with the email and exposes the generic API response', async () => {
    const result = firstValueFrom(auth.requestPasswordReset('person@example.com'));
    const request = http.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'person@example.com' });
    request.flush(
      { message: 'If the account exists, instructions were sent.' },
      { status: 202, statusText: 'Accepted' },
    );
    await expect(result).resolves.toEqual({
      message: 'If the account exists, instructions were sent.',
    });
  });

  it('resets the password with the token without storing it', async () => {
    const result = firstValueFrom(auth.resetPassword('opaque-token', 'Strong@123'));
    const request = http.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'opaque-token', newPassword: 'Strong@123' });
    request.flush(null);
    await expect(result).resolves.toBeNull();
    expect(sessionStorage.getItem('opaque-token')).toBeNull();
  });
});
