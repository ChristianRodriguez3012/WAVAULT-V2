const { test, expect } = require('@playwright/test');

test.describe('E2E Productor->Cliente', () => {
  test('Página de login y endpoint /beats', async ({ page, request }) => {
    // Verifica que la página de login carga
    await page.goto('http://localhost:3000/login.html');
    await expect(page.locator('form')).toBeVisible();

    // Verifica que el endpoint /beats responde 200
    const resp = await request.get('http://localhost:3000/beats');
    expect(resp.status()).toBe(200);
  });
});
