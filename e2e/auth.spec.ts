import { expect, Page, test } from '@playwright/test';

const token = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiresInSeconds: 900,
  mustChangePassword: false,
};

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Admin E2E',
  email: 'admin@fieldops.local',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
  mustChangePassword: false,
};

const dashboard = {
  inspectionsByStatus: { ASSIGNED: 2, SUBMITTED: 1 },
  overdueCount: 0,
  awaitingReviewCount: 1,
  nonConformitiesBySeverity: { LOW: 1 },
};

async function mockSuccessfulSession(page: Page, mustChangePassword = false): Promise<void> {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...token, mustChangePassword }),
    }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...user, mustChangePassword }),
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

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@fieldops.local');
  await page.getByRole('textbox', { name: 'Senha' }).fill('Password@123');
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test('faz login e carrega /auth/me antes do dashboard', async ({ page }) => {
  let meCalls = 0;
  await mockSuccessfulSession(page);
  await page.unroute('**/api/v1/auth/me');
  await page.route('**/api/v1/auth/me', (route) => {
    meCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  await login(page);

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByText('Olá, Admin E2E')).toBeVisible();
  expect(meCalls).toBe(1);
});

test('exibe erro acionável para credencial inválida', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        timestamp: '2026-01-01T00:00:00Z',
        status: 401,
        error: 'Unauthorized',
        code: 'INVALID_CREDENTIALS',
        message: 'E-mail ou senha inválidos.',
        path: '/api/v1/auth/login',
        requestId: 'e2e-login-error',
      }),
    }),
  );

  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@fieldops.local');
  await page.getByRole('textbox', { name: 'Senha' }).fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos.');
  await expect(page).toHaveURL(/\/login$/);
});

test('redireciona senha temporária para troca obrigatória', async ({ page }) => {
  await mockSuccessfulSession(page, true);

  await login(page);

  await expect(page).toHaveURL(/\/app\/change-password$/);
  await expect(page.getByRole('heading', { name: 'Trocar senha' })).toBeVisible();
});

test('compartilha refresh e repete a chamada protegida uma única vez', async ({ page }) => {
  let summaryCalls = 0;
  let refreshCalls = 0;
  await mockSuccessfulSession(page);
  await page.unroute('**/api/v1/dashboard/summary');
  await page.route('**/api/v1/dashboard/summary', (route) => {
    summaryCalls += 1;
    if (summaryCalls === 1) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboard),
    });
  });
  await page.route('**/api/v1/auth/refresh', (route) => {
    refreshCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...token, accessToken: 'refreshed-access-token' }),
    });
  });

  await login(page);

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'O que precisa de atenção' })).toBeVisible();
  expect(summaryCalls).toBe(2);
  expect(refreshCalls).toBe(1);
});

test('faz logout remoto e retorna ao login', async ({ page }) => {
  let logoutBody: unknown;
  await mockSuccessfulSession(page);
  await page.route('**/api/v1/auth/logout', async (route) => {
    logoutBody = route.request().postDataJSON();
    await route.fulfill({ status: 204, body: '' });
  });

  await login(page);
  await page.getByRole('button', { name: 'Abrir menu do usuário' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();

  await expect(page).toHaveURL(/\/login$/);
  expect(logoutBody).toEqual({ refreshToken: 'refresh-token' });
});

test('solicita recuperação sem revelar se o e-mail existe', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/api/v1/auth/forgot-password', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'If the account exists, instructions were sent.',
      }),
    });
  });

  await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('unknown@example.com');
  await page.getByRole('button', { name: 'Enviar instruções' }).click();

  await expect(page.getByRole('status')).toContainText('Se houver uma conta ativa');
  expect(requestBody).toEqual({ email: 'unknown@example.com' });
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test('consome token de reset da URL e redefine senha válida', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/api/v1/auth/reset-password', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/reset-password?token=one-time-token');
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('Strong@123');
  await page
    .getByRole('textbox', { name: 'Confirme a nova senha', exact: true })
    .fill('Strong@123');
  await page.getByRole('button', { name: 'Redefinir senha' }).click();

  await expect(page.getByRole('status')).toContainText('Sua senha foi redefinida');
  expect(requestBody).toEqual({ token: 'one-time-token', newPassword: 'Strong@123' });
});

test('informa token de reset inválido sem expor o valor', async ({ page }) => {
  await page.route('**/api/v1/auth/reset-password', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ status: 401, code: 'INVALID_CREDENTIALS' }),
    }),
  );

  await page.goto('/reset-password?token=expired-token');
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('Strong@123');
  await page
    .getByRole('textbox', { name: 'Confirme a nova senha', exact: true })
    .fill('Strong@123');
  await page.getByRole('button', { name: 'Redefinir senha' }).click();

  await expect(page.getByRole('alert')).toContainText('inválido, expirou ou já foi usado');
  await expect(page).toHaveURL(/\/reset-password$/);
});

test('exige força e confirmação na troca obrigatória', async ({ page }) => {
  await mockSuccessfulSession(page, true);
  await login(page);

  await page.getByLabel('Senha atual').fill('Password@123');
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('fraca');
  await page.getByRole('textbox', { name: 'Confirme a nova senha', exact: true }).fill('diferente');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();

  await expect(
    page.locator('mat-error').filter({ hasText: 'ao menos 8 caracteres' }),
  ).toBeVisible();
  await expect(
    page.getByText('A confirmação não coincide com a nova senha', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/change-password$/);
});
