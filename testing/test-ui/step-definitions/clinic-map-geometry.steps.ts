import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
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

    const geomField = this.page
      .getByTestId('view-geometry')
      .or(this.page.getByTestId('field-geometry'))
      .first();

    await geomField.waitFor({ state: 'visible', timeout: 30000 });
    const content = (await geomField.textContent()) || '';

    expect(content).to.include(`"type":"${geometryType}"`);
    expect(content).to.include('"coordinates"');
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
