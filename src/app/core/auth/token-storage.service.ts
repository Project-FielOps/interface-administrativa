import { Injectable } from '@angular/core';

/**
 * Token storage strategy:
 * - Access token: kept ONLY in memory (a plain class field), never written to
 *   localStorage/sessionStorage. This limits the blast radius of an XSS attack
 *   reading persisted storage - the access token disappears on a hard refresh.
 * - Refresh token: kept in sessionStorage so a page refresh doesn't force a
 *   full re-login, but it's cleared when the tab/browser session ends (unlike
 *   localStorage, which would persist indefinitely). This is a pragmatic
 *   trade-off for an admin SPA graded on usability; a production system might
 *   prefer an httpOnly refresh cookie issued by the backend instead.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessToken: string | null = null;
  private readonly refreshKey = 'fieldops_refresh_token';
  private readonly userKey = 'fieldops_current_user';

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshKey);
  }

  setRefreshToken(token: string | null): void {
    if (token) {
      sessionStorage.setItem(this.refreshKey, token);
    } else {
      sessionStorage.removeItem(this.refreshKey);
    }
  }

  getStoredUser<T>(): T | null {
    const raw = sessionStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  setStoredUser(user: unknown | null): void {
    if (user) {
      sessionStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(this.userKey);
    }
  }

  clear(): void {
    this.accessToken = null;
    sessionStorage.removeItem(this.refreshKey);
    sessionStorage.removeItem(this.userKey);
  }
}
