import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { cleanupScenario, createScenario, uiLogin } from './support/real-api';

const visualOptions = {
  fullPage: true,
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  maskColor: '#f7f8f6',
  maxDiffPixelRatio: 0.02,
};

function stableVisualOptions(
  page: import('@playwright/test').Page,
  masks: import('@playwright/test').Locator[] = [],
) {
  return {
    ...visualOptions,
    mask: [...masks, page.locator('mat-progress-spinner')],
  };
}

async function expectAccessible(page: import('@playwright/test').Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(
    results.violations,
    results.violations.map((violation) => violation.id).join(', '),
  ).toEqual([]);
}

test.describe('FO-006 qualidade visual e acessibilidade', () => {
  test('login tem labels, foco por teclado, erro associado e snapshot', async ({ page }) => {
    await page.goto('/login');
    await expectAccessible(page);

    const email = page.getByLabel('E-mail');
    const password = page.getByRole('textbox', { name: 'Senha' });
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /senha/ })).toBeFocused();

    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('E-mail é obrigatório')).toBeVisible();
    await expect(page.getByText('Senha é obrigatória')).toBeVisible();
    await expect(page).toHaveScreenshot('fo-006-login.png', stableVisualOptions(page));
  });

  test('shell mantém landmark e foco no controle de navegação', async ({ page }) => {
    await uiLogin(page, 'ADMIN');
    await page.waitForLoadState('networkidle');
    await expectAccessible(page);
    await expect(page.locator('main')).toBeVisible();
    const navigationToggle = page.getByRole('button', { name: /navegação/ }).first();
    await navigationToggle.focus();
    await expect(navigationToggle).toBeFocused();
    await expect(page).toHaveScreenshot('fo-006-shell.png', stableVisualOptions(page));
  });

  test('dashboard real tem conteúdo acessível e snapshot estável', async ({ page, request }) => {
    const scenario = await createScenario(request, 'FO-006 visual dashboard');
    try {
      await uiLogin(page, 'ADMIN');
      await expect(page.getByRole('heading', { name: 'O que precisa de atenção' })).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expectAccessible(page);
      await expect(page).toHaveScreenshot('fo-006-dashboard.png', stableVisualOptions(page));
    } finally {
      await cleanupScenario(request, scenario);
    }
  });

  test('lista real expõe tabela, filtros nomeados e snapshot', async ({ page, request }) => {
    const scenario = await createScenario(request, 'FO-006 visual list');
    try {
      await uiLogin(page, 'ADMIN');
      await page.goto('/app/inspections?status=ASSIGNED&priority=HIGH&page=0&size=10');
      await expect(page.getByRole('heading', { name: 'Inspeções' })).toBeVisible();
      await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
      await expect(page.getByRole('table')).toHaveAttribute('aria-label', /inspeções/i);
      await page.waitForLoadState('networkidle');
      await expectAccessible(page);
      await expect(page).toHaveScreenshot(
        'fo-006-list.png',
        stableVisualOptions(page, [page.locator('tbody')]),
      );
    } finally {
      await cleanupScenario(request, scenario);
    }
  });

  test('detalhe real preserva a hierarquia de leitura e snapshot', async ({ page, request }) => {
    const scenario = await createScenario(request, 'FO-006 visual detail');
    try {
      await uiLogin(page, 'ADMIN');
      await page.goto(`/app/inspections/${scenario.inspection.id}`);
      await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Checklist e respostas' })).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expectAccessible(page);
      await expect(page).toHaveScreenshot(
        'fo-006-detail.png',
        stableVisualOptions(page, [page.locator('.fo-meta-card .fo-detail-grid')]),
      );
    } finally {
      await cleanupScenario(request, scenario);
    }
  });

  test('revisão real cobre foco no motivo obrigatório e snapshot', async ({ page, request }) => {
    const scenario = await createScenario(request, 'FO-006 visual review', true);
    try {
      await uiLogin(page, 'SUPERVISOR');
      await page.goto(`/app/inspections/${scenario.inspection.id}/review`);
      await expect(page.getByText(scenario.inspection.title, { exact: true })).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expectAccessible(page);
      await page.getByRole('button', { name: /Reprovar/ }).click();
      const reason = page.getByLabel('Motivo da reprovação');
      await reason.focus();
      await expect(reason).toBeFocused();
      await page.getByRole('button', { name: 'Confirmar reprovação' }).click();
      await expect(page.getByText('O motivo é obrigatório')).toBeVisible();
      await expect(page).toHaveScreenshot(
        'fo-006-review.png',
        stableVisualOptions(page, [page.locator('ol[aria-label="Histórico da inspeção"]')]),
      );
    } finally {
      await cleanupScenario(request, scenario);
    }
  });
});
