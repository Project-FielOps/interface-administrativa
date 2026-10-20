import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  const snackBar = { open: vi.fn() };

  beforeEach(() => {
    snackBar.open.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackBar },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => http.verify());

  it.each([
    [403, 'Você não tem permissão para executar esta ação.'],
    [409, 'Registro em conflito.'],
    [422, 'Dados inválidos.'],
  ])('shows the canonical message for HTTP %s', async (status, message) => {
    const request = firstValueFrom(client.get('/protected'));
    const pending = http.expectOne('/protected');
    pending.flush({ status, code: 'TEST_ERROR', message }, { status, statusText: 'Error' });

    await expect(request).rejects.toMatchObject({ status });
    expect(snackBar.open).toHaveBeenCalledWith(message, 'Fechar', { duration: 5000 });
  });

  it('does not redirect or handle a protected 401 before auth refresh completes', async () => {
    const request = firstValueFrom(client.get('/protected'));
    http.expectOne('/protected').flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(snackBar.open).not.toHaveBeenCalled();
  });
});
