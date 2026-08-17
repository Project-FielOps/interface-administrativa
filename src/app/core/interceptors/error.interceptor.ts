import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/common.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 0) {
          snackBar.open('Não foi possível conectar à API. Verifique sua conexão ou tente novamente.', 'Fechar', {
            duration: 6000,
          });
        } else if (err.status === 401 && !req.url.includes('/auth/')) {
          snackBar.open('Sessão expirada. Faça login novamente.', 'Fechar', { duration: 5000 });
          router.navigate(['/login']);
        } else if (err.status === 403) {
          snackBar.open('Você não tem permissão para executar esta ação.', 'Fechar', { duration: 5000 });
        } else if (err.status >= 500) {
          const body = err.error as ApiError | undefined;
          snackBar.open(body?.message ?? 'Erro interno no servidor. Tente novamente mais tarde.', 'Fechar', {
            duration: 6000,
          });
        }
      }
      return throwError(() => err);
    }),
  );
};
