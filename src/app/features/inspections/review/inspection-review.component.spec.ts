import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { InspectionReviewComponent } from './inspection-review.component';

function createComponent(status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' = 'UNDER_REVIEW') {
  return new InspectionReviewComponent(
    new FormBuilder(),
    {
      get: () =>
        of({
          id: 'inspection-1',
          clientId: 'client-1',
          siteId: 'site-1',
          technicianId: 'tech-1',
          supervisorId: 'sup-1',
          title: 'Inspeção',
          priority: 'HIGH',
          status,
          scheduledFor: '2026-10-19T12:00:00Z',
          items: [],
        }),
      getResponses: () => of([]),
      getReviews: () => of([]),
      getHistory: () => of([]),
    } as never,
    { listByInspection: () => of([]) } as never,
    { listByInspection: () => of([]) } as never,
    { open: () => ({ afterClosed: () => of(false) }) } as never,
    { open: () => undefined } as never,
    { navigate: () => undefined } as never,
  );
}

describe('InspectionReviewComponent FO-003', () => {
  it('requires a reason before submitting rejection', () => {
    const component = createComponent();
    component.inspectionId = 'inspection-1';
    component.load();
    component.showRejectForm.set(true);

    component.submitReject();

    expect(component.rejectForm.controls.reason.touched).toBe(true);
    expect(component.submittingDecision()).toBe(false);
  });

  it('does not expose a decision action for approved inspections', () => {
    const component = createComponent('APPROVED');
    component.inspectionId = 'inspection-1';
    component.load();

    expect(component.isReadOnly).toBe(true);
    expect(component.canDecide).toBe(false);
  });
});
