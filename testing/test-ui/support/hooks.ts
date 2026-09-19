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
import { UIWorld } from './world';
import { ensureBackendRunning, ensureFrontendRunning, stopServers } from './server-helper';

// When running in debug mode (PWDEBUG=1), disable step timeouts so you can step through without timing out
if (process.env.PWDEBUG === '1' || process.env.PAUSE === 'true') {
  setDefaultTimeout(-1);
} else {
  setDefaultTimeout(30 * 1000);
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

Before(async function (this: UIWorld) {
  this.browser = globalBrowser;
  this.context = await globalBrowser.newContext();
  this.page = await this.context.newPage();

  this.page.on('console', (msg) => {
    console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`);
  });
  this.page.on('pageerror', (err) => {
    console.error(`[Browser PageError]: ${err.message}`);
  });
});

After(async function (this: UIWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
  }

  if (this.page) {
    await this.page.close();
  }
  if (this.context) {
    await this.context.close();
  }
});

AfterAll({ timeout: 60 * 1000 }, async function () {
  if (globalBrowser) {
    await globalBrowser.close();
  }
  await stopServers();
});
