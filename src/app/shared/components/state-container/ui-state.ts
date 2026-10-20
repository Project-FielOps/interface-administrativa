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
  requestId?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export function loadingState<T>(): UiState<T> {
  return { phase: 'loading' };
}

export function successState<T>(data: T, isEmpty: boolean, filtered = false): UiState<T> {
  return { phase: isEmpty ? (filtered ? 'no-results' : 'empty') : 'success', data };
}

export function errorState<T>(
  message: string,
  details: Pick<UiState<T>, 'requestId' | 'fieldErrors'> = {},
): UiState<T> {
  return { phase: 'error', errorMessage: message, ...details };
}

export function forbiddenState<T>(): UiState<T> {
  return { phase: 'forbidden' };
}

export function requestErrorState<T>(err: unknown): UiState<T> {
  const apiError = getApiError(err);
  if (
    err &&
    typeof err === 'object' &&
    'status' in err &&
    (err as { status?: number }).status === 403
  ) {
    return {
      ...forbiddenState(),
      requestId: apiError?.requestId,
      fieldErrors: apiError?.fieldErrors,
    };
  }
  return errorState(extractErrorMessage(err), {
    requestId: apiError?.requestId,
    fieldErrors: apiError?.fieldErrors,
  });
}

export function extractErrorMessage(err: unknown): string {
  const apiError = getApiError(err);
  if (apiError?.message) return apiError.message;

  if (err && typeof err === 'object' && 'error' in err) {
    const httpErr = err as { status?: number };
    if (httpErr.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua rede e tente novamente.';
    }
    if (httpErr.status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (httpErr.status === 403) return 'Você não tem permissão para executar esta ação.';
    if (httpErr.status === 409)
      return 'A operação entrou em conflito com uma alteração existente. Atualize e tente novamente.';
    if (httpErr.status === 422)
      return 'Não foi possível concluir a operação. Corrija os campos indicados e tente novamente.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

interface ApiErrorShape {
  message?: string;
  requestId?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

function getApiError(err: unknown): ApiErrorShape | undefined {
  if (!err || typeof err !== 'object' || !('error' in err)) return undefined;
  const body = (err as { error?: unknown }).error;
  if (!body || typeof body !== 'object') return undefined;
  return body as ApiErrorShape;
}
