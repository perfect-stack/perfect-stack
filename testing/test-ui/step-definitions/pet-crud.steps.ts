import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';
import * as http from 'http';

function makeApiRequest(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3080,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch {
            resolve(data);
          }
        });
      },
    );
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

Given('a species {string} exists in the registry', async function (this: UIWorld, speciesName: string) {
  // Clean up any existing test pets with 'Barnaby'
  const petsResp = await makeApiRequest('GET', `/data/Pet`);
  const petList = petsResp?.resultList || petsResp || [];
  if (Array.isArray(petList)) {
    for (const pet of petList) {
      if (pet.name && pet.name.includes('Barnaby')) {
        await makeApiRequest('DELETE', `/data/Pet/${pet.id}`);
      }
    }
  }

  const existing = await makeApiRequest('GET', `/data/Species`);
  const list = existing?.resultList || existing || [];
  const found = Array.isArray(list) && list.some((s: any) => s.name === speciesName);
  if (!found) {
    await makeApiRequest('POST', `/data/Species`, {
      name: speciesName,
      sort_index: 1,
    });
  }
});

When('I click the {string} button', async function (this: UIWorld, buttonLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const idMap: Record<string, string> = {
    'Add Pet': '#addBtn',
    'Add': '#addBtn',
    'Save details': '#saveBtn',
    'Save': '#saveBtn',
    'Edit Pet': '#editBtn',
    'Edit': '#editBtn',
    'Delete': '#deleteBtn',
    'Search': '#searchBtn',
    'Reset': '#resetBtn',
    'Cancel': '#cancelBtn',
  };

  const selector = idMap[buttonLabel] || `button:has-text("${buttonLabel}")`;
  const btn = this.page.locator(selector).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
});

When('I enter {string} into the {string} field', async function (this: UIWorld, value: string, fieldName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const input = this.page.locator(`input#${fieldName}, textarea#${fieldName}, input#${fieldName}_id`).first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
});

When('I select {string} from the {string} dropdown', async function (this: UIWorld, optionLabel: string, fieldName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const select = this.page
    .locator(`select#${fieldName}, select#${fieldName}_id, select[name="${fieldName}"], select[name="${fieldName}_id"]`)
    .first();
  await select.waitFor({ state: 'visible', timeout: 10000 });
  await select.selectOption({ label: optionLabel });
  await select.dispatchEvent('change');
});

Then('I should see a success toast {string}', async function (this: UIWorld, toastMessage: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const toast = this.page.locator('.toast, app-toasts, .toast-body, ngb-toast').filter({ hasText: toastMessage }).first();
  await toast.waitFor({ state: 'visible', timeout: 10000 });
  const text = await toast.textContent();
  expect(text).to.include(toastMessage);
});

Then('I should see {string} in the {string} field', async function (this: UIWorld, expectedValue: string, fieldName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const field = this.page.locator(`#${fieldName}, #${fieldName}_id`).first();
  await field.waitFor({ state: 'visible', timeout: 10000 });

  const tagName = await field.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    const val = await field.inputValue();
    expect(val?.trim()).to.equal(expectedValue);
  } else {
    const text = await field.textContent();
    expect(text?.trim()).to.equal(expectedValue);
  }
});

When('I confirm the deletion dialog', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const confirmBtn = this.page.locator('.modal-dialog .btn-danger, .modal-footer button:has-text("Delete")').first();
  await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
  await confirmBtn.click();
});

Then('I should be on the search page', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  await this.page.waitForURL(/.*\/search/, { timeout: 10000 });
  const url = this.page.url();
  expect(url).to.include('/search');
});

Then('I should see {string} in the search results table', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const cell = this.page.locator('table tbody tr').filter({ hasText: expectedText }).first();
  await cell.waitFor({ state: 'visible', timeout: 10000 });
  expect(await cell.isVisible()).to.be.true;
});

Then('I should not see {string} in the search results table', async function (this: UIWorld, unexpectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  await this.page.waitForTimeout(500);
  const matchingRows = this.page.locator('table tbody tr').filter({ hasText: unexpectedText });
  const count = await matchingRows.count();
  expect(count).to.equal(0);
});
