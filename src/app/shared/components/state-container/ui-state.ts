/**
 * Shared UI-state model used across every data screen so loading / empty /
 * error states are handled consistently (spec 14.15: loading, success with
 * data, success empty, validation error, auth error, network error,
 * processing, success confirmation).
 */
export type UiPhase =
  'idle' | 'loading' | 'success' | 'empty' | 'no-results' | 'forbidden' | 'error' | 'processing';

export interface UiState<T> {
  phase: UiPhase;
  data?: T;
  errorMessage?: string;
}

export function loadingState<T>(): UiState<T> {
  return { phase: 'loading' };
}

export function successState<T>(data: T, isEmpty: boolean, filtered = false): UiState<T> {
  return { phase: isEmpty ? (filtered ? 'no-results' : 'empty') : 'success', data };
}

export function errorState<T>(message: string): UiState<T> {
  return { phase: 'error', errorMessage: message };
}

export function forbiddenState<T>(): UiState<T> {
  return { phase: 'forbidden' };
}

export function requestErrorState<T>(err: unknown): UiState<T> {
  if (
    err &&
    typeof err === 'object' &&
    'status' in err &&
    (err as { status?: number }).status === 403
  ) {
    return forbiddenState();
  }
  return errorState(extractErrorMessage(err));
}

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const httpErr = err as { status?: number; error?: { message?: string } };
    if (httpErr.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua rede e tente novamente.';
    }
    if (httpErr.error?.message) {
      return httpErr.error.message;
    }
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
