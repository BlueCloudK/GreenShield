import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { createApp } from '../server/app.js';
import { createDatabase } from '../server/db/index.js';
import { registerUser } from '../server/auth.js';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';

// Isolated in-memory database and provider: never invokes the live PayOS API.
const db = await createDatabase(':memory:');
const user = await registerUser(db, { name: 'Payment review', email: 'payment-ui@example.com', password: 'Local-review-only-482!' });
await db.prepare('UPDATE users SET email_verified_at=? WHERE id=?').run(new Date().toISOString(), user.id);
const server = createServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const app = await createApp({ db, paymentEnv: {
  NODE_ENV: 'test', PAYOS_ENABLED: 'true', SUBSCRIPTION_CHECKOUT_ENABLED: 'true',
  PAYOS_PUBLIC_ORIGIN: base, PAYOS_CLIENT_ID: 'fixture', PAYOS_API_KEY: 'fixture', PAYOS_CHECKSUM_KEY: 'fixture',
}, payosClient: { paymentRequests: { create: async input => ({ orderCode: input.orderCode, amount: input.amount, currency: 'VND', paymentLinkId: 'ui-fixture-link', checkoutUrl: 'https://pay.payos.vn/web/ui-fixture-link' }) } } });
server.on('request', app);
const browser = await chromium.launch();
try {
  await mkdir('artifacts/payments', { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/login?mode=login`);
  await page.locator('input[name="email"]').fill('payment-ui@example.com');
  await page.locator('input[type="password"]').fill('Local-review-only-482!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/app');
  await page.goto(`${base}/app/billing?plan=team`);
  await page.locator('#subscription-plan').waitFor();
  assert.equal(await page.locator('#subscription-plan').inputValue(), 'team');
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Tạo đơn PayOS' }).click();
  await page.getByRole('link', { name: 'Mở PayOS' }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Mở PayOS' }).getAttribute('href'), 'https://pay.payos.vn/web/ui-fixture-link');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `artifacts/payments/billing-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('Team checkout and QR link verified at desktop/mobile with in-memory provider; no external payment calls.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  await db.close();
}
