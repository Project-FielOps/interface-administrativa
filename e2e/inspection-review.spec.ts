import { expect, test } from '@playwright/test';
import { cleanupScenario, createScenario, uiLogin } from './support/real-api';

test('supervisor revisa e aprova inspeção preparada pela API real', async ({ page, request }) => {
  const scenario = await createScenario(request, `E2E review approve ${Date.now()}`, true);
  try {
    await uiLogin(page, 'SUPERVISOR');
    await page.goto(`/app/inspections/${scenario.inspection.id}/review`);
    await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
    await expect(page.getByText('Linha do tempo')).toBeVisible();
    await page.getByRole('button', { name: 'Aprovar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aprovar', exact: true }).click();
    await expect(page.getByText('Inspeção aprovada.')).toBeVisible();
    await expect(page.getByText('Aprovada', { exact: true }).first()).toBeVisible();
  } finally {
    await cleanupScenario(request, scenario);
  }
});

test('preserva o motivo obrigatório e reprova usando a API real', async ({ page, request }) => {
  const scenario = await createScenario(request, `E2E review reject ${Date.now()}`, true);
  try {
    await uiLogin(page, 'SUPERVISOR');
    await page.goto(`/app/inspections/${scenario.inspection.id}/review`);
    await page.getByRole('button', { name: /Reprovar/ }).click();
    await page.getByRole('button', { name: 'Confirmar reprovação' }).click();
    await expect(page.getByText('O motivo é obrigatório')).toBeVisible();
    await page.getByLabel('Motivo da reprovação').fill('Proteção requer ajuste');
    await page.getByRole('button', { name: 'Confirmar reprovação' }).click();
    await expect(page.getByText('Inspeção reprovada.')).toBeVisible();
  } finally {
    await cleanupScenario(request, scenario);
  }
});

test('preserva o contexto quando a API retorna 403 na decisão', async ({ page, request }) => {
  const scenario = await createScenario(request, `E2E review forbidden ${Date.now()}`, true);
  try {
    await page.route('**/api/v1/inspections/*/approve', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Sem permissão para revisar.' }),
      }),
    );
    await uiLogin(page, 'SUPERVISOR');
    await page.goto(`/app/inspections/${scenario.inspection.id}/review`);
    await page.getByRole('button', { name: 'Aprovar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aprovar', exact: true }).click();
    await expect(page.getByText('Sem permissão para revisar.')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/app/inspections/${scenario.inspection.id}/review`));
  } finally {
    await cleanupScenario(request, scenario);
  }
});
