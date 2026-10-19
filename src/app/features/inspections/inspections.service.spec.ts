import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InspectionsService } from './inspections.service';

describe('InspectionsService FO-003 contract', () => {
  let service: InspectionsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InspectionsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InspectionsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads responses separately for snapshot merging', async () => {
    const result = firstValueFrom(service.getResponses('inspection-1'));
    const request = http.expectOne(`${environment.apiUrl}/inspections/inspection-1/responses`);

    expect(request.request.method).toBe('GET');
    request.flush([]);
    await expect(result).resolves.toEqual([]);
  });

  it('sends review decisions to the explicit endpoints and preserves the reason', () => {
    service
      .reject('inspection-1', 'Equipamento sem proteção', 'Corrigir antes de reenviar')
      .subscribe();
    const reject = http.expectOne(`${environment.apiUrl}/inspections/inspection-1/reject`);
    expect(reject.request.method).toBe('POST');
    expect(reject.request.body).toEqual({
      reason: 'Equipamento sem proteção',
      comments: 'Corrigir antes de reenviar',
    });
    reject.flush({});

    service.approve('inspection-1').subscribe();
    const approve = http.expectOne(`${environment.apiUrl}/inspections/inspection-1/approve`);
    expect(approve.request.method).toBe('POST');
    expect(approve.request.body).toEqual({});
    approve.flush({});
  });
});
