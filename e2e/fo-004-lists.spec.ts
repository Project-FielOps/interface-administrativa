import { expect, Page, test } from '@playwright/test';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Admin FO-004',
  email: 'admin@fieldops.local',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
  mustChangePassword: false,
};

const token = {
  accessToken: 'fo-004-access-token',
  refreshToken: 'fo-004-refresh-token',
  tokenType: 'Bearer',
  expiresInSeconds: 900,
  mustChangePassword: false,
};

const pageResponse = (content: unknown[], page = 0, totalElements = content.length) => ({
  content,
  page,
  size: 10,
  totalElements,
  totalPages: Math.ceil(totalElements / 10),
});

async function mockSession(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(token) }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }),
  );
  await page.route('**/api/v1/dashboard/summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        inspectionsByStatus: { ASSIGNED: 4, SUBMITTED: 2 },
        overdueCount: 1,
        awaitingReviewCount: 2,
        nonConformitiesBySeverity: { HIGH: 3 },
      }),
    }),
  );
}

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByRole('textbox', { name: 'Senha' }).fill('Password@123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

test('dashboard navega para inspeções com o filtro real do indicador', async ({ page }) => {
  await mockSession(page);
  await login(page);

  await page.getByText('Atribuídas', { exact: true }).click();
  await expect(page).toHaveURL(/\/app\/inspections\?status=ASSIGNED/);
});

test('lista de inspeções preserva filtros na URL e envia paginação base-zero', async ({ page }) => {
  await mockSession(page);
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  await page.route('**/api/v1/users/assignable**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  const inspectionRequests: URL[] = [];
  await page.route('**/api/v1/inspections**', (route) => {
    inspectionRequests.push(new URL(route.request().url()));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        pageResponse([], Number(new URL(route.request().url()).searchParams.get('page') || 0), 25),
      ),
    });
  });

  await login(page);
  await page.goto('/app/inspections?status=SUBMITTED&priority=HIGH&page=0&size=10');
  await expect(page.getByRole('heading', { name: 'Inspeções' })).toBeVisible();
  await expect.poll(() => inspectionRequests.length).toBeGreaterThan(0);
  expect(inspectionRequests.at(-1)?.searchParams.get('status')).toBe('SUBMITTED');
  expect(inspectionRequests.at(-1)?.searchParams.get('priority')).toBe('HIGH');
  expect(inspectionRequests.at(-1)?.searchParams.get('page')).toBe('0');
  expect(inspectionRequests.at(-1)?.searchParams.get('size')).toBe('10');
  expect(inspectionRequests.at(-1)?.searchParams.get('search')).toBeNull();
  await expect(page.getByText('Nenhum resultado corresponde aos filtros aplicados.')).toBeVisible();
});

test('listas expõem navegação por teclado e nomes acessíveis nas ações', async ({ page }) => {
  await mockSession(page);
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  await page.route('**/api/v1/users/assignable**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  await page.route('**/api/v1/inspections**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        pageResponse([
          {
            id: 'inspection-1',
            title: 'Inspeção de segurança',
            status: 'ASSIGNED',
            priority: 'HIGH',
            clientName: 'Cliente',
            siteName: 'Local',
          },
        ]),
      ),
    }),
  );

  await login(page);
  await page.goto('/app/inspections');
  await expect(
    page.getByRole('button', { name: 'Inspeção de segurança', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir ações da inspeção Inspeção de segurança' }),
  ).toBeVisible();
  await expect(page.locator('a.fo-link')).toHaveCount(0);
});

test('usuários não exibem busca sem contrato e locais não chamam endpoint global inexistente', async ({
  page,
}) => {
  await mockSession(page);
  await page.route('**/api/v1/users**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  await page.route('**/api/v1/clients**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    }),
  );
  const globalSiteRequests: string[] = [];
  await page.route('**/api/v1/sites', (route) => {
    globalSiteRequests.push(route.request().url());
    return route.abort();
  });

  await login(page);
  await page.goto('/app/users');
  await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
  await expect(page.getByLabel('Buscar por nome ou e-mail')).toHaveCount(0);

  await page.goto('/app/sites');
  await expect(page.getByRole('heading', { name: 'Locais' })).toBeVisible();
  await expect(page.getByLabel('Cliente')).toBeVisible();
  expect(globalSiteRequests).toEqual([]);
});
