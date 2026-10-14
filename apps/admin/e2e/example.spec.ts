import { test, expect } from '@playwright/test';

test.describe('Example E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Nove Admin/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
