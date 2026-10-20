import { expect, test } from '@playwright/test';
import { cleanupScenario, createScenario, uiLogin } from './support/real-api';

test('dashboard real exibe indicadores e navega para a lista filtrada', async ({
  page,
  request,
}) => {
  const scenario = await createScenario(request, `E2E dashboard ${Date.now()}`);
  try {
    await uiLogin(page, 'ADMIN');
    await expect(page.getByRole('heading', { name: 'O que precisa de atenção' })).toBeVisible();
    await page.getByText('Atribuídas', { exact: true }).click();
    await expect(page).toHaveURL(/\/app\/inspections\?status=ASSIGNED/);
    await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
  } finally {
    await cleanupScenario(request, scenario);
  }
});

test('listas reais carregam locais, equipamentos e usuários', async ({ page, request }) => {
  const scenario = await createScenario(request, `E2E lists ${Date.now()}`);
  try {
    await uiLogin(page, 'ADMIN');
    await page.goto('/app/sites');
    await expect(page.getByRole('heading', { name: 'Locais' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Cliente' }).click();
    await page.getByRole('option', { name: scenario.client.name, exact: true }).click();
    await expect(page.getByText(scenario.site.name, { exact: true })).toBeVisible();
    await page.goto('/app/equipment');
    await expect(page.getByRole('heading', { name: 'Equipamentos' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Cliente' }).click();
    await page.getByRole('option', { name: scenario.client.name, exact: true }).click();
    await page.getByRole('combobox', { name: 'Local' }).click();
    await page.getByRole('option', { name: scenario.site.name, exact: true }).click();
    await expect(page.getByText(scenario.equipment.name, { exact: true })).toBeVisible();
    await page.goto('/app/users');
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
    await expect(page.getByText('admin@fieldops.local', { exact: true })).toBeVisible();
  } finally {
    await cleanupScenario(request, scenario);
  }
});
