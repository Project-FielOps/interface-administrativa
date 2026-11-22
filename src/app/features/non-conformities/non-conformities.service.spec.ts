import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { NonConformitiesService } from './non-conformities.service';

describe('NonConformitiesService', () => {
  let service: NonConformitiesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NonConformitiesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NonConformitiesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the paginated global endpoint with the active filters', () => {
    service
      .listPage({ inspectionId: 'inspection-1', severity: 'HIGH', page: 0, size: 10 })
      .subscribe();

    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/non-conformities`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('inspectionId')).toBe('inspection-1');
    expect(request.request.params.get('severity')).toBe('HIGH');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('10');
    request.flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });
});
