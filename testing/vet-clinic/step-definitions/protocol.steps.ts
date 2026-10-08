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

Then('I should see the tree node {string}', async function (this: UIWorld, nodeName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const node = this.page.locator('.ps-tree-node-link').filter({ hasText: nodeName }).first();
  await node.waitFor({ state: 'visible', timeout: 30000 });
  expect(await node.isVisible()).to.be.true;
});

Then('I should not see the tree node {string}', async function (this: UIWorld, nodeName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const node = this.page.locator('.ps-tree-node-link').filter({ hasText: nodeName });
  const count = await node.count();
  if (count > 0) {
    expect(await node.first().isVisible()).to.be.false;
  }
});

When('I click the tree node {string}', async function (this: UIWorld, nodeName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const node = this.page.locator('.ps-tree-node-link').filter({ hasText: nodeName }).first();
  await node.waitFor({ state: 'visible', timeout: 30000 });
  await node.click();
});

When('I expand the tree node {string}', async function (this: UIWorld, nodeName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const row = this.page.locator('.ps-tree-node-row').filter({ hasText: nodeName }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  const toggleBtn = row.locator('.ps-tree-toggle-btn');
  await toggleBtn.click();
});

Then('I should see the tree badge {string} on node {string}', async function (this: UIWorld, badgeText: string, nodeName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const row = this.page.locator('.ps-tree-node-row').filter({ hasText: nodeName }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  const badge = row.locator('.ps-tree-badge').filter({ hasText: badgeText }).first();
  expect(await badge.isVisible()).to.be.true;
});

Then('I should see the tree badge {string} on node {string} with color class {string}', async function (this: UIWorld, badgeText: string, nodeName: string, colorClass: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const row = this.page.locator('.ps-tree-node-row').filter({ hasText: nodeName }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  const badge = row.locator('.ps-tree-badge').filter({ hasText: badgeText }).first();
  expect(await badge.isVisible()).to.be.true;
  const classes = await badge.getAttribute('class');
  expect(classes).to.include(colorClass);
});

Then('I should see the detail panel header {string}', async function (this: UIWorld, expectedHeader: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const header = this.page.locator('.ps-tree-detail-header h4').filter({ hasText: expectedHeader }).first();
  await header.waitFor({ state: 'visible', timeout: 30000 });
  expect(await header.isVisible()).to.be.true;
});

Then('I should see the edit node button for {string}', async function (this: UIWorld, entityType: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator('#editNodeBtn').filter({ hasText: `Edit ${entityType}` }).first();
  await btn.waitFor({ state: 'visible', timeout: 30000 });
  expect(await btn.isVisible()).to.be.true;
});

When('I click the edit node button', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator('#editNodeBtn').first();
  await btn.waitFor({ state: 'visible', timeout: 30000 });
  await btn.click();
  const saveBtn = this.page.locator('#saveNodeBtn').first();
  await saveBtn.waitFor({ state: 'visible', timeout: 30000 });
});

Then('I should see the save node button', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator('#saveNodeBtn').first();
  await btn.waitFor({ state: 'visible', timeout: 30000 });
  expect(await btn.isVisible()).to.be.true;
});

When('I click the save node button', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator('#saveNodeBtn').first();
  await btn.waitFor({ state: 'visible', timeout: 30000 });
  await btn.click();
  const editBtn = this.page.locator('#editNodeBtn').first();
  await editBtn.waitFor({ state: 'visible', timeout: 30000 });
});

When('I click the cancel edit node button', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator('#cancelEditNodeBtn').first();
  await btn.waitFor({ state: 'visible', timeout: 30000 });
  await btn.click();
  const editBtn = this.page.locator('#editNodeBtn').first();
  await editBtn.waitFor({ state: 'visible', timeout: 30000 });
});

Then('I should see the unsaved changes dialog', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const title = this.page.locator('.modal-dialog .modal-title, lib-message-dialog .modal-title, [data-testid="modal-title"]').filter({ hasText: 'Unsaved Changes' }).first();
  await title.waitFor({ state: 'visible', timeout: 15000 });
  expect(await title.isVisible()).to.be.true;
});

When('I click {string} in the dialog', async function (this: UIWorld, actionName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator(`.modal-footer button, [data-testid="btn-dialog-${actionName.toLowerCase()}"]`).filter({ hasText: actionName }).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
  await this.page.locator('.modal-dialog').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
});

Then('the nested one-to-many {string} table should have exactly {int} instance', async function (this: UIWorld, bindingName: string, count: number) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const tables = this.page.locator(`table[data-testid="table-${bindingName}"]`);
  expect(await tables.count()).to.equal(count);
});

Then('the nested one-to-many {string} table should have {int} rows', async function (this: UIWorld, bindingName: string, expectedRows: number) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const rows = this.page.locator(`table[data-testid="table-${bindingName}"] tbody tr`);
  await rows.first().waitFor({ state: 'visible', timeout: 15000 });
  expect(await rows.count()).to.equal(expectedRows);
});

Then('each row in the {string} table should be unique', async function (this: UIWorld, bindingName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const rows = this.page.locator(`table[data-testid="table-${bindingName}"] tbody tr`);
  const rowCount = await rows.count();
  const seenTexts = new Set<string>();
  for (let i = 0; i < rowCount; i++) {
    const firstCell = rows.nth(i).locator('td').first();
    const input = firstCell.locator('input');
    let text: string;
    if (await input.count() > 0) {
      text = (await input.inputValue()).trim();
    } else {
      text = (await firstCell.innerText()).trim();
    }
    expect(seenTexts.has(text), `Row duplicate found: "${text}" in table "${bindingName}"`).to.be.false;
    seenTexts.add(text);
  }
});
