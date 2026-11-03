import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';

Then('the showcase header should display {string}', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const heading = this.page.getByTestId('showcase-heading');
  await heading.filter({ hasText: expectedText }).waitFor({ state: 'visible', timeout: 15000 });
  const text = (await heading.textContent())?.trim();
  expect(text).to.equal(expectedText);
});

Then('the text field input should contain {string}', async function (this: UIWorld, expectedValue: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.getByTestId('input-sample_text');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  const val = await input.inputValue();
  expect(val).to.equal(expectedValue);
});

When('I enter {string} into the text field input', async function (this: UIWorld, value: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.getByTestId('input-sample_text');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(value);
});

Then('the form state inspector should show value {string}', async function (this: UIWorld, expectedValue: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const inspector = this.page.getByTestId('inspector-value');
  await inspector.filter({ hasText: expectedValue }).waitFor({ state: 'visible', timeout: 15000 });
  const text = await inspector.textContent();
  expect(text).to.include(expectedValue);
});

When('I click the showcase button {string}', async function (this: UIWorld, testId: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  await this.page.getByTestId('showcase-heading').waitFor({ state: 'visible', timeout: 15000 });
  const btn = this.page.getByTestId(testId);
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

Then('the text field should display read-only text {string}', async function (this: UIWorld, expectedValue: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewSpan = this.page.getByTestId('view-sample_text');
  await viewSpan.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewSpan.textContent())?.trim();
  expect(text).to.equal(expectedValue);
});

Then('the text field should show validation error styling', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const invalidInput = this.page.locator('[data-testid="input-sample_text"].ng-invalid');
  await invalidInput.waitFor({ state: 'visible', timeout: 15000 });
  expect(await invalidInput.isVisible()).to.be.true;
});

Then('the text field should not show validation error styling', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const validInput = this.page.locator('[data-testid="input-sample_text"]:not(.ng-invalid)');
  await validInput.waitFor({ state: 'visible', timeout: 15000 });
  expect(await validInput.isVisible()).to.be.true;
});

Then('the text field should display validation message {string}', async function (this: UIWorld, expectedMessage: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const errorLabel = this.page.locator('lib-validation-result-label, [data-testid="error-validation"], .validation-result').first();
  await errorLabel.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await errorLabel.textContent())?.trim();
  expect(text).to.include(expectedMessage);
});

Then('the form state inspector status should be {string}', async function (this: UIWorld, expectedStatus: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const statusEl = this.page.getByTestId('inspector-status');
  await statusEl.filter({ hasText: expectedStatus }).waitFor({ state: 'visible', timeout: 15000 });
  const text = await statusEl.textContent();
  expect(text).to.include(expectedStatus);
});

// -----------------------------------------------------------------------------
// Pickers & Primitives Step Definitions
// -----------------------------------------------------------------------------

Then('the boolean checkbox view should display {string}', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-boolean-check-box-control [data-testid^="view-"]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.textContent())?.trim();
  expect(text).to.equal(expectedText);
});

Then('the checkbox element should be visible and checked', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const checkbox = this.page.locator('input[type="checkbox"][data-testid^="checkbox-"], input[type="checkbox"]#is_active').first();
  await checkbox.waitFor({ state: 'visible', timeout: 15000 });
  expect(await checkbox.isChecked()).to.be.true;
});

Then('the text area should display formatted view text', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-text-area-control [data-testid^="view-"]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.textContent())?.trim();
  expect(text).to.not.be.empty;
});

Then('the text area editor should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const editor = this.page.locator('lib-text-area-control editor, lib-text-area-control .tox-tinymce, lib-text-area-control textarea').first();
  await editor.waitFor({ state: 'visible', timeout: 15000 });
  expect(await editor.isVisible()).to.be.true;
});

Then('the URL view link should be visible with text {string}', async function (this: UIWorld, expectedUrl: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const link = this.page.locator('lib-url-field-control [data-testid^="view-"]').first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await link.textContent())?.trim();
  expect(text).to.include(expectedUrl);
});

Then('the URL input should be editable and contain {string}', async function (this: UIWorld, expectedUrl: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.locator('lib-url-field-control input').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  const val = await input.inputValue();
  expect(val).to.equal(expectedUrl);
});

Then('the date picker view should display formatted date {string}', async function (this: UIWorld, expectedDate: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('app-date-picker-control [data-testid^="view-"], app-date-picker-control input').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.inputValue?.().catch(() => '')) || (await viewEl.textContent())?.trim() || '';
  expect(text).to.include(expectedDate);
});

