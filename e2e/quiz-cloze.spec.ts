import { expect, test } from '@playwright/test';

test.describe('Quiz cloze (例句填空)', () => {
  test('complete one cloze quiz question from setup', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '測驗', exact: true }).click();

    // Setup screen visible
    await expect(page.getByRole('heading', { name: /題型/ })).toBeVisible();

    // Deselect the default '英選中' chip
    await page.getByRole('button', { name: /英選中/ }).click();

    // Select '例句填空'
    await page.getByRole('button', { name: /例句填空/ }).click();

    // Start
    await page.getByRole('button', { name: '開始測驗' }).click();

    // First cloze question is rendered with a blank
    await expect(page.getByText(/第\s*1\s*\/\s*10\s*題/)).toBeVisible();
    await expect(page.locator('text=______').first()).toBeVisible();

    // Pick option 1 via keyboard
    await page.keyboard.press('1');

    // After selecting, '下一題' or '看結果' becomes visible
    await expect(page.getByRole('button', { name: /下一題|看結果/ })).toBeVisible();
  });

  test('showClozeHint toggle reveals Chinese hint under the prompt', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '測驗', exact: true }).click();

    // Deselect default 英選中 and select 例句填空
    await page.getByRole('button', { name: /英選中/ }).click();
    await page.getByRole('button', { name: /例句填空/ }).click();

    // The hint toggle only appears when cloze is selected
    const toggle = page.getByRole('checkbox', { name: /例句填空時顯示中文提示/ });
    await expect(toggle).toBeVisible();
    await toggle.check();

    await page.getByRole('button', { name: '開始測驗' }).click();

    // First question is rendered
    await expect(page.locator('text=______').first()).toBeVisible();

    // The Chinese hint paragraph (with CJK characters) should be visible inside the prompt card
    const promptCard = page.locator('.bg-surface').filter({ hasText: '______' }).first();
    await expect(
      promptCard
        .locator('p')
        .filter({ hasText: /[一-鿿]/ })
        .first(),
    ).toBeVisible();
  });
});
