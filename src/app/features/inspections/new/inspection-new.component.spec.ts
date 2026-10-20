import { FormBuilder } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { InspectionNewComponent, toScheduledForIso } from './inspection-new.component';
import { Client, Equipment, InspectionSite } from '../../../core/models/client.model';
import { InspectionPriority } from '../../../core/models/inspection.model';
import { InspectionTemplate } from '../../../core/models/template.model';
import { User } from '../../../core/models/user.model';

const user = (role: User['role'], id: string, status: User['status'] = 'ACTIVE'): User => ({
  id,
  name: `${role} ${id}`,
  email: `${id}@fieldops.local`,
  role,
  status,
  createdAt: '',
  updatedAt: '',
  version: 1,
});

const client = (id: string, status: Client['status'] = 'ACTIVE'): Client => ({
  id,
  name: `Cliente ${id}`,
  status,
  createdAt: '',
  updatedAt: '',
  version: 1,
});

const site = (
  id: string,
  clientId: string,
  status: InspectionSite['status'] = 'ACTIVE',
): InspectionSite => ({
  id,
  clientId,
  name: `Local ${id}`,
  status,
  createdAt: '',
  updatedAt: '',
  version: 1,
});

const equipment = (
  id: string,
  siteId: string,
  status: Equipment['status'] = 'ACTIVE',
): Equipment => ({
  id,
  siteId,
  name: `Equipamento ${id}`,
  qrCode: id,
  status,
  createdAt: '',
  updatedAt: '',
  version: 1,
});

const template = (
  id: string,
  status: InspectionTemplate['status'] = 'ACTIVE',
): InspectionTemplate => ({
  id,
  title: `Modelo ${id}`,
  category: 'SAFETY',
  status,
  createdBy: 'admin',
  createdAt: '',
  updatedAt: '',
  version: 1,
});

function createComponent(
  overrides: Partial<{
    sites: Observable<InspectionSite[]>;
    equipment: Observable<Equipment[]>;
    technicians: Observable<{
      content: User[];
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>;
  }> = {},
): InspectionNewComponent {
  const page = (content: User[]) =>
    of({ content, page: 0, size: 100, totalElements: content.length, totalPages: 1 });
  return new InspectionNewComponent(
    new FormBuilder(),
    { create: () => of({ id: 'inspection-1' }) } as never,
    {
      list: () =>
        of({ content: [client('client-1')], page: 0, size: 200, totalElements: 1, totalPages: 1 }),
    } as never,
    { listByClient: () => overrides.sites ?? of([site('site-1', 'client-1')]) } as never,
    { listBySite: () => overrides.equipment ?? of([equipment('equipment-1', 'site-1')]) } as never,
    {
      listAssignable: (role: User['role']) =>
        overrides.technicians ??
        page([
          user(role === 'TECHNICIAN' ? 'TECHNICIAN' : 'SUPERVISOR', `${role.toLowerCase()}-1`),
        ]),
    } as never,
    {
      list: () =>
        of({
          content: [template('template-1')],
          page: 0,
          size: 200,
          totalElements: 1,
          totalPages: 1,
        }),
      getVersions: () => of([]),
    } as never,
    { navigate: () => of(true) } as never,
  );
}

describe('InspectionNewComponent planning form', () => {
  it('serializes scheduledFor as an ISO-8601 instant with timezone', () => {
    expect(toScheduledForIso(new Date('2026-10-19T10:30:00-03:00'))).toBe(
      '2026-10-19T13:30:00.000Z',
    );
  });

  it('filters inactive options and keeps the sibling selection when one assignable load fails', () => {
    const component = createComponent({
      sites: of([site('site-active', 'client-1'), site('site-inactive', 'client-1', 'INACTIVE')]),
      equipment: of([
        equipment('equipment-active', 'site-1'),
        equipment('equipment-inactive', 'site-1', 'INACTIVE'),
      ]),
    });
    component.ngOnInit();
    component.form.controls.supervisorId.setValue('supervisor-1');

    expect(component.sites()).toHaveLength(0);
    component.form.controls.clientId.setValue('client-1');
    expect(component.sites()).toEqual([site('site-active', 'client-1')]);
    component.form.controls.siteId.setValue('site-1');
    expect(component.equipment()).toEqual([equipment('equipment-active', 'site-1')]);
    expect(component.form.controls.supervisorId.value).toBe('supervisor-1');
  });

  it('keeps already loaded assignable options when a sibling request fails', () => {
    const component = new InspectionNewComponent(
      new FormBuilder(),
      { create: () => of({ id: 'inspection-1' }) } as never,
      {
        list: () => of({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }),
      } as never,
      { listByClient: () => of([]) } as never,
      { listBySite: () => of([]) } as never,
      {
        listAssignable: (role: User['role']) =>
          role === 'TECHNICIAN'
            ? throwError(() => ({ status: 403, error: { message: 'Sem permissão' } }))
            : of({
                content: [user('SUPERVISOR', 'supervisor-1')],
                page: 0,
                size: 100,
                totalElements: 1,
                totalPages: 1,
              }),
      } as never,
      {
        list: () => of({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }),
        getVersions: () => of([]),
      } as never,
      { navigate: () => of(true) } as never,
    );
    component.ngOnInit();
    component.form.controls.supervisorId.setValue('supervisor-1');

    expect(component.techniciansState().phase).toBe('error');
    expect(component.supervisors()).toHaveLength(1);
    expect(component.form.controls.supervisorId.value).toBe('supervisor-1');
  });

  it('loads every assignable page so a list larger than 200 remains selectable', () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      user('TECHNICIAN', `tech-${index}`),
    );
    const secondPage = Array.from({ length: 100 }, (_, index) =>
      user('TECHNICIAN', `tech-${index + 100}`),
    );
    const thirdPage = Array.from({ length: 50 }, (_, index) =>
      user('TECHNICIAN', `tech-${index + 200}`),
    );
    const calls: number[] = [];
    const component = new InspectionNewComponent(
      new FormBuilder(),
      { create: () => of({ id: 'inspection-1' }) } as never,
      {
        list: () => of({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }),
      } as never,
      { listByClient: () => of([]) } as never,
      { listBySite: () => of([]) } as never,
      {
        listAssignable: (role: User['role'], query: { page?: number }) => {
          if (role === 'TECHNICIAN') calls.push(query.page ?? 0);
          const content =
            role === 'TECHNICIAN'
              ? [firstPage, secondPage, thirdPage][query.page ?? 0]
              : [user('SUPERVISOR', 'supervisor-1')];
          return of({
            content,
            page: query.page ?? 0,
            size: 100,
            totalElements: role === 'TECHNICIAN' ? 250 : 1,
            totalPages: role === 'TECHNICIAN' ? 3 : 1,
          });
        },
      } as never,
      {
        list: () => of({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }),
        getVersions: () => of([]),
      } as never,
      { navigate: () => of(true) } as never,
    );
    component.ngOnInit();

    expect(component.technicians()).toHaveLength(250);
    expect(calls).toEqual([0, 1, 2]);
  });

  it('requires the planning chain and accepts the typed priority', () => {
    const component = createComponent();
    expect(component.form.invalid).toBe(true);
    component.form.patchValue({
      title: 'Inspeção',
      templateId: 'template-1',
      templateVersionNumber: 1,
      clientId: 'client-1',
      siteId: 'site-1',
      technicianId: 'technician-1',
      supervisorId: 'supervisor-1',
      priority: 'HIGH' as InspectionPriority,
      scheduledFor: new Date(),
    });
    expect(component.form.valid).toBe(true);
  });
});
