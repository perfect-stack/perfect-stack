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
