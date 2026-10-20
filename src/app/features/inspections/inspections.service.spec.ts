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

  it('sends only supported inspection filters with zero-based pagination', () => {
    service
      .listPage({
        technicianId: 'tech-1',
        supervisorId: 'sup-1',
        clientId: 'client-1',
        siteId: 'site-1',
        status: 'SUBMITTED',
        priority: 'HIGH',
        scheduledFrom: '2026-10-01T00:00:00.000Z',
        scheduledTo: '2026-10-31T23:59:59.999Z',
        overdue: true,
        awaitingReview: false,
        page: 0,
        size: 25,
        sort: 'scheduledFor,desc',
      })
      .subscribe();

    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/inspections`);
    expect(request.request.params.keys()).toEqual([
      'technicianId',
      'supervisorId',
      'clientId',
      'siteId',
      'status',
      'priority',
      'scheduledFrom',
      'scheduledTo',
      'overdue',
      'awaitingReview',
      'page',
      'size',
      'sort',
    ]);
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('awaitingReview')).toBe('false');
    request.flush({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 });
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
