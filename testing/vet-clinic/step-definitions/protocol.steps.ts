import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';

When('I click on the protocol row for {string}', async function (this: UIWorld, name: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator(`table tbody tr:has-text("${name}")`).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  await this.page.waitForURL(/\/data\/Protocol\/view/, { timeout: 15000 });
});

When('I click on the activity template row for {string}', async function (this: UIWorld, name: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator(`table tbody tr:has-text("${name}")`).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  await this.page.waitForURL(/\/data\/ActivityTemplate\/view/, { timeout: 15000 });
});

When('I click on the assertion type row for {string}', async function (this: UIWorld, name: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator(`table tbody tr:has-text("${name}")`).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  await this.page.waitForURL(/\/data\/AssertionType\/view/, { timeout: 15000 });
});

Then('I should see {string} in the search results table', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const cell = this.page.locator('table tbody tr td').filter({
    hasText: new RegExp(`^\\s*${expectedText}\\s*$`),
  }).first();
  await cell.waitFor({ state: 'visible', timeout: 30000 });
  expect(await cell.isVisible()).to.be.true;
});
