import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { expect as playwrightExpect } from '@playwright/test';
import { UIWorld } from '../support/world';

When('I click on the clinic row for {string}', async function (this: UIWorld, clinicName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const row = this.page.locator(`table tbody tr:has-text("${clinicName}")`).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
});

Then('I should see the map tool component', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const mapTool = this.page.locator('lib-map-tool');
  await mapTool.waitFor({ state: 'visible', timeout: 30000 });

  // Verify map container (Leaflet or future ESRI view) is rendered
  const mapContainer = mapTool.locator('.leaflet-container, .esri-view, [leaflet], canvas').first();
  await mapContainer.waitFor({ state: 'visible', timeout: 30000 });
  expect(await mapContainer.isVisible()).to.be.true;
});

Then('the map should display a location marker', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const mapTool = this.page.locator('lib-map-tool');
  await mapTool.waitFor({ state: 'visible', timeout: 30000 });

  // Flexible marker locator covering Leaflet vector/marker layers as well as future ESRI graphics/canvases.
  // Location of the "pink dot" has flexibility and does not depend on hardcoded coordinates.
  const marker = mapTool.locator(
    'path.leaflet-interactive, path[stroke*="ff2dc0"], path[fill*="ff2dc0"], .leaflet-marker-icon, .esri-view canvas, .esri-display-object, svg path',
  ).first();

  await marker.waitFor({ state: 'attached', timeout: 30000 });
  const isPresent = (await marker.count()) > 0;
  expect(isPresent, 'Expected a location marker to be present on the map').to.be.true;
});

Then(
  'the geometry field should display GeoJSON for a {string}',
  async function (this: UIWorld, geometryType: string) {
    if (!this.page) throw new Error('Playwright page is not initialized');

    const textarea = this.page.locator('textarea[data-testid="textarea-geometry"], textarea#geometry').first();
    const isEdit = (await textarea.count()) > 0 && (await textarea.isVisible());

    if (isEdit) {
      await textarea.waitFor({ state: 'visible', timeout: 30000 });
      const val = await textarea.inputValue();
      expect(val).to.include(`"type": "${geometryType}"`);
      expect(val).to.include('"coordinates"');
    } else {
      const geomField = this.page
        .getByTestId('view-geometry')
        .or(this.page.getByTestId('field-geometry'))
        .first();

      await geomField.waitFor({ state: 'visible', timeout: 30000 });
      const content = (await geomField.textContent()) || '';

      expect(content).to.include(`"type":"${geometryType}"`);
      expect(content).to.include('"coordinates"');
    }
  },
);

When('I toggle the geometry field expansion', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const container = this.page.locator('.geometry-view-container').first();
  await container.waitFor({ state: 'visible', timeout: 30000 });

  // Hover to reveal action buttons, then click expand button or click container directly
  await container.hover();
  const expandBtn = this.page.getByTestId('expand-view-geometry').first();
  if (await expandBtn.isVisible()) {
    await expandBtn.click({ force: true });
  } else {
    await container.click();
  }
});

Then('the geometry field should be expanded', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const multiLineView = this.page
    .locator('.geometry-view-container.is-expanded, .geometry-view-multi, pre.geometry-pre')
    .first();

  await multiLineView.waitFor({ state: 'visible', timeout: 10000 });
  expect(await multiLineView.isVisible()).to.be.true;
});

Then('the geometry field should not be expanded', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const singleLineView = this.page
    .locator('.geometry-view-single')
    .first();

  await singleLineView.waitFor({ state: 'visible', timeout: 10000 });
  expect(await singleLineView.isVisible()).to.be.true;
});

When('I shift-click on the map to change the location', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const canvas = this.page.locator('lib-map-tool .esri-view canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 30000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Could not find map canvas bounding box');

  await this.page.keyboard.down('Shift');
  await this.page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
  await this.page.keyboard.up('Shift');
  await this.page.waitForTimeout(500);
});

When('I use the sketch tool to place a point on the map', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const pointBtn = this.page
    .getByRole('button', { name: /draw a point/i })
    .or(this.page.locator('button[title*="point" i]'))
    .or(this.page.locator('calcite-action[text*="point" i]'))
    .or(this.page.locator('.esri-sketch__button'))
    .first();

  await pointBtn.waitFor({ state: 'visible', timeout: 30000 });
  await pointBtn.click();
  await this.page.waitForTimeout(500);

  const canvas = this.page.locator('lib-map-tool .esri-view canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 30000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Could not find map canvas bounding box');

  await this.page.mouse.click(box.x + box.width / 2 - 40, box.y + box.height / 2 - 40);
  await this.page.waitForTimeout(1000);
});

Then('the easting and northing fields should not be empty', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const eastingInput = this.page.locator('input[data-testid="input-easting"], input#easting').first();
  const northingInput = this.page.locator('input[data-testid="input-northing"], input#northing').first();

  await eastingInput.waitFor({ state: 'visible', timeout: 10000 });
  await northingInput.waitFor({ state: 'visible', timeout: 10000 });

  const eastingVal = await eastingInput.inputValue();
  const northingVal = await northingInput.inputValue();

  expect(eastingVal.trim().length, 'Easting should not be empty').to.be.greaterThan(0);
  expect(northingVal.trim().length, 'Northing should not be empty').to.be.greaterThan(0);
});

Then('the easting and northing fields should be empty', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const eastingInput = this.page.locator('input[data-testid="input-easting"], input#easting').first();
  const northingInput = this.page.locator('input[data-testid="input-northing"], input#northing').first();

  await eastingInput.waitFor({ state: 'visible', timeout: 10000 });
  await northingInput.waitFor({ state: 'visible', timeout: 10000 });

  await playwrightExpect(eastingInput).toHaveValue('', { timeout: 10000 });
  await playwrightExpect(northingInput).toHaveValue('', { timeout: 10000 });
});

When(
  'I set the easting field to {string} and northing field to {string}',
  async function (this: UIWorld, easting: string, northing: string) {
    if (!this.page) throw new Error('Playwright page is not initialized');

    const eastingInput = this.page.locator('input[data-testid="input-easting"], input#easting').first();
    const northingInput = this.page.locator('input[data-testid="input-northing"], input#northing').first();

    await eastingInput.fill(easting);
    await eastingInput.dispatchEvent('input');
    await eastingInput.dispatchEvent('change');

    await northingInput.fill(northing);
    await northingInput.dispatchEvent('input');
    await northingInput.dispatchEvent('change');

    await this.page.waitForTimeout(500);
  },
);

When('I use the sketch tool to draw a polyline on the map', async function (this: UIWorld) {
  if (!this.page) throw new Error('Playwright page is not initialized');

  const polylineBtn = this.page
    .getByRole('button', { name: /draw a polyline/i })
    .or(this.page.locator('button[title*="polyline" i]'))
    .or(this.page.locator('calcite-action[text*="polyline" i]'))
    .first();

  await polylineBtn.waitFor({ state: 'visible', timeout: 30000 });
  await polylineBtn.click();
  await this.page.waitForTimeout(500);

  const canvas = this.page.locator('lib-map-tool .esri-view canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 30000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Could not find map canvas bounding box');

  // Click point 1
  await this.page.mouse.click(box.x + box.width / 2 - 30, box.y + box.height / 2 - 30);
  await this.page.waitForTimeout(300);
  // Double-click point 2 to complete polyline
  await this.page.mouse.dblclick(box.x + box.width / 2 + 30, box.y + box.height / 2 + 30);
  await this.page.waitForTimeout(1000);
});
