import { expect, test } from '@playwright/test';
import { cleanupScenario, createScenario, uiLogin } from './support/real-api';

test('planeja e consulta uma inspeção criada na API real', async ({ page, request }) => {
  const scenario = await createScenario(request, `E2E planning ${Date.now()}`);
  try {
    await uiLogin(page, 'ADMIN');
    await page.goto(`/app/inspections/${scenario.inspection.id}`);
    await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
    await expect(page.getByText(scenario.client.name, { exact: true })).toBeVisible();
    await expect(page.getByText('Atribuída', { exact: true })).toBeVisible();
  } finally {
    await cleanupScenario(request, scenario);
  }
});

test('lista inspeções reais com filtro e paginação base-zero', async ({ page, request }) => {
  const scenario = await createScenario(request, `E2E list ${Date.now()}`);
  try {
    await uiLogin(page, 'ADMIN');
    await page.goto('/app/inspections?status=ASSIGNED&priority=HIGH&page=0&size=10');
    await expect(page.getByRole('heading', { name: 'Inspeções' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Local' }).click();
    await expect(page.getByRole('option', { name: scenario.site.name, exact: true })).toBeVisible();
    await page.getByRole('option', { name: scenario.site.name, exact: true }).click();
    await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/status=ASSIGNED/);
    await expect(page).toHaveURL(/siteId=/);
  } finally {
    await cleanupScenario(request, scenario);
  }
});