Then('the date picker input should contain {string}', async function (this: UIWorld, expectedDate: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.locator('app-date-picker-control input').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  const val = await input.inputValue();
  expect(val).to.equal(expectedDate);
});

Then('the date time view should display formatted date and time', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-date-time-control [data-testid^="view-"]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.textContent())?.trim() || '';
  expect(text).to.not.be.empty;
});

Then('the date time input should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.locator('lib-date-time-control input, lib-date-time-control .input-group').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  expect(await input.isVisible()).to.be.true;
});

Then('the time input should not be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const timeInput = this.page.locator('lib-date-time-control lib-time-control');
  expect(await timeInput.count()).to.equal(0);
});

Then('the date time view should display formatted date', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-date-time-control [data-testid^="view-"]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.textContent())?.trim() || '';
  expect(text).to.not.be.empty;
  expect(text).to.not.include(':');
});

When('I click the showcase sample preset {string}', async function (this: UIWorld, label: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const presetBtn = this.page.locator(`[data-testid="btn-preset-${label}"]`);
  const btn = (await presetBtn.count()) > 0
    ? presetBtn.first()
    : this.page.locator(`button:has-text('"${label}"'), button:has-text("${label}")`).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

Then('the clock button should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const clockBtn = this.page.locator('lib-date-time-control [data-testid^="btn-add-time-"]').first();
  await clockBtn.waitFor({ state: 'visible', timeout: 15000 });
  expect(await clockBtn.isVisible()).to.be.true;
});

When('I click the clock button to add time', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const clockBtn = this.page.locator('lib-date-time-control [data-testid^="btn-add-time-"]').first();
  await clockBtn.waitFor({ state: 'visible', timeout: 15000 });
  await clockBtn.click();
});

Then('the time control view should display formatted time', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-time-control [data-testid^="time-\"], lib-time-control input').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.inputValue?.().catch(() => '')) || (await viewEl.textContent())?.trim() || '';
  expect(text).to.not.be.empty;
});

Then('the time input should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.locator('lib-time-control input, lib-time-control select, lib-time-control .input-group').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  expect(await input.isVisible()).to.be.true;
});

Then('the color band view should display the active color swatch', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const swatch = this.page.locator('lib-colour-band-component .colour-band-preview, lib-colour-band-component .color-swatch, lib-colour-band-component [data-testid^="view-"]').first();
  await swatch.waitFor({ state: 'visible', timeout: 15000 });
  expect(await swatch.isVisible()).to.be.true;
});

Then('the color band interactive input should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const control = this.page.locator('lib-colour-band-component input, lib-colour-band-component button').first();
  await control.waitFor({ state: 'visible', timeout: 15000 });
  expect(await control.isVisible()).to.be.true;
});

// FlexibleDateTimeControl Steps
Then('the flexible date time picker inputs should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.locator('lib-flexible-date-time-control input, lib-flexible-date-time-control .flexible-time-input-field').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  expect(await input.isVisible()).to.be.true;
});

Then('the flexible date time view should display formatted value', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-flexible-date-time-control [data-testid^="view-"]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.textContent())?.trim();
  expect(text).to.not.be.empty;
});

// -----------------------------------------------------------------------------
// Selections & Badges Step Definitions
// -----------------------------------------------------------------------------

Then('the enumeration select should contain option {string}', async function (this: UIWorld, expectedOption: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const opt = this.page.locator(`lib-enumeration-control select option:has-text("${expectedOption}")`).first();
  await opt.waitFor({ state: 'attached', timeout: 15000 });
  expect(await opt.count()).to.be.greaterThan(0);
});

When('I select {string} in the enumeration dropdown', async function (this: UIWorld, optionToSelect: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const select = this.page.locator('lib-enumeration-control select').first();
  await select.waitFor({ state: 'visible', timeout: 15000 });
  await select.selectOption({ label: optionToSelect });
});

Then('the enumeration view should display {string}', async function (this: UIWorld, expectedValue: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewInput = this.page.locator('lib-enumeration-control input[readonly]').first();
  await viewInput.waitFor({ state: 'visible', timeout: 15000 });
  const val = await viewInput.inputValue();
  expect(val).to.equal(expectedValue);
});

