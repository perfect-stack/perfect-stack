import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';

Then('the showcase header should display {string}', async function (this: UIWorld, expectedText: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const heading = this.page.getByTestId('showcase-heading');
  await heading.waitFor({ state: 'visible', timeout: 15000 });
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

Then('the time control view should display formatted time', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  const viewEl = this.page.locator('lib-time-control [data-testid^="time-"], lib-time-control input').first();
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
