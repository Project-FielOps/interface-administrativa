import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const passwordChangeGuard: CanActivateChildFn = (_childRoute, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.mustChangePassword() && !state.url.includes('/change-password')) {
    return router.createUrlTree(['/app/change-password']);
  }
  return true;
};