Then('the pipe list should contain selected tag {string}', async function (this: UIWorld, expectedTag: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badge = this.page.locator(`lib-pipe-list-control [data-testid^="selected-item-"]:has-text("${expectedTag}")`).first();
  await badge.waitFor({ state: 'visible', timeout: 15000 });
  expect(await badge.isVisible()).to.be.true;
});

When('I add tag {string} to the pipe list', async function (this: UIWorld, tagToAdd: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const addBtn = this.page.locator(`lib-pipe-list-control button.available-opt-btn:has-text("${tagToAdd}")`).first();
  await addBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addBtn.click();
});

When('I remove tag {string} from the pipe list', async function (this: UIWorld, tagToRemove: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badge = this.page.locator(`lib-pipe-list-control [data-testid^="selected-item-"]:has-text("${tagToRemove}")`).first();
  await badge.waitFor({ state: 'visible', timeout: 15000 });
  const removeBtn = badge.locator('.remove-icon').first();
  await removeBtn.click();
});

Then('the pipe list view should contain tag {string}', async function (this: UIWorld, expectedTag: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badge = this.page.locator(`lib-pipe-list-control .badge:has-text("${expectedTag}")`).first();
  await badge.waitFor({ state: 'visible', timeout: 15000 });
  expect(await badge.isVisible()).to.be.true;
});

Then('the badge list should display badge {string}', async function (this: UIWorld, expectedBadge: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badge = this.page.locator(`lib-badge-list .badge:has-text("${expectedBadge}")`).first();
  await badge.waitFor({ state: 'visible', timeout: 15000 });
  expect(await badge.isVisible()).to.be.true;
});

Then('the badge list should have {int} badges', async function (this: UIWorld, count: number) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badges = this.page.locator('lib-badge-list .badge');
  await badges.first().waitFor({ state: 'visible', timeout: 15000 });
  expect(await badges.count()).to.equal(count);
});

// SelectControlComponent Steps
Then('the select control dropdown should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const select = this.page.locator('lib-select-control select').first();
  await select.waitFor({ state: 'visible', timeout: 15000 });
  expect(await select.isVisible()).to.be.true;
});

Then('the select control view should display formatted text', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-select-control [data-testid^="view-"]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.inputValue?.().catch(() => '')) || (await viewEl.textContent())?.trim() || '';
  expect(text.trim()).to.not.be.empty;
});

// SelectMultipleControlComponent Steps
Then('the select multiple control should display selected tag {string}', async function (this: UIWorld, expectedTag: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badge = this.page.locator('lib-select-multiple-control .badge').filter({ hasText: expectedTag }).first();
  await badge.waitFor({ state: 'visible', timeout: 15000 });
  expect(await badge.isVisible()).to.be.true;
});

Then('the select multiple view should display badge {string}', async function (this: UIWorld, expectedTag: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const badge = this.page.locator('lib-select-multiple-control [data-testid^="view-badge-"], lib-select-multiple-control .badge').filter({ hasText: expectedTag }).first();
  await badge.waitFor({ state: 'visible', timeout: 15000 });
  expect(await badge.isVisible()).to.be.true;
});

// SelectTwoControlComponent Steps
Then('the select two primary dropdown should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const select = this.page.locator('lib-select-two-control lib-select-control select').first();
  await select.waitFor({ state: 'visible', timeout: 15000 });
  expect(await select.isVisible()).to.be.true;
});

Then('the select two view should display formatted text', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-select-two-control [data-testid^="view-"], lib-select-two-control .form-control[readonly]').first();
  await viewEl.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await viewEl.inputValue?.().catch(() => '')) || (await viewEl.textContent())?.trim() || '';
  expect(text.trim()).to.not.be.empty;
});

Then('the select two secondary dropdown should contain option {string}', async function (this: UIWorld, expectedOption: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const secondarySelect = this.page.locator('lib-select-two-control lib-enumeration-control select').first();
  await secondarySelect.waitFor({ state: 'visible', timeout: 15000 });
  await this.page.waitForFunction(
    ([sel, opt]) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const options = Array.from(el.querySelectorAll('option')).map(o => o.textContent?.trim());
      return options.includes(opt);
    },
    ['lib-select-two-control lib-enumeration-control select', expectedOption],
    { timeout: 10000 }
  );
  const options = await secondarySelect.locator('option').allTextContents();
  const trimmed = options.map(o => o.trim());
  expect(trimmed).to.include(expectedOption);
});

