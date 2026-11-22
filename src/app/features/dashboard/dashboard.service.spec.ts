import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService FO-004 contract', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the real summary endpoint without fabricating actor or status parameters', () => {
    service.getSummary().subscribe();
    const request = http.expectOne(`${environment.apiUrl}/dashboard/summary`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({
      inspectionsByStatus: { ASSIGNED: 4 },
      overdueCount: 1,
      awaitingReviewCount: 2,
      nonConformitiesBySeverity: { HIGH: 3 },
    });
  });
});
