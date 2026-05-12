import { expect, test } from '@playwright/test';

// Force a deterministic starting state regardless of the OS preference.
test.use({ colorScheme: 'light' });

test.describe('Theme', () => {
  test('toggle switches dark class and persists across reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    // Starts in light mode
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);

    // Toggle to dark
    await page.getByRole('button', { name: /切換為深色/ }).click();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

    // Reload — dark mode should survive because of localStorage + index.html
    // inline FOUC-prevention script
    await page.reload();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

    // Verify localStorage was the source of truth
    const stored = await page.evaluate(() => window.localStorage.getItem('gept-theme'));
    expect(stored).toBe('dark');

    // Toggle back to light, reload again
    await page.getByRole('button', { name: /切換為淺色/ }).click();
    await page.reload();
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
  });
});
