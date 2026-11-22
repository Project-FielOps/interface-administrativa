import { APIRequestContext, expect } from '@playwright/test';

export const API_BASE_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api/v1';
export const E2E_PASSWORD = process.env.FIELDOPS_E2E_PASSWORD;

type Role = 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN';

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: Role };
};

type Scenario = {
  admin: Session;
  supervisor: Session;
  technician: Session;
  client: { id: string; name: string };
  site: { id: string; name: string };
  equipment: { id: string; name: string };
  template: { id: string; title: string };
  inspection: { id: string; title: string };
};

const seededEmails: Record<Role, string> = {
  ADMIN: 'admin@fieldops.local',
  SUPERVISOR: 'supervisor@fieldops.local',
  TECHNICIAN: 'technician@fieldops.local',
};

export function requireE2EPassword(): string {
  if (!E2E_PASSWORD) {
    throw new Error('FIELDOPS_E2E_PASSWORD must contain the local development seed password.');
  }
  return E2E_PASSWORD;
}

async function json<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as T;
}

export async function loginApi(request: APIRequestContext, role: Role): Promise<Session> {
  const password = requireE2EPassword();
  const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: seededEmails[role], password },
  });
  const token = await json<{
    accessToken: string;
    refreshToken: string;
  }>(loginResponse);
  const me = await json<{ id: string; email: string; name: string; role: Role }>(
    await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    }),
  );
  return { ...token, user: me };
}

async function api<T>(
  request: APIRequestContext,
  session: Session,
  method: 'get' | 'post' | 'patch',
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await request[method](`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    ...(data === undefined ? {} : { data }),
  });
  return json<T>(response);
}

async function first<T>(request: APIRequestContext, session: Session, path: string): Promise<T> {
  const page = await api<PageResponse<T>>(request, session, 'get', `${path}?page=0&size=100`);
  expect(page.content.length, `Expected seeded data at ${path}`).toBeGreaterThan(0);
  return page.content[0];
}

export async function createScenario(
  request: APIRequestContext,
  prefix: string,
  prepareReview = false,
): Promise<Scenario> {
  const admin = await loginApi(request, 'ADMIN');
  const supervisor = await loginApi(request, 'SUPERVISOR');
  const technician = await loginApi(request, 'TECHNICIAN');
  const client = await first<{ id: string; name: string }>(request, admin, '/clients');
  const site = await first<{ id: string; name: string }>(
    request,
    admin,
    `/clients/${client.id}/sites`,
  );
  const equipment = await first<{ id: string; name: string }>(
    request,
    admin,
    `/sites/${site.id}/equipment`,
  );

  const template = await api<{ id: string; title: string }>(
    request,
    admin,
    'post',
    '/inspection-templates',
    {
      title: `${prefix} template`,
      description: 'E2E disposable template',
      category: 'E2E',
    },
  );
  const section = await api<{ id: string }>(
    request,
    admin,
    'post',
    `/inspection-templates/${template.id}/sections`,
    { title: `${prefix} section`, description: 'E2E section', displayOrder: 1 },
  );
  await api(
    request,
    admin,
    'post',
    `/inspection-templates/${template.id}/sections/${section.id}/items`,
    {
      code: `${prefix}-item`,
      title: `${prefix} checklist item`,
      description: 'E2E item',
      responseType: 'CONFORMITY',
      required: false,
      observationRequiredOnFailure: false,
      evidenceRequiredOnFailure: false,
      optionsJson: null,
      displayOrder: 1,
    },
  );
  await api(request, admin, 'post', `/inspection-templates/${template.id}/publish`);

  const inspection = await api<{ id: string; title: string }>(
    request,
    admin,
    'post',
    '/inspections',
    {
      templateId: template.id,
      clientId: client.id,
      siteId: site.id,
      equipmentId: equipment.id,
      technicianId: technician.user.id,
      supervisorId: supervisor.user.id,
      title: `${prefix} inspection`,
      instructions: 'E2E disposable inspection',
      priority: 'HIGH',
      scheduledFor: new Date(Date.now() + 86_400_000).toISOString(),
    },
  );

  if (prepareReview) {
    await api(request, technician, 'post', `/inspections/${inspection.id}/start`);
    await api(request, technician, 'post', `/inspections/${inspection.id}/submit`);
    await api(request, supervisor, 'post', `/inspections/${inspection.id}/begin-review`);
  }

  return { admin, supervisor, technician, client, site, equipment, template, inspection };
}

export async function cleanupScenario(
  request: APIRequestContext,
  scenario: Scenario,
): Promise<void> {
  const cleanupAdmin = await loginApi(request, 'ADMIN');
  const cancel = await request.post(
    `${API_BASE_URL}/inspections/${scenario.inspection.id}/cancel`,
    {
      headers: { Authorization: `Bearer ${cleanupAdmin.accessToken}` },
      data: { reason: 'E2E cleanup' },
    },
  );
  if (![200, 204, 409, 422].includes(cancel.status())) {
    throw new Error(
      `E2E cleanup could not cancel inspection: ${cancel.status()} ${await cancel.text()}`,
    );
  }
  const templateStatus = await request.patch(
    `${API_BASE_URL}/inspection-templates/${scenario.template.id}/status`,
    {
      headers: { Authorization: `Bearer ${cleanupAdmin.accessToken}` },
      data: { status: 'INACTIVE' },
    },
  );
  if (!templateStatus.ok() && templateStatus.status() !== 409) {
    throw new Error(
      `E2E cleanup could not deactivate template: ${templateStatus.status()} ${await templateStatus.text()}`,
    );
  }
}

export async function uiLogin(page: import('@playwright/test').Page, role: Role): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(seededEmails[role]);
  await page.getByRole('textbox', { name: 'Senha' }).fill(requireE2EPassword());
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

export { seededEmails };
