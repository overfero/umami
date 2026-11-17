import { test, expect } from '@playwright/test';
import { loginPage } from './helpers';
test.skip(!/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.PLAYWRIGHT_BASE_URL ?? ''), 'synthetic loopback fixture required');
test('visible update notice never obstructs New chat mouse or keyboard actions on desktop and narrow layout', async ({ page, request }) => {
  await loginPage(page, request);
  await page.route('https://api.umami.is/v1/updates*', route => route.fulfill({ json: { latest: '99.0.0', url: 'https://github.com/umami-software/umami/releases' } }));
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});await page.goto('/assistant');
    if(width===390)await page.getByRole('button',{name:'Chat history',exact:true}).click();
    const newChat=page.getByRole('button',{name:'New chat',exact:true}).and(page.locator('[data-slot="button"]'));
    const alert=page.getByRole('alert').filter({hasText:'A new version of Umami'});
    await expect(alert).toBeVisible();
    await newChat.click({timeout:5000});
    await expect(alert).toBeVisible();
    if (width === 390) await page.getByRole('button', { name: 'Chat history', exact: true }).click();
    await newChat.focus();await newChat.press('Enter');
    await expect(alert.getByRole('button',{name:'Dismiss',exact:true})).toBeVisible();
    await expect(alert.getByRole('button',{name:'View details',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
