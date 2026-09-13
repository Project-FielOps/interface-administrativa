import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

/** Matches the backend's TokenResponse exactly — it does NOT include the user. */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(this.tokens.getStoredUser<User>());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor(
    private readonly http: HttpClient,
    private readonly tokens: TokenStorageService,
    private readonly router: Router,
  ) {}

  login(request: LoginRequest): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => this.applyTokens(res)),
      // The backend's login response carries no user payload; fetch it separately via /auth/me.
      switchMap(() => this.http.get<User>(`${environment.apiUrl}/auth/me`)),
      tap((user) => this.applyUser(user)),
    );
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = this.tokens.getRefreshToken();
    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          this.tokens.setAccessToken(res.accessToken);
          this.tokens.setRefreshToken(res.refreshToken);
        }),
      );
  }

  logout(navigate = true): void {
    this.tokens.clear();
    this.currentUserSignal.set(null);
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUserSignal();
    return !!user && roles.includes(user.role);
  }

  getAccessToken(): string | null {
    return this.tokens.getAccessToken();
  }

  private applyTokens(res: LoginResponse | RefreshResponse): void {
    this.tokens.setAccessToken(res.accessToken);
    this.tokens.setRefreshToken(res.refreshToken);
  }

  private applyUser(user: User): void {
    this.tokens.setStoredUser(user);
    this.currentUserSignal.set(user);
  }
}
