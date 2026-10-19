import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, defer, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenResponse, UserResponse } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = TokenResponse;
export type RefreshResponse = TokenResponse;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(this.tokens.getStoredUser<User>());
  private refreshInFlight$: Observable<TokenResponse> | null = null;

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  readonly mustChangePassword = signal(!!this.tokens.getStoredUser<User>()?.mustChangePassword);

  constructor(
    private readonly http: HttpClient,
    private readonly tokens: TokenStorageService,
    private readonly router: Router,
  ) {}

  login(request: LoginRequest): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => {
        this.applyTokens(res);
        this.mustChangePassword.set(res.mustChangePassword);
      }),
      // The backend's login response carries no user payload; fetch it separately via /auth/me.
      switchMap(() => this.http.get<UserResponse>(`${environment.apiUrl}/auth/me`)),
      tap((user) => this.applyUser(user)),
    );
  }

  refresh(): Observable<RefreshResponse> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token available'));

    this.refreshInFlight$ = defer(() =>
      this.http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }),
    ).pipe(
      tap((res) => {
        this.tokens.setAccessToken(res.accessToken);
        this.tokens.setRefreshToken(res.refreshToken);
        this.mustChangePassword.set(res.mustChangePassword);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight$;
  }

  logout(navigate = true): void {
    const refreshToken = this.tokens.getRefreshToken();
    // Clear local state before the network call so logout remains effective if the API is down.
    const finish = () => {
      this.tokens.clear();
      this.currentUserSignal.set(null);
      this.mustChangePassword.set(false);
      if (navigate) this.router.navigate(['/login']);
    };
    if (!refreshToken) return finish();

    finish();
    this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
      error: () => undefined,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword })
      .pipe(tap(() => this.mustChangePassword.set(false)));
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUserSignal();
    return !!user && roles.includes(user.role);
  }

  getAccessToken(): string | null {
    return this.tokens.getAccessToken();
  }

  private applyTokens(res: TokenResponse): void {
    this.tokens.setAccessToken(res.accessToken);
    this.tokens.setRefreshToken(res.refreshToken);
  }

  private applyUser(user: UserResponse): void {
    this.tokens.setStoredUser(user);
    this.currentUserSignal.set(user);
    this.mustChangePassword.set(!!user.mustChangePassword);
  }
}
