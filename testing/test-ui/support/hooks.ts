import {
  BeforeAll,
  AfterAll,
  Before,
  After,
  Status,
  setWorldConstructor,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { chromium, Browser } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { UIWorld } from './world';
import { ensureBackendRunning, ensureFrontendRunning, stopServers } from './server-helper';

// When running in debug mode (PWDEBUG=1), disable step timeouts so you can step through without timing out
if (process.env.PWDEBUG === '1' || process.env.PAUSE === 'true') {
  setDefaultTimeout(-1);
} else {
  setDefaultTimeout(60 * 1000);
}

setWorldConstructor(UIWorld);

let globalBrowser: Browser;

BeforeAll({ timeout: 120 * 1000 }, async function () {
  await ensureBackendRunning();
  await ensureFrontendRunning();

  const isHeaded = process.env.HEADED === 'true' || process.env.PWDEBUG === '1';
  const slowMo = process.env.SLOW_MO
    ? parseInt(process.env.SLOW_MO, 10)
    : (process.env.HEADED === 'true' ? 500 : 0);

  globalBrowser = await chromium.launch({
    headless: !isHeaded,
    slowMo,
  });
});

Before(async function (this: UIWorld, scenario) {
  this.browser = globalBrowser;
  this.context = await globalBrowser.newContext({
    baseURL: this.baseUrl,
    viewport: { width: 1280, height: 720 },
  });

  this.consoleErrors = [];
  this.pageErrors = [];

  // Enable Playwright tracing for full diagnostic playback on failure
  await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  this.page = await this.context.newPage();

  // 1. Log browser console output and capture errors
  this.page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      this.consoleErrors.push(text);
    }
    console.log(`[Browser Console ${msg.type()}]: ${text}`);
  });

  // 2. Log unhandled JavaScript page errors
  this.page.on('pageerror', (err) => {
    this.pageErrors.push(err.message);
    console.error(`[Browser PageError]: ${err.message}`);
  });

  // 3. Log failed network requests (DNS, CORS, connection refused, 404, etc.)
  this.page.on('requestfailed', (req) => {
    console.error(`[Browser Request Failed]: ${req.method()} ${req.url()} (${req.failure()?.errorText || 'unknown error'})`);
  });

  // 4. Log HTTP 4xx / 5xx responses
  this.page.on('response', (res) => {
    if (res.status() >= 400) {
      console.error(`[Browser HTTP ${res.status()}]: ${res.request().method()} ${res.url()}`);
    }
  });
});

After(async function (this: UIWorld, scenario) {
  const isFailed = scenario.result?.status === Status.FAILED;

  if (isFailed && this.page) {
    const currentUrl = this.page.url();
    const pageTitle = await this.page.title().catch(() => 'unknown');
    console.error(`\n🚨 ==================== SCENARIO FAILED ====================`);
    console.error(`Scenario: "${scenario.pickle.name}"`);
    console.error(`Current URL: ${currentUrl}`);
    console.error(`Page Title:  ${pageTitle}`);

    if (this.pageErrors.length > 0) {
      console.error(`Uncaught Page Errors (${this.pageErrors.length}):`);
      for (const err of this.pageErrors) {
        console.error(`  - ${err}`);
      }
      this.attach(`Page Errors:\n${this.pageErrors.join('\n')}`, 'text/plain');
    }

    if (this.consoleErrors.length > 0) {
      console.error(`Browser Console Errors (${this.consoleErrors.length}):`);
      for (const err of this.consoleErrors) {
        console.error(`  - ${err}`);
      }
      this.attach(`Console Errors:\n${this.consoleErrors.join('\n')}`, 'text/plain');
    }

    try {
      const buttons = await this.page.locator('button, a.btn, input[type="button"], input[type="submit"]').allInnerTexts();
      console.error(`Visible Buttons (${buttons.length}):`, buttons.map((b) => b.trim()).filter(Boolean));
    } catch {}

    try {
      const bodyText = await this.page.locator('body').innerText();
      const snippet = bodyText.substring(0, 400).replace(/\s+/g, ' ');
      console.error(`Body snippet: "${snippet}"`);
    } catch {}

    try {
      const screenshot = await this.page.screenshot();
      this.attach(screenshot, 'image/png');
    } catch (e: any) {
      console.error('Failed to capture screenshot:', e.message);
    }
  }

  // Record Playwright trace archive on failure
  if (this.context) {
    if (isFailed) {
      const reportsDir = path.resolve(__dirname, '../reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      const safeName = scenario.pickle.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const tracePath = path.join(reportsDir, `trace-${safeName}.zip`);
      await this.context.tracing.stop({ path: tracePath });
      console.error(`Playwright Trace saved to: ${tracePath}`);
      console.error(`============================================================\n`);
    } else {
      await this.context.tracing.stop();
    }
    await this.context.close();
  }

  if (this.page) {
    await this.page.close();
  }
});

AfterAll({ timeout: 60 * 1000 }, async function () {
  if (globalBrowser) {
    await globalBrowser.close();
  }
  await stopServers();
});
