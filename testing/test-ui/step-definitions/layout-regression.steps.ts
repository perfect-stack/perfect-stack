import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';

When('I click on the pet row for {string}', async function (this: UIWorld, petName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator('table tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${petName}\\s*$`) })
  }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  await this.page.waitForURL(/\/data\/Pet\/view/, { timeout: 15000 });
});

When('I click the {string} tab', async function (this: UIWorld, tabName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const tab = this.page.locator(`.tab-heading:has-text("${tabName}")`).first();
  await tab.waitFor({ state: 'visible', timeout: 15000 });
  await tab.click();
});

Then('I should see the {string} tab is active', async function (this: UIWorld, tabName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const activeTab = this.page.locator(`.tab-heading.border-primary:has-text("${tabName}")`).first();
  await activeTab.waitFor({ state: 'visible', timeout: 15000 });
  expect(await activeTab.isVisible()).to.be.true;
});

Then('I should see the single media control', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const ctrl = this.page.locator('lib-media-control').first();
  await ctrl.waitFor({ state: 'visible', timeout: 15000 });
  expect(await ctrl.isVisible()).to.be.true;
});

Then('I should see the media gallery control', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const ctrl = this.page.locator('lib-media-gallery-control').first();
  await ctrl.waitFor({ state: 'visible', timeout: 15000 });
  expect(await ctrl.isVisible()).to.be.true;
});

When('I click on the species row for {string}', async function (this: UIWorld, speciesName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator('table tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${speciesName}\\s*$`) })
  }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  await this.page.waitForURL(/\/data\/Species\/view/, { timeout: 15000 });
});

Then('I should see the nested child table', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const nestedTable = this.page.locator('table[data-testid="table-children"], table.table').first();
  await nestedTable.waitFor({ state: 'visible', timeout: 15000 });
  expect(await nestedTable.isVisible()).to.be.true;
});

Then('I should see {string} in the nested table', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const tableRow = this.page.locator('table tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${expectedText}\\s*$`) })
  }).first();
  await tableRow.waitFor({ state: 'visible', timeout: 15000 });
  expect(await tableRow.isVisible()).to.be.true;
});

When('I click on the child species row for {string}', async function (this: UIWorld, childName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const currentUrl = this.page.url();
  const row = this.page.locator('table tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${childName}\\s*$`) })
  }).first();
  await row.waitFor({ state: 'visible', timeout: 15000 });
  await row.click();
  // Wait until the URL changes to the child species view URL
  await this.page.waitForFunction((prevUrl) => window.location.href !== prevUrl, currentUrl, { timeout: 15000 });
});

When('I click on the owner row for {string}', async function (this: UIWorld, ownerName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator('table tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${ownerName}\\s*$`) })
  }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  await this.page.waitForURL(/\/data\/Owner\/view/, { timeout: 15000 });
});

Then('I should see the nested one-to-many {string} table', async function (this: UIWorld, bindingName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const table = this.page.locator(`lib-one-to-many-control table, table[data-testid="table-${bindingName}"]`).first();
  await table.waitFor({ state: 'visible', timeout: 15000 });
  expect(await table.isVisible()).to.be.true;
});

Then('I should see {string} in the {string} table', async function (this: UIWorld, expectedText: string, bindingName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const table = this.page.locator(`lib-one-to-many-control table, table[data-testid="table-${bindingName}"]`).first();
  const row = table.locator('tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${expectedText}\\s*$`) })
  }).first();
  await row.waitFor({ state: 'visible', timeout: 15000 });
  expect(await row.isVisible()).to.be.true;
});

When('I click on the pet row for {string} in the {string} table', async function (this: UIWorld, petName: string, bindingName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const table = this.page.locator(`lib-one-to-many-control table, table[data-testid="table-${bindingName}"]`).first();
  const row = table.locator('tbody tr').filter({
    has: this.page.locator('td', { hasText: new RegExp(`^\\s*${petName}\\s*$`) })
  }).first();
  await row.waitFor({ state: 'visible', timeout: 15000 });
  await row.click();
  await this.page.waitForURL(/\/data\/Pet\/view/, { timeout: 15000 });
});
