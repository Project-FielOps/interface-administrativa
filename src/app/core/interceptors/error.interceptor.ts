import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/common.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 0) {
          snackBar.open(
            'Não foi possível conectar à API. Verifique sua conexão ou tente novamente.',
            'Fechar',
            {
              duration: 6000,
            },
          );
        } else if (err.status === 401 && req.url.endsWith('/auth/login')) {
          snackBar.open('E-mail ou senha inválidos.', 'Fechar', { duration: 5000 });
        } else if (err.status === 403) {
          const body = err.error as ApiError | undefined;
          const message =
            body?.code === 'PASSWORD_CHANGE_REQUIRED'
              ? 'Altere sua senha para continuar.'
              : 'Você não tem permissão para executar esta ação.';
          snackBar.open(message, 'Fechar', {
            duration: 5000,
          });
        } else if (err.status === 409) {
          const body = err.error as ApiError | undefined;
          snackBar.open(
            body?.message ?? 'Conflito: os dados já foram alterados ou já existem.',
            'Fechar',
            {
              duration: 5000,
            },
          );
        } else if (err.status === 422) {
          const body = err.error as ApiError | undefined;
          snackBar.open(
            body?.message ?? 'Não foi possível processar os dados informados.',
            'Fechar',
            {
              duration: 5000,
            },
          );
        } else if (err.status >= 500) {
          const body = err.error as ApiError | undefined;
          snackBar.open(
            body?.message ?? 'Erro interno no servidor. Tente novamente mais tarde.',
            'Fechar',
            {
              duration: 6000,
            },
          );
        }
      }
      return throwError(() => err);
    }),
  );
};
