import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('loads with title, stat cards, and progress bars', async ({ page }) => {
    await page.goto('/');

    // Page title
    await expect(page.getByRole('heading', { name: '全民英檢單字' })).toBeVisible();

    // Subtitle confirms the total word count is loaded from data
    await expect(page.getByText(/共\s*\d+\s*字/)).toBeVisible();

    // Three stat cards
    await expect(page.getByText('已學會', { exact: true })).toBeVisible();
    await expect(page.getByText('收藏', { exact: true })).toBeVisible();
    await expect(page.getByText('錯題', { exact: true })).toBeVisible();

    // Stats start at 0 for a fresh visit
    const knownStat = page
      .getByText('已學會', { exact: true })
      .locator('..')
      .getByText('0', { exact: true });
    await expect(knownStat).toBeVisible();

    // Learning progress card with both level rows
    await expect(page.getByRole('heading', { name: '學習進度' })).toBeVisible();
    await expect(page.getByText('初級', { exact: true })).toBeVisible();
    await expect(page.getByText('中級', { exact: true })).toBeVisible();
  });

  test('three primary nav entries are present', async ({ page }) => {
    await page.goto('/');
    // These are the big card-buttons in the body, not the tab nav
    await expect(page.getByRole('button', { name: /字卡學習/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /測驗模式/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /單字列表/ })).toBeVisible();
  });
});
