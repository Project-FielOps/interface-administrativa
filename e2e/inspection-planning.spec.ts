import { expect, Page, test } from '@playwright/test';

const token = {
  accessToken: 'planning-access-token',
  refreshToken: 'planning-refresh-token',
  tokenType: 'Bearer',
  expiresInSeconds: 900,
  mustChangePassword: false,
};

const ids = {
  client: '00000000-0000-0000-0000-000000000101',
  site: '00000000-0000-0000-0000-000000000102',
  equipment: '00000000-0000-0000-0000-000000000103',
  template: '00000000-0000-0000-0000-000000000104',
  inspection: '00000000-0000-0000-0000-000000000105',
  technician: '00000000-0000-0000-0000-000000000106',
  supervisor: '00000000-0000-0000-0000-000000000107',
};

function user(role: 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN') {
  return {
    id: `00000000-0000-0000-0000-00000000000${role === 'ADMIN' ? '1' : '8'}`,
    name:
      role === 'ADMIN'
        ? 'Admin FO-002'
        : `${role === 'SUPERVISOR' ? 'Supervisor' : 'Técnico'} FO-002`,
    email: `${role.toLowerCase()}@fieldops.local`,
    role,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    version: 0,
    mustChangePassword: false,
  };
}

const technician = {
  ...user('TECHNICIAN'),
  id: ids.technician,
  name: 'Técnico Atribuível',
};

const supervisor = {
  ...user('SUPERVISOR'),
  id: ids.supervisor,
  name: 'Supervisor Atribuível',
};

const client = {
  id: ids.client,
  name: 'Cliente FO-002',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
};

const site = {
  id: ids.site,
  clientId: ids.client,
  name: 'Local FO-002',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
};

const equipment = {
  id: ids.equipment,
  siteId: ids.site,
  name: 'Equipamento FO-002',
  qrCode: 'FO-002-QR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
};

const template = {
  id: ids.template,
  title: 'Modelo FO-002',
  category: 'SEGURANCA',
  status: 'ACTIVE',
  currentVersion: 1,
  createdBy: user('ADMIN').id,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
};

const version = {
  id: '00000000-0000-0000-0000-000000000108',
  templateId: ids.template,
  versionNumber: 1,
  titleSnapshot: 'Modelo FO-002',
  activeForNewInspections: true,
  published: true,
};

const dashboard = {
  inspectionsByStatus: { ASSIGNED: 0 },
  overdueCount: 0,
  awaitingReviewCount: 0,
  nonConformitiesBySeverity: {},
};

function pageResponse<T>(
  content: T[],
  pageNumber = 0,
  totalElements = content.length,
  totalPages = 1,
) {
  return { content, page: pageNumber, size: 100, totalElements, totalPages };
}

function inspectionDetail() {
  return {
    id: ids.inspection,
    templateId: ids.template,
    templateVersionNumber: 1,
    templateTitle: template.title,
    clientId: ids.client,
    clientName: client.name,
    siteId: ids.site,
    siteName: site.name,
    equipmentId: ids.equipment,
    equipmentName: equipment.name,
    technicianId: ids.technician,
    technicianName: technician.name,
    supervisorId: ids.supervisor,
    supervisorName: supervisor.name,
    title: 'Inspeção FO-002 criada',
    priority: 'HIGH',
    status: 'ASSIGNED',
    scheduledFor: '2026-12-31T12:00:00Z',
    instructions: 'Executar checklist de segurança.',
    items: [],
  };
}

async function mockSession(page: Page, role: 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN') {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(token) }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user(role)),
    }),
  );
  await page.route('**/api/v1/dashboard/summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboard),
    }),
  );
}

async function login(page: Page, role: 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN') {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(`${role.toLowerCase()}@fieldops.local`);
  await page.getByRole('textbox', { name: 'Senha' }).fill('Password@123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function mockPlanningDependencies(page: Page, assignables = true) {
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([client])),
    }),
  );
  await page.route('**/api/v1/inspection-templates**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([template])),
    }),
  );
  await page.route(`**/api/v1/inspection-templates/${ids.template}/versions`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([version]),
    }),
  );
  await page.route(`**/api/v1/clients/${ids.client}/sites**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([site])),
    }),
  );
  await page.route(`**/api/v1/sites/${ids.site}/equipment**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([equipment])),
    }),
  );
  await page.route('**/api/v1/users/assignable**', (route) => {
    if (!assignables) {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Usuário não autorizado para consultar atribuíveis.' }),
      });
    }
    const role = new URL(route.request().url()).searchParams.get('role');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse(role === 'TECHNICIAN' ? [technician] : [supervisor])),
    });
  });
}

async function openPlanning(page: Page) {
  await page.goto('/app/inspections/new');
  await expect(page.getByRole('heading', { name: 'Nova Inspeção' })).toBeVisible();
}

