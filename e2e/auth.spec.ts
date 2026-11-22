import { expect, test } from '@playwright/test';
import { requireE2EPassword, uiLogin } from './support/real-api';

test('autentica contra a API real e carrega /auth/me', async ({ page }) => {
  await uiLogin(page, 'ADMIN');
  await expect(page.getByText('Olá, FieldOps Admin')).toBeVisible();
});

test('faz logout na API real e retorna ao login', async ({ page }) => {
  await uiLogin(page, 'ADMIN');
  await page.getByRole('button', { name: 'Abrir menu do usuário' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('solicita recuperação para uma conta seed sem revelar sua existência', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('admin@fieldops.local');
  await page.getByRole('button', { name: 'Enviar instruções' }).click();
  await expect(page.getByRole('status')).toContainText('Se houver uma conta ativa');
});

test('remove o token de reset da URL antes de qualquer submissão', async ({ page }) => {
  await page.goto('/reset-password?token=e2e-token');
  await expect(page).toHaveURL(/\/reset-password$/);
});

test('exibe erro de credencial inválida', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'E-mail ou senha inválidos.' }),
    }),
  );
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@fieldops.local');
  await page.getByRole('textbox', { name: 'Senha' }).fill('invalid');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos.');
});

test('informa token de reset inválido sem expor o valor', async ({ page }) => {
  await page.route('**/api/v1/auth/reset-password', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/reset-password?token=invalid-token');
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('Strong@123');
  await page
    .getByRole('textbox', { name: 'Confirme a nova senha', exact: true })
    .fill('Strong@123');
  await page.getByRole('button', { name: 'Redefinir senha' }).click();
  await expect(page.getByRole('alert')).toContainText('inválido, expirou ou já foi usado');
});

test('valida a troca de senha sem enviar senha fraca', async ({ page }) => {
  await uiLogin(page, 'ADMIN');
  await page.goto('/app/change-password');
  await page.getByLabel('Senha atual').fill(requireE2EPassword());
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('fraca');
  await page.getByRole('textbox', { name: 'Confirme a nova senha', exact: true }).fill('diferente');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(
    page.locator('mat-error').filter({ hasText: 'ao menos 8 caracteres' }),
  ).toBeVisible();
});
