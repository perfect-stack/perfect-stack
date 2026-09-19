import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';

When('I navigate to {string}', async function (this: UIWorld, urlPath: string) {
  if (!this.page) {
    throw new Error('Playwright page is not initialized');
  }
  const targetUrl =
    urlPath.startsWith('http') || urlPath.startsWith('data:')
      ? urlPath
      : `${this.baseUrl}${urlPath}`;
  await this.page.goto(targetUrl);
});

Then('the page title should not be empty', async function (this: UIWorld) {
  if (!this.page) {
    throw new Error('Playwright page is not initialized');
  }
  const title = await this.page.title();
  expect(title).to.be.a('string').and.not.be.empty;
});

Then(
  'the page header should display {string}',
  async function (this: UIWorld, expectedText: string) {
    if (!this.page) {
      throw new Error('Playwright page is not initialized');
    }
    const heading = await this.page.textContent('h1');
    expect(heading?.trim()).to.equal(expectedText);
  },
);
