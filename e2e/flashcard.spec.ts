import { expect, test } from '@playwright/test';

test.describe('Flashcard view', () => {
  test('navigates from home to the flashcard view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '字卡', exact: true }).click();

    // Flashcard view shows level tabs and a per-card counter
    await expect(page.getByRole('button', { name: '初級', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '中級', exact: true })).toBeVisible();
    await expect(page.getByText(/^\d+\s*\/\s*\d+/)).toBeVisible();
  });

  test('flips the card with the space key to reveal the translation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '字卡', exact: true }).click();

    // Front hint is visible before flipping
    await expect(page.getByText('點擊翻面 / 空白鍵')).toBeVisible();

    await page.keyboard.press('Space');

    // Back hint replaces front hint after the flip
    await expect(page.getByText('再次點擊翻回正面')).toBeVisible();
  });

  test('下一張 advances to the next word', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '字卡', exact: true }).click();

    const counter = page.getByText(/^\d+\s*\/\s*\d+/);
    const before = (await counter.innerText()).split('/')[0].trim();

    await page.getByRole('button', { name: /下一張/ }).click();

    await expect
      .poll(async () => (await counter.innerText()).split('/')[0].trim())
      .not.toBe(before);
  });

  test('marking a word as 已學會 increments the home counter', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '字卡', exact: true }).click();

    // Click the green check on the card front
    await page.getByRole('button', { name: '已學會' }).click();

    // Go back home and verify the 已學會 stat is now 1
    await page.getByRole('button', { name: '首頁', exact: true }).click();
    const knownCard = page.getByText('已學會', { exact: true }).locator('..');
    await expect(knownCard.getByText('1', { exact: true })).toBeVisible();
  });
});
