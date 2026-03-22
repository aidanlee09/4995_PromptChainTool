import { test, expect } from '@playwright/test';

test('has title and logo', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Prompt Chain Tool/);

  // Check for the logo
  const logo = page.getByAltText('Next.js logo');
  await expect(logo).toBeVisible();
});
