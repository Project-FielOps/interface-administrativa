import { of, throwError } from 'rxjs';
import { InspectionDetailComponent } from './inspection-detail.component';
import { Inspection } from '../../../core/models/inspection.model';

const inspection: Inspection = {
  id: 'inspection-1',
  clientId: 'client-1',
  siteId: 'site-1',
  technicianId: 'technician-1',
  supervisorId: 'supervisor-1',
  title: 'Inspeção de segurança',
  priority: 'HIGH',
  status: 'UNDER_REVIEW',
  scheduledFor: '2026-10-19T12:00:00Z',
  items: [
    {
      id: 'item-1',
      sectionTitle: 'Proteção',
      sectionOrder: 1,
      itemTitle: 'Grade',
      itemOrder: 1,
      responseType: 'CONFORMITY',
      required: true,
    },
  ],
};

function createComponent(
  overrides: Partial<Record<string, unknown>> = {},
): InspectionDetailComponent {
  const inspections = {
    get: () => of(inspection),
    getResponses: () =>
      of([{ id: 'answer-1', inspectionItemId: 'item-1', conformity: 'CONFORMING', version: 1 }]),
    getReviews: () => of([]),
    getHistory: () => of([]),
    ...overrides,
  };
  return new InspectionDetailComponent(
    inspections as never,
    {
      listByInspection: () => of([]),
      downloadContent: () => of(new Blob(['x'], { type: 'image/png' })),
    } as never,
    { listByInspection: () => of([]) } as never,
    { open: () => ({ afterClosed: () => of(false) }) } as never,
    { open: () => undefined } as never,
    { navigate: () => undefined } as never,
  );
}

describe('InspectionDetailComponent FO-003', () => {
  it('merges separately loaded responses into the snapshot', () => {
    const component = createComponent();
    component.inspectionId = 'inspection-1';
    component.load();

    expect(component.inspectionState().data?.items?.[0].answer?.id).toBe('answer-1');
    expect(component.responsesState().phase).toBe('success');
  });

  it('keeps the inspection context when a secondary section fails', () => {
    const component = createComponent({ getReviews: () => throwError(() => ({ status: 403 })) });
    component.inspectionId = 'inspection-1';
    component.load();

    expect(component.inspectionState().data?.id).toBe('inspection-1');
    expect(component.reviewsState().phase).toBe('forbidden');
  });

  it('blocks actions for approved and canceled inspections', () => {
    const component = createComponent({ get: () => of({ ...inspection, status: 'APPROVED' }) });
    component.inspectionId = 'inspection-1';
    component.load();

    expect(component.isReadOnly(component.inspectionState().data!)).toBe(true);
    expect(component.canReview(component.inspectionState().data!)).toBe(false);
    expect(component.canCancel(component.inspectionState().data!)).toBe(false);
  });
});