for (const role of ['ADMIN', 'SUPERVISOR'] as const) {
  test(`${role} consegue abrir o planejamento`, async ({ page }) => {
    await mockSession(page, role);
    await mockPlanningDependencies(page);
    await login(page, role);
    await openPlanning(page);
    await expect(page.getByRole('combobox', { name: 'Técnico responsável' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Supervisor responsável' })).toBeVisible();
  });
}

test('exibe o 403 ao carregar atribuíveis sem ocultar o formulário', async ({ page }) => {
  await mockSession(page, 'TECHNICIAN');
  await mockPlanningDependencies(page, false);
  await login(page, 'TECHNICIAN');
  await openPlanning(page);

  await expect(
    page.getByText('Você não tem permissão para executar esta ação.').first(),
  ).toBeVisible();
  await expect(page.getByLabel('Título')).toBeVisible();
});

test('exibe estado vazio quando não há técnicos ou supervisores atribuíveis', async ({ page }) => {
  await mockSession(page, 'SUPERVISOR');
  await mockPlanningDependencies(page);
  await page.unroute('**/api/v1/users/assignable**');
  await page.route('**/api/v1/users/assignable**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  await login(page, 'SUPERVISOR');
  await openPlanning(page);

  await expect(page.getByText('Nenhum técnico ativo disponível.')).toBeVisible();
  await expect(page.getByText('Nenhum supervisor ativo disponível.')).toBeVisible();
});

test('carrega todos os atribuíveis quando a resposta tem mais de 200 usuários', async ({
  page,
}) => {
  const technicians = Array.from({ length: 250 }, (_, index) => ({
    ...technician,
    id: `00000000-0000-0000-0000-${String(index + 200).padStart(12, '0')}`,
    name: `Técnico ${String(index + 1).padStart(3, '0')}`,
  }));
  let technicianPageCalls = 0;

  await mockSession(page, 'ADMIN');
  await mockPlanningDependencies(page);
  await page.unroute('**/api/v1/users/assignable**');
  await page.route('**/api/v1/users/assignable**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const role = params.get('role');
    const pageNumber = Number(params.get('page') ?? 0);
    if (role === 'TECHNICIAN') technicianPageCalls += 1;
    const values =
      role === 'TECHNICIAN'
        ? technicians.slice(pageNumber * 100, (pageNumber + 1) * 100)
        : [supervisor];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        pageResponse(
          values,
          pageNumber,
          role === 'TECHNICIAN' ? 250 : 1,
          role === 'TECHNICIAN' ? 3 : 1,
        ),
      ),
    });
  });

  await login(page, 'ADMIN');
  await openPlanning(page);
  await page.getByRole('combobox', { name: 'Técnico responsável' }).click();
  await expect(page.getByRole('option', { name: 'Técnico 250' })).toBeVisible();
  expect(technicianPageCalls).toBe(3);
});

test('cria inspeção e confirma os dados no detalhe', async ({ page }) => {
  let createBody: Record<string, unknown> | undefined;
  const inspection = inspectionDetail();

  await mockSession(page, 'SUPERVISOR');
  await mockPlanningDependencies(page);
  await page.route('**/api/v1/inspections', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    createBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(inspection),
    });
  });
  await page.route(`**/api/v1/inspections/${ids.inspection}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(inspection),
    }),
  );
  await page.route(`**/api/v1/inspections/${ids.inspection}/reviews`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route(`**/api/v1/inspections/${ids.inspection}/evidence`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route(`**/api/v1/inspections/${ids.inspection}/non-conformities`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route(`**/api/v1/inspections/${ids.inspection}/history`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await login(page, 'SUPERVISOR');
  await openPlanning(page);
  await page.getByLabel('Título').fill('Inspeção FO-002 criada');

  for (const [label, option] of [
    ['Modelo de inspeção', template.title],
    ['Cliente', client.name],
    ['Técnico responsável', technician.name],
    ['Supervisor responsável', supervisor.name],
  ]) {
    await page.getByRole('combobox', { name: label }).click();
    await page.getByRole('option', { name: option }).click();
  }

  await expect(page.getByRole('combobox', { name: 'Local' })).toBeEnabled();
  await page.getByRole('combobox', { name: 'Local' }).click();
  await page.getByRole('option', { name: site.name }).click();
  await page.getByRole('button', { name: 'Open calendar' }).click();
  await page.getByRole('gridcell', { name: /October 19, 2026/ }).click();
  await page.getByRole('button', { name: 'Agendar inspeção' }).click();

  await expect(page).toHaveURL(new RegExp(`/app/inspections/${ids.inspection}$`));
  await expect(page.getByText('Inspeção FO-002 criada')).toBeVisible();
  await expect(page.getByText('Cliente FO-002')).toBeVisible();
  await expect(page.getByText('Supervisor Atribuível')).toBeVisible();
  expect(createBody).toMatchObject({
    templateId: ids.template,
    templateVersionNumber: 1,
    clientId: ids.client,
    siteId: ids.site,
    technicianId: ids.technician,
    supervisorId: ids.supervisor,
    title: 'Inspeção FO-002 criada',
  });
  expect(String(createBody?.scheduledFor)).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});