Then('the select two secondary dropdown should not contain option {string}', async function (this: UIWorld, excludedOption: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const secondarySelect = this.page.locator('lib-select-two-control lib-enumeration-control select').first();
  await secondarySelect.waitFor({ state: 'visible', timeout: 15000 });
  await this.page.waitForFunction(
    ([sel, opt]) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const options = Array.from(el.querySelectorAll('option')).map(o => o.textContent?.trim());
      return !options.includes(opt);
    },
    ['lib-select-two-control lib-enumeration-control select', excludedOption],
    { timeout: 10000 }
  );
  const options = await secondarySelect.locator('option').allTextContents();
  const trimmed = options.map(o => o.trim());
  expect(trimmed).to.not.include(excludedOption);
});

When('I select clinic {string} in the select two primary dropdown', async function (this: UIWorld, clinicName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const primarySelect = this.page.locator('lib-select-two-control lib-select-control select').first();
  await primarySelect.waitFor({ state: 'visible', timeout: 15000 });
  await this.page.waitForFunction(
    ([sel, opt]) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const options = Array.from(el.querySelectorAll('option')).map(o => o.textContent?.trim());
      return options.includes(opt);
    },
    ['lib-select-two-control lib-select-control select', clinicName],
    { timeout: 10000 }
  );
  await primarySelect.selectOption({ label: clinicName });
  await this.page.waitForTimeout(500);
});

// -----------------------------------------------------------------------------
// Menu Bar & Showcase Accordion Steps
// -----------------------------------------------------------------------------

When('I click the menu dropdown {string}', async function (this: UIWorld, menuLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const menuToggle = this.page.locator(`[data-testid="menu-${menuLabel}"], #${menuLabel}Menu`).first();
  await menuToggle.waitFor({ state: 'visible', timeout: 15000 });
  await menuToggle.click();
});

When('I click the menu item {string}', async function (this: UIWorld, itemLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const menuItem = this.page.locator(`[data-testid="menu-item-${itemLabel}"], #${itemLabel}MenuItem`).first();
  await menuItem.waitFor({ state: 'visible', timeout: 15000 });
  await menuItem.click();
});

When('I toggle the showcase category {string}', async function (this: UIWorld, categoryName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const accordionBtn = this.page.locator(`button.accordion-button:has-text("${categoryName}")`).first();
  await accordionBtn.waitFor({ state: 'visible', timeout: 15000 });
  await accordionBtn.click();
});

Then('the showcase category {string} should be {string}', async function (this: UIWorld, categoryName: string, state: 'collapsed' | 'expanded') {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const selector = state === 'collapsed'
    ? `button.accordion-button.collapsed:has-text("${categoryName}")`
    : `button.accordion-button:not(.collapsed):has-text("${categoryName}")`;
  const btn = this.page.locator(selector).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  expect(await btn.isVisible()).to.be.true;
});

// -----------------------------------------------------------------------------
// Showcase Tabs & Gherkin Verification Steps
// -----------------------------------------------------------------------------

When('I click the showcase tab {string}', async function (this: UIWorld, tabName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const tab = this.page.getByTestId(`tab-${tabName}`).first();
  await tab.waitFor({ state: 'visible', timeout: 15000 });
  await tab.click();
});

When('I click the showcase nav item {string}', async function (this: UIWorld, componentId: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const navBtn = this.page.getByTestId(`nav-${componentId}`);
  const isVisible = await navBtn.isVisible().catch(() => false);
  if (!isVisible) {
    const accordionItem = navBtn.locator('xpath=ancestor::div[contains(@class, "accordion-item")]');
    const collapseHeaderBtn = accordionItem.locator('button.accordion-button.collapsed');
    if ((await collapseHeaderBtn.count()) > 0) {
      await collapseHeaderBtn.first().click();
    }
  }
  await navBtn.waitFor({ state: 'visible', timeout: 15000 });
  await navBtn.click();
});

Then('the Gherkin feature specification should contain {string}', async function (this: UIWorld, expectedSubstring: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const pre = this.page.locator('[data-testid="gherkin-spec-code"], pre code').filter({ hasText: expectedSubstring }).first();
  await pre.waitFor({ state: 'visible', timeout: 15000 });
  const text = await pre.textContent();
  expect(text).to.include(expectedSubstring);
});

