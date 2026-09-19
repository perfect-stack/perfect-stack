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

setDefaultTimeout(30 * 1000);
setWorldConstructor(UIWorld);

let globalBrowser: Browser;

BeforeAll(async function () {
  globalBrowser = await chromium.launch({
    headless: process.env.HEADED !== 'true',
  });
});

Before(async function (this: UIWorld) {
  this.browser = globalBrowser;
  this.context = await globalBrowser.newContext();
  this.page = await this.context.newPage();
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

AfterAll(async function () {
  if (globalBrowser) {
    await globalBrowser.close();
  }
});
