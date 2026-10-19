import { expect, Page, test } from '@playwright/test';

const inspectionId = '00000000-0000-0000-0000-000000000301';
const evidenceId = '00000000-0000-0000-0000-000000000302';
const token = {
  accessToken: 'review-token',
  refreshToken: 'review-refresh',
  tokenType: 'Bearer',
  expiresInSeconds: 900,
  mustChangePassword: false,
};
const user = {
  id: '00000000-0000-0000-0000-000000000303',
  name: 'Supervisor FO-003',
  email: 'supervisor.fo003@fieldops.local',
  role: 'SUPERVISOR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
  mustChangePassword: false,
};
const inspection = {
  id: inspectionId,
  clientId: 'client-1',
  clientName: 'Cliente FO-003',
  siteId: 'site-1',
  siteName: 'Local FO-003',
  technicianId: 'tech-1',
  technicianName: 'Técnico FO-003',
  supervisorId: user.id,
  supervisorName: user.name,
  title: 'Inspeção FO-003',
  priority: 'HIGH',
  status: 'UNDER_REVIEW',
  scheduledFor: '2026-10-19T12:00:00Z',
  items: [
    {
      id: 'item-1',
      sectionTitle: 'Segurança',
      sectionOrder: 1,
      itemTitle: 'Proteção instalada',
      itemOrder: 1,
      responseType: 'CONFORMITY',
      required: true,
      answer: {
        id: 'answer-1',
        inspectionItemId: 'item-1',
        conformity: 'NON_CONFORMING',
        version: 1,
      },
    },
  ],
};

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
        inspectionsByStatus: {},
        overdueCount: 0,
        awaitingReviewCount: 0,
        nonConformitiesBySeverity: {},
      }),
    }),
  );
}

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByRole('textbox', { name: 'Senha' }).fill('Password@123');
  await page.getByRole('button', { name: 'Entrar' }).click();
}

async function mockDetail(page: Page, decisionStatus: string = 'UNDER_REVIEW'): Promise<void> {
  await page.route(`**/api/v1/inspections/${inspectionId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...inspection, status: decisionStatus }),
    }),
  );
  await page.route(`**/api/v1/inspections/${inspectionId}/responses`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(inspection.items[0].answer ? [inspection.items[0].answer] : []),
    }),
  );
  await page.route(`**/api/v1/inspections/${inspectionId}/reviews`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'review-1',
          inspectionId,
          reviewerId: user.id,
          reviewerName: user.name,
          decision: 'REJECTED',
          reason: 'Ajustar proteção',
          reviewedAt: '2026-10-18T12:00:00Z',
          reviewCycle: 1,
        },
      ]),
    }),
  );
  await page.route(`**/api/v1/inspections/${inspectionId}/evidence`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: evidenceId,
          inspectionId,
          responseId: 'answer-1',
          type: 'DOCUMENT',
          originalFileName: 'laudo.pdf',
          mimeType: 'application/pdf',
          uploadedAt: '2026-10-18T12:00:00Z',
        },
      ]),
    }),
  );
  await page.route(`**/api/v1/inspections/${inspectionId}/non-conformities`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route(`**/api/v1/inspections/${inspectionId}/history`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'event-1',
          action: 'REVIEW_REJECTED',
          entityType: 'Inspection',
          entityId: inspectionId,
          occurredAt: '2026-10-18T12:00:00Z',
        },
      ]),
    }),
  );
}

test('supervisor aprova e a tela impede decisão duplicada', async ({ page }) => {
  let status = 'UNDER_REVIEW';
  await mockSession(page);
  await mockDetail(page);
  await page.unroute(`**/api/v1/inspections/${inspectionId}`);
  await page.route(`**/api/v1/inspections/${inspectionId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...inspection, status }),
    }),
  );
  await page.route(`**/api/v1/inspections/${inspectionId}/approve`, (route) => {
    status = 'APPROVED';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...inspection, status }),
    });
  });
  await login(page);
  await page.goto(`/app/inspections/${inspectionId}/review`);
  await expect(page.getByText('Linha do tempo')).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Aprovar', exact: true }).click();
  await expect(page.getByText('Inspeção aprovada.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprovar', exact: true })).toHaveCount(0);
});

test('exige motivo para reprovar e registra o motivo na revisão', async ({ page }) => {
  await mockSession(page);
  await mockDetail(page);
  let body: unknown;
  await page.route(`**/api/v1/inspections/${inspectionId}/reject`, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...inspection, status: 'REJECTED' }),
    });
  });
  await login(page);
  await page.goto(`/app/inspections/${inspectionId}/review`);
  await page.getByRole('button', { name: /Reprovar/ }).click();
  await page.getByRole('button', { name: 'Confirmar reprovação' }).click();
  await expect(page.getByText('O motivo é obrigatório')).toBeVisible();
  await page.getByLabel('Motivo da reprovação').fill('Proteção ausente');
  await page.getByRole('button', { name: 'Confirmar reprovação' }).click();
  await expect(page.getByText('Inspeção reprovada.')).toBeVisible();
  expect(body).toEqual({ reason: 'Proteção ausente' });
});

test('preserva o contexto ao receber 403 ou 409 na decisão', async ({ page }) => {
  await mockSession(page);
  await mockDetail(page);
  await page.route(`**/api/v1/inspections/${inspectionId}/approve`, (route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Sem permissão para revisar.' }),
    }),
  );
  await login(page);
  await page.goto(`/app/inspections/${inspectionId}/review`);
  await expect(page.getByText('Linha do tempo')).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Aprovar', exact: true }).click();
  await expect(page.getByText('Sem permissão para revisar.')).toBeVisible();
  await expect(page.getByText('Inspeção FO-003')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Linha do tempo')).toBeVisible();
  await page.route(`**/api/v1/inspections/${inspectionId}/approve`, (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'A inspeção foi alterada.' }),
    }),
  );
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Aprovar', exact: true }).click();
  await expect(page.getByText('A inspeção foi alterada.').last()).toBeVisible();
  await expect(page.getByText('Proteção instalada')).toBeVisible();
});

test('abre conteúdo de evidência por endpoint autorizado', async ({ page }) => {
  await mockSession(page);
  await mockDetail(page);
  let contentCalls = 0;
  await page.route(
    `**/api/v1/inspections/${inspectionId}/evidence/${evidenceId}/content`,
    (route) => {
      contentCalls += 1;
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.7' });
    },
  );
  await login(page);
  await page.goto(`/app/inspections/${inspectionId}`);
  await expect(page.getByText('laudo.pdf', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Abrir PDF' }).last().click();
  await expect.poll(() => contentCalls).toBe(1);
});