Then('the Gherkin feature specification should not contain {string}', async function (this: UIWorld, unexpectedSubstring: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const pre = this.page.locator('[data-testid="gherkin-spec-code"], pre code').last();
  await pre.waitFor({ state: 'visible', timeout: 15000 });
  const text = await pre.textContent();
  expect(text).to.not.include(unexpectedSubstring);
});

Then('the showcase live stage should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const stage = this.page.getByTestId('showcase-stage').first();
  await stage.waitFor({ state: 'visible', timeout: 15000 });
  expect(await stage.isVisible()).to.be.true;
});

Then('the showcase tab {string} should be visible', async function (this: UIWorld, tabName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const tab = this.page.getByTestId(`tab-${tabName}`).first();
  await tab.waitFor({ state: 'visible', timeout: 15000 });
  expect(await tab.isVisible()).to.be.true;
});

// -----------------------------------------------------------------------------
// Phase 2: Action & Navigation Tools and Presentation Tools Steps
// -----------------------------------------------------------------------------

Then('the button tool should be visible with label {string}', async function (this: UIWorld, expectedLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator('lib-button-tool button').filter({ hasText: expectedLabel }).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  expect(await btn.isVisible()).to.be.true;
});

Then('the button group tool should display button {string}', async function (this: UIWorld, buttonLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator(`lib-button-group-tool label[data-testid="btn-group-${buttonLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  expect(await btn.isVisible()).to.be.true;
});

When('I click button group button {string}', async function (this: UIWorld, buttonLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const btn = this.page.locator(`lib-button-group-tool label[data-testid="btn-group-${buttonLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

Then('button group button {string} should be active', async function (this: UIWorld, buttonLabel: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const input = this.page.locator(`lib-button-group-tool input[data-testid="btn-group-input-${buttonLabel}"]`).first();
  await input.waitFor({ state: 'attached', timeout: 15000 });
  expect(await input.isChecked()).to.be.true;
});

Then('the button tabs tool should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const tool = this.page.locator('lib-button-tabs-tool').first();
  await tool.waitFor({ state: 'visible', timeout: 15000 });
  expect(await tool.isVisible()).to.be.true;
});

Then('the link tool should display link text {string}', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const link = this.page.locator('lib-link-tool a').filter({ hasText: expectedText }).first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  expect(await link.isVisible()).to.be.true;
});

Then('the page title heading should display {string}', async function (this: UIWorld, expectedTitle: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const heading = this.page.locator('lib-page-title-tool [data-testid="page-title"]').first();
  await heading.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await heading.textContent())?.trim();
  expect(text).to.equal(expectedTitle);
});

Then('the text tool banner should display {string}', async function (this: UIWorld, expectedBannerText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const banner = this.page.locator('lib-text-tool div').filter({ hasText: expectedBannerText }).first();
  await banner.waitFor({ state: 'visible', timeout: 15000 });
  expect(await banner.isVisible()).to.be.true;
});

Then('the icon tool should display icon {string}', async function (this: UIWorld, expectedIcon: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const icon = this.page.locator('lib-icon-tool span.material-symbols-outlined').filter({ hasText: expectedIcon }).first();
  await icon.waitFor({ state: 'visible', timeout: 15000 });
  expect(await icon.isVisible()).to.be.true;
});


// Phase 3: Media, Geospatial & Data Tools
Then('the media control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-media-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the media gallery control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-media-gallery-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the geometry control textarea should contain {string}', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const textarea = this.page.locator('lib-geometry-control textarea').first();
  await textarea.waitFor({ state: 'visible', timeout: 15000 });
  const val = await textarea.inputValue();
  expect(val).to.include(expectedText);
});

Then('the geometry control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-geometry-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the map tool component should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-map-tool').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the pagination tool should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-paginate-tool ngb-pagination').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

// Phase 4: Relational Controls
Then('the many to one input should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-many-to-one-control input[type="text"]').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the many to one view should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-many-to-one-control [data-testid^="field-"], lib-many-to-one-control [data-testid^="view-"]').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the one to many control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-one-to-many-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the one to one control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-one-to-one-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the one to poly control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-one-to-poly-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

// Phase 5: Observations & Diagnostic Tools
Then('the assertion list control should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-assertion-list-control').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the duration tool should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-duration-tool').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the tree tool should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-tree-tool').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the last sign in tool should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-last-sign-in-tool').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});

Then('the image tool should be visible', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const el = this.page.locator('lib-image-tool').first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  expect(await el.isVisible()).to.be.true;
});
