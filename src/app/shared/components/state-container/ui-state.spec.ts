import { describe, expect, it } from 'vitest';
import { forbiddenState, requestErrorState, successState } from './ui-state';

describe('ui-state', () => {
  it('distingue vazio inicial de busca sem resultados', () => {
    expect(successState([], true).phase).toBe('empty');
    expect(successState([], true, true).phase).toBe('no-results');
  });

  it('representa acesso proibido explicitamente', () => {
    expect(forbiddenState().phase).toBe('forbidden');
    expect(
      requestErrorState({
        status: 403,
        error: {
          requestId: 'req-123',
          fieldErrors: [{ field: 'name', message: 'Nome inválido' }],
        },
      }),
    ).toMatchObject({
      phase: 'forbidden',
      requestId: 'req-123',
      fieldErrors: [{ field: 'name', message: 'Nome inválido' }],
    });
  });
});
