import { expect, test } from '@playwright/test';
import { confirmDialog, dot, openApp, reload, saved } from './helpers';

test.describe('set tracking', () => {
  test('ticking a set marks it done, counts it everywhere and survives a reload', async ({ page }) => {
    await openApp(page, '#legsA');
    await dot(page, 'legs-a1', 1).click();

    await expect(dot(page, 'legs-a1', 1)).toHaveClass(/done/);
    await expect(page.locator('#ringTextLegsA')).toHaveText('1/21');
    await expect(page.locator('#countLegsA')).toHaveText('1/21 sets');
    await expect(page.locator('#masterRingSets')).toHaveText('1/132 sets');
    await expect(page.locator('#mbProgress')).toContainText('1/21');
    expect((await saved(page)).doneMap).toEqual({ 'legs-a1-set1': true });

    await reload(page);
    await expect(dot(page, 'legs-a1', 1)).toHaveClass(/done/);
    await expect(page.locator('#countLegsA')).toHaveText('1/21 sets');
  });

  test('ticking it again unticks it', async ({ page }) => {
    await openApp(page, '#legsA');
    await dot(page, 'legs-a1', 1).click();
    await dot(page, 'legs-a1', 1).click();
    await expect(dot(page, 'legs-a1', 1)).not.toHaveClass(/done/);
    await expect(page.locator('#countLegsA')).toHaveText('0/21 sets');
    expect((await saved(page)).doneMap).toEqual({});
  });

  test('Reset Day asks first, clears the day, and Undo brings it back', async ({ page }) => {
    await openApp(page, '#legsA');
    await dot(page, 'legs-a1', 1).click();
    await dot(page, 'legs-a2', 1).click();

    await page.locator('#legsA').getByRole('button', { name: /^Reset/ }).first().click();
    await confirmDialog(page);
    await expect(page.locator('#legsA .set-dot.done')).toHaveCount(0);
    await expect(page.locator('#countLegsA')).toHaveText('0/21 sets');

    const toast = page.locator('#toastStack .toast').filter({ hasText: 'Reset' });
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('#legsA .set-dot.done')).toHaveCount(2);
    await expect(page.locator('#countLegsA')).toHaveText('2/21 sets');
  });

  test('Reset Entire Week clears every day and moves to the next training week', async ({ page }) => {
    await openApp(page, '#legsA');
    await expect(page.locator('#mesocycleBanner')).toHaveText('Week 1 of 6');
    await dot(page, 'legs-a1', 1).click();

    await page.getByRole('button', { name: 'Reset Entire Week' }).click();
    await confirmDialog(page);
    await expect(page.locator('.set-dot.done')).toHaveCount(0);
    await expect(page.locator('#masterRingSets')).toHaveText('0/132 sets');
    await expect(page.locator('#mesocycleBanner')).toHaveText('Week 2 of 6');
  });

  test('week 6 is the deload, then it starts again at week 1', async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__w')) { sessionStorage.setItem('__w', '1'); localStorage.setItem('hb_mesocycleWeek_v1', '6'); }
    });
    await openApp(page);
    await expect(page.locator('#mesocycleBanner')).toHaveText('Week 6 of 6 — Deload: drop sets, skip failure work');
    await page.getByRole('button', { name: 'Reset Entire Week' }).click();
    await confirmDialog(page);
    await expect(page.locator('#mesocycleBanner')).toHaveText('Week 1 of 6');
  });
});

test.describe('days and addresses', () => {
  test('#pushB opens Push day B, and stays there after a reload', async ({ page }) => {
    await openApp(page, '#pushB');
    await expect(page.locator('#pushB')).toHaveClass(/active/);
    await expect(page.locator('body')).toHaveAttribute('data-group', 'push');
    await reload(page);
    await expect(page.locator('#pushB')).toHaveClass(/active/);
  });

  test('the group and day buttons switch days and update the address', async ({ page }) => {
    await openApp(page, '#legsA');
    await page.locator('#groupTabs [data-tab-group="pull"]').click();
    await expect(page.locator('#pullA')).toHaveClass(/active/);
    await expect(page).toHaveURL(/#pullA$/);

    await page.locator('#btnDayB').click();
    await expect(page.locator('#pullB')).toHaveClass(/active/);
    await expect(page).toHaveURL(/#pullB$/);
    await expect(page.locator('#heroTitle')).toContainText('PROTOCOL');
  });
});
