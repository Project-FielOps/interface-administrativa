import { request, FullConfig } from '@playwright/test';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const baseUrl = process.env.E2E_API_URL ?? 'http://localhost:8080/api/v1';
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, '/actuator/health');
  const context = await request.newContext();
  try {
    const deadline = Date.now() + 30_000;
    let lastError = 'no response';
    while (Date.now() < deadline) {
      try {
        const response = await context.get(healthUrl, { timeout: 2_000 });
        if (response.ok()) return;
        lastError = `HTTP ${response.status()}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(
      `Real API is required at ${healthUrl} and did not become healthy within 30s (${lastError}). ` +
        'Start API/.env-backed API and PostgreSQL before running Playwright.',
    );
  } finally {
    await context.dispose();
  }
}
