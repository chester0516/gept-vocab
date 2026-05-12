import { expect, test } from '@playwright/test';

test.describe('Quiz', () => {
  test('shows setup screen with 開始測驗 available by default', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '測驗', exact: true }).click();

    await expect(page.getByRole('heading', { name: '等級' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /題型/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '開始測驗' })).toBeEnabled();
  });

  test('full flow: setup → answer 10 questions → result screen', async ({ page }) => {
    test.slow(); // 10 questions can take a moment, especially on mobile-chrome
    await page.goto('/');
    await page.getByRole('button', { name: '測驗', exact: true }).click();

    // Defaults: elementary, en2zh only, 10 questions, source=all
    await page.getByRole('button', { name: '開始測驗' }).click();

    // First question is rendered
    await expect(page.getByText(/第\s*1\s*\/\s*10\s*題/)).toBeVisible();

    // Answer all 10 via keyboard: press '1' to pick option 1, Enter to advance
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('1');
      // After selecting, '下一題' or '看結果' becomes visible
      await page.keyboard.press('Enter');
    }

    // Result screen
    await expect(page.getByText('本次得分')).toBeVisible();
    await expect(page.getByText(/答對\s*\d+\s*\/\s*10/)).toBeVisible();
    await expect(page.getByRole('button', { name: /回到首頁|再來一輪/ }).first()).toBeVisible();
  });
});
