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
  const found = Array.isArray(list) && list.some((s: any) => s.scientific_name === speciesName || s.common_name === speciesName);
  if (!found) {
    let rootId: string | null = null;
    try {
      const rootResp = await makeApiRequest('GET', `/data/Species/tree`);
      if (rootResp && rootResp.id) {
        rootId = rootResp.id;
      }
    } catch {}

    if (!rootId) {
      const rootSave = await makeApiRequest('POST', `/data/Species`, {
        scientific_name: 'Animalia',
        common_name: 'Animals',
        rank: 'Kingdom',
        parent_id: null,
      });
      rootId = rootSave?.entity?.id;
    }

    await makeApiRequest('POST', `/data/Species`, {
      scientific_name: speciesName,
      common_name: speciesName,
      rank: 'Species',
      parent_id: rootId,
    });
  }
});

When('I click the {string} button', async function (this: UIWorld, buttonLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const slug = buttonLabel.toLowerCase().replace(/\s+/g, '-');
  const testIdMap: Record<string, string> = {
    'add pet': 'btn-add',
    'add': 'btn-add',
    'save details': 'btn-save',
    'save': 'btn-save',
    'edit pet': 'btn-edit',
    'edit': 'btn-edit',
    'delete': 'btn-delete',
    'search': 'btn-search',
    'reset': 'btn-reset',
    'cancel': 'btn-cancel',
    'back': 'btn-back',
  };

  const testId = testIdMap[buttonLabel.toLowerCase()] || `btn-${slug}`;
  const btn = this.page.getByTestId(testId)
    .or(this.page.getByTestId(`btn-tool-${buttonLabel}`))
    .or(this.page.getByRole('button', { name: buttonLabel }))
    .or(this.page.locator(`button:has-text("${buttonLabel}")`));

  const targetBtn = btn.first();
  await targetBtn.waitFor({ state: 'visible', timeout: 30000 });
  await targetBtn.click();
});

When('I enter {string} into the {string} field', async function (this: UIWorld, value: string, fieldName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const input = this.page.getByTestId(`input-${fieldName}`)
    .or(this.page.getByTestId(`datepicker-${fieldName}`))
    .or(this.page.locator(`input#${fieldName}, textarea#${fieldName}, input#${fieldName}_id`));

  const target = input.first();
  await target.waitFor({ state: 'visible', timeout: 30000 });
  await target.fill(value);
  await target.dispatchEvent('input');
  await target.dispatchEvent('change');
});

When('I select {string} from the {string} dropdown', async function (this: UIWorld, optionLabel: string, fieldName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const typeahead = this.page.getByTestId(`typeahead-${fieldName}`)
    .or(this.page.locator(`input#${fieldName}`));

  if (await typeahead.count() > 0 && await typeahead.first().isVisible()) {
    const target = typeahead.first();
    await target.fill(optionLabel.substring(0, 4));
    const dropdownItem = this.page.locator('ngb-typeahead-window button.dropdown-item, .dropdown-menu button.dropdown-item')
      .filter({ hasText: optionLabel })
      .first();
    await dropdownItem.waitFor({ state: 'visible', timeout: 10000 });
    await dropdownItem.click();
    return;
  }

  const select = this.page.getByTestId(`select-${fieldName}`)
    .or(this.page.getByTestId(`select-${fieldName}_id`))
    .or(this.page.locator(`select#${fieldName}, select#${fieldName}_id, select[name="${fieldName}"], select[name="${fieldName}_id"]`));

  const target = select.first();
  await target.waitFor({ state: 'visible', timeout: 30000 });
  await target.selectOption({ label: optionLabel });
  await target.dispatchEvent('change');
});

Then('I should see a success toast {string}', async function (this: UIWorld, toastMessage: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const toast = this.page.getByTestId('toast-success')
    .or(this.page.locator('.toast, app-toasts, .toast-body, ngb-toast'));

  const target = toast.filter({ hasText: toastMessage }).first();
  await target.waitFor({ state: 'visible', timeout: 30000 });
  const text = await target.textContent();
  expect(text).to.include(toastMessage);
});

Then('I should see {string} in the {string} field', async function (this: UIWorld, expectedValue: string, fieldName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const field = this.page.getByTestId(`view-${fieldName}`)
    .or(this.page.getByTestId(`input-${fieldName}`))
    .or(this.page.locator(`#${fieldName}, #${fieldName}_id`));

  const target = field.first();
  await target.waitFor({ state: 'visible', timeout: 30000 });

  const tagName = await target.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    const val = await target.inputValue();
    expect(val?.trim()).to.equal(expectedValue);
  } else {
    const text = await target.textContent();
    expect(text?.trim()).to.equal(expectedValue);
  }
});

When('I confirm the deletion dialog', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const confirmBtn = this.page.getByTestId('btn-dialog-delete')
    .or(this.page.locator('.modal-dialog .btn-danger, .modal-footer button:has-text("Delete")'));

  const target = confirmBtn.first();
  await target.waitFor({ state: 'visible', timeout: 30000 });
  await target.click();
});

Then('I should be on the search page', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  await this.page.waitForURL((url) => url.pathname.includes('/search'), { timeout: 30000 });
  expect(this.page.url()).to.include('/search');
});

Then('I should not see {string} in the search results table', async function (this: UIWorld, unexpectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  await this.page.waitForTimeout(1000);
  const table = this.page.getByTestId('table-results').or(this.page.locator('table.table'));
  if (await table.count() > 0) {
    const text = await table.first().textContent();
    expect(text || '').to.not.include(unexpectedText);
  } else {
    const bodyContent = await this.page.textContent('body');
    expect(bodyContent || '').to.not.include(unexpectedText);
  }
});
