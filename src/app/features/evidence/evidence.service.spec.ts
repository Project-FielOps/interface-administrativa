import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvidenceService } from './evidence.service';

describe('EvidenceService FO-003 contract', () => {
  let service: EvidenceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EvidenceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EvidenceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests authorized evidence content from the nested content endpoint', async () => {
    const result = firstValueFrom(service.downloadContent('inspection-1', 'evidence-1'));
    const request = http.expectOne(
      `${environment.apiUrl}/inspections/inspection-1/evidence/evidence-1/content`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    await expect(result).resolves.toBeInstanceOf(Blob);
  });
});
