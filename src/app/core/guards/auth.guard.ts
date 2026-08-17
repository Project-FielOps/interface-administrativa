import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const tokens = inject(TokenStorageService);
  const router = inject(Router);

  if (auth.isAuthenticated() && (tokens.getAccessToken() || tokens.getRefreshToken())) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};
