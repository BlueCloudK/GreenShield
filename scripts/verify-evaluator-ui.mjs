import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { createDatabase } from '../server/db/index.js';
import { registerUser } from '../server/auth.js';

const base = process.argv[2] || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const created = [];
const db = await createDatabase();
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const email = `evaluator-ui-${crypto.randomUUID()}@example.com`;
    const password = crypto.randomBytes(24).toString('base64url');
    const user = await registerUser(db, { name: 'UI verification', email, password });
    created.push({ id: user.id, workspace: user.workspace.id, email });
    assert.equal((await context.request.post(`${base}/api/auth/login`, { data: { email, password } })).status(), 200);
    await page.goto(`${base}/app/evaluator`);
    await page.getByRole('heading', { name: 'Đánh giá chatbot', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Kiểm tra kết nối', exact: true }).click();
    await page.getByText('Kết nối thành công', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Chạy benchmark', exact: true }).click();
    const report = page.locator('section[aria-label="Báo cáo benchmark"]');
    await report.waitFor();
    assert.ok((await report.textContent()).includes('Fixture demo'));
    await report.getByRole('button', { name: 'Multiplication', exact: true }).click();
    await report.getByRole('heading', { name: 'Multiplication', exact: true }).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/deploy/evaluator-${viewport.width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, `Page overflow at ${viewport.width}`);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất JSON', exact: true }).click();
    await (await downloaded).saveAs(`artifacts/deploy/evaluator-${viewport.width}.json`);
    await page.getByRole('radio', { name: 'Endpoint thật', exact: true }).check();
    await page.getByLabel('Endpoint URL', { exact: true }).fill('https://api.example.com/chat');
    await page.screenshot({ path: `artifacts/deploy/evaluator-config-${viewport.width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(JSON.stringify({ viewport: viewport.width, fixture: 'completed', inspector: true, jsonExport: true, overflow: false }));
  }
} finally {
  await browser.close();
  try {
    for (const account of created) {
      const row = await db.prepare('SELECT id FROM users WHERE id=? AND email=?').get(account.id, account.email);
      if (!row) continue;
      await db.transaction(async () => {
        await db.prepare('DELETE FROM workspaces WHERE id=?').run(account.workspace);
        await db.prepare('DELETE FROM users WHERE id=? AND email=?').run(account.id, account.email);
      })();
    }
  } finally { await db.close(); }
}
