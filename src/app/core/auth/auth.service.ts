import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
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

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => this.applySession(res)),
    );
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = this.tokens.getRefreshToken();
    return this.http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
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

  private applySession(res: LoginResponse): void {
    this.tokens.setAccessToken(res.accessToken);
    this.tokens.setRefreshToken(res.refreshToken);
    this.tokens.setStoredUser(res.user);
    this.currentUserSignal.set(res.user);
  }
}
