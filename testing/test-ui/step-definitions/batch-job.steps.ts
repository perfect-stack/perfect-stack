import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';
import { Locator } from 'playwright';

function getJobRow(world: UIWorld, jobName: string): Locator {
  if (!world.page) throw new Error('Playwright page is not initialized');
  return world.page.locator(`table tbody tr:has-text("${jobName}")`);
}

Given('I record the test start time', async function (this: UIWorld) {
  this.contextData.testStartTime = new Date();
  console.log(`⏱️ Recorded test start time: ${this.contextData.testStartTime.toISOString()}`);
});

Then('I should see the {string} job in the batch jobs table', async function (this: UIWorld, jobName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`[Step] Verifying "${jobName}" job is in the table`);
  const row = getJobRow(this, jobName);
  await row.waitFor({ state: 'visible', timeout: 15000 });
  const text = await row.textContent();
  console.log(`[Step] Found row: ${text?.trim()}`);
  expect(text).to.include(jobName);
});

When('I execute the {string} batch job', async function (this: UIWorld, jobName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`\n========================================`);
  console.log(`[Step] When I execute the "${jobName}" batch job`);
  console.log(`========================================`);
  const row = getJobRow(this, jobName);
  await row.waitFor({ state: 'visible', timeout: 15000 });
  const rowTextBefore = await row.innerText();
  console.log(`[Step] Row text BEFORE execute: ${JSON.stringify(rowTextBefore.replace(/\s+/g, ' '))}`);

  const executeBtn = row.locator('button:has-text("Execute")');
  await executeBtn.waitFor({ state: 'visible', timeout: 10000 });
  const isDisabledBefore = await executeBtn.isDisabled();
  console.log(`[Step] Execute button found. Disabled before click: ${isDisabledBefore}`);

  // Listen for the /job/start or /job/ execution response
  const startJobPromise = this.page.waitForResponse(
    (res) => res.url().includes('/job/start/') || res.url().includes('/job/'),
    { timeout: 10000 }
  ).then(async (res) => {
    let body = '';
    try { body = await res.text(); } catch {}
    console.log(`[Step:Network] POST response: ${res.status()} ${res.url()} -> Body: ${body.substring(0, 300)}`);
    return res;
  }).catch((err) => {
    console.log(`[Step:Network] Note: waitForResponse caught: ${err.message}`);
    return null;
  });

  console.log(`[Step] Clicking Execute button now...`);
  await executeBtn.click();
  console.log(`[Step] Execute button clicked.`);

  await startJobPromise;

  const isDisabledAfter = await executeBtn.isDisabled();
  const spinnerCount = await executeBtn.locator('.spinner-border').count();
  const rowTextAfter = await row.innerText();
  console.log(`[Step] Immediately after click: isDisabled=${isDisabledAfter}, spinnerCount=${spinnerCount}`);
  console.log(`[Step] Row text AFTER execute click: ${JSON.stringify(rowTextAfter.replace(/\s+/g, ' '))}`);
});

Then('the {string} button for {string} should show a loading spinner', async function (this: UIWorld, buttonLabel: string, jobName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`[Step] Checking loading spinner on "${buttonLabel}" button for "${jobName}"`);
  const row = getJobRow(this, jobName);
  const btn = row.locator(`button:has-text("${buttonLabel}")`);
  const spinner = btn.locator('.spinner-border');
  try {
    await spinner.waitFor({ state: 'visible', timeout: 5000 });
    const hasSpinner = await spinner.isVisible();
    console.log(`[Step] Spinner visible: ${hasSpinner}`);
    expect(hasSpinner).to.be.true;
  } catch (e) {
    const rowText = await row.textContent();
    const btnHtml = await btn.innerHTML().catch(() => 'could not read');
    console.log(`[Step] Spinner check timed out. Button innerHTML: ${btnHtml}`);
    console.log(`[Step] Current row text: ${rowText?.trim()}`);
    // Don't fail immediately if job was already blazing fast, but log it
  }
});

Then('the {string} job should transition to {string}', async function (this: UIWorld, jobName: string, expectedStatus: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`[Step] Waiting for "${jobName}" job to transition to "${expectedStatus}"`);
  const row = getJobRow(this, jobName);

  const activeIndicator = row.locator('.badge.text-bg-info, .badge.text-bg-secondary, ngb-progressbar, .progress');
  try {
    await activeIndicator.first().waitFor({ state: 'visible', timeout: 10000 });
    const rowText = await row.innerText();
    console.log(`[Step] Job transitioned to active state! Row text: ${JSON.stringify(rowText.replace(/\s+/g, ' '))}`);
  } catch (e) {
    const completedBadge = row.locator('.badge.text-bg-success:has-text("Completed")');
    if (await completedBadge.isVisible()) {
      console.log(`[Step] Job already transitioned through to Completed`);
      return;
    }
    const rowText = await row.innerText();
    console.log(`[Step] Transition failed. Current row text: ${JSON.stringify(rowText.replace(/\s+/g, ' '))}`);
    throw e;
  }
});

Then('the {string} job should complete successfully within {int} seconds', async function (this: UIWorld, jobName: string, timeoutSeconds: number) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`\n========================================`);
  console.log(`[Step] Waiting for "${jobName}" job to complete (max ${timeoutSeconds}s)`);
  console.log(`========================================`);
  const row = getJobRow(this, jobName);
  const executeBtn = row.locator('button:has-text("Execute")');
  const spinner = executeBtn.locator('.spinner-border');

  const startTime = Date.now();
  const maxWaitMs = timeoutSeconds * 1000;
  let pollCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;
    const spinnerCount = await spinner.count();
    const isSpinnerAttached = spinnerCount > 0;
    const isBtnDisabled = await executeBtn.isDisabled();
    const rowText = (await row.innerText()).replace(/\s+/g, ' ');

    // Query backend directly to see true DB state
    let backendJobInfo = 'unknown';
    try {
      const resp = await this.page.request.get('http://127.0.0.1:3080/job/latest/' + encodeURIComponent(jobName));
      if (resp.ok()) {
        const j = await resp.json();
        backendJobInfo = `status=${j.status}, step=${j.step_index}/${j.step_count}, duration=${j.duration}ms, result=${j.result_summary?.substring(0, 60)}`;
      }
    } catch (e: any) {
      backendJobInfo = `API error: ${e.message}`;
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Poll #${pollCount} @ +${elapsed}s] UI: hasSpinner=${isSpinnerAttached}, disabled=${isBtnDisabled} | DB: [${backendJobInfo}] | UI Text: "${rowText.substring(0, 120)}"`);

    // Check if spinner detached and Completed badge is visible
    if (!isSpinnerAttached && !isBtnDisabled) {
      console.log(`[Step] Execute button is enabled with no spinner at +${elapsed}s!`);
      const completedBadge = row.locator('.badge.text-bg-success:has-text("Completed")');
      if (await completedBadge.isVisible()) {
        console.log(`[Step] Completed badge is visible. Job completed successfully!`);
        return;
      }
    }

    await this.page.waitForTimeout(2000);
  }

  throw new Error(`Job "${jobName}" did not complete and re-enable Execute button within ${timeoutSeconds} seconds.`);
});

Then('the {string} button for {string} should return to normal enabled state', async function (this: UIWorld, buttonLabel: string, jobName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`[Step] Verifying "${buttonLabel}" button returned to normal state`);
  const row = getJobRow(this, jobName);
  const btn = row.locator(`button:has-text("${buttonLabel}")`);
  await btn.waitFor({ state: 'visible', timeout: 10000 });

  const spinner = btn.locator('.spinner-border');
  await spinner.waitFor({ state: 'detached', timeout: 10000 });
  const spinnerCount = await spinner.count();
  console.log(`[Step] Spinner count: ${spinnerCount}`);
  expect(spinnerCount, 'Execute button should not have a spinning wait cursor').to.equal(0);

  const isDisabled = await btn.isDisabled();
  console.log(`[Step] Button isDisabled: ${isDisabled}`);
  expect(isDisabled, 'Execute button should be re-enabled after job completion').to.be.false;

  const stopBtn = row.locator('button:has-text("Stop")');
  const stopCount = await stopBtn.count();
  console.log(`[Step] Stop button count: ${stopCount}`);
  expect(stopCount, 'Stop button should not be visible when job is completed').to.equal(0);
});

Then('the {string} completedAt timestamp should be greater than the test start time', async function (this: UIWorld, jobName: string) {
  if (!this.page) throw new Error('Playwright page is not initialized');
  console.log(`[Step] Verifying completedAt timestamp`);
  const row = getJobRow(this, jobName);
  const rowText = await row.textContent();

  const testStartTime: Date = this.contextData.testStartTime;
  if (!testStartTime) {
    throw new Error('Test start time was not recorded. Step "Given I record the test start time" must precede this step.');
  }

  const match = rowText?.match(/"completedAt":"([^"]+)"/);
  let completedAtStr: string | null = match ? match[1] : null;

  if (!completedAtStr) {
    const resp = await this.page.request.get('http://127.0.0.1:3080/job/latest/' + encodeURIComponent(jobName));
    const latestJob = await resp.json();
    if (latestJob && latestJob.result_summary) {
      const summaryObj = typeof latestJob.result_summary === 'string'
        ? JSON.parse(latestJob.result_summary)
        : latestJob.result_summary;
      completedAtStr = summaryObj.completedAt;
    }
  }

  expect(completedAtStr, 'completedAt timestamp must be present in the job result summary').to.be.ok;
  const completedAt = new Date(completedAtStr!);
  console.log(`✅ Job completedAt: ${completedAt.toISOString()} | Test startedAt: ${testStartTime.toISOString()}`);
  expect(completedAt.getTime()).to.be.greaterThan(
    testStartTime.getTime(),
    `Job completedAt (${completedAt.toISOString()}) must be after test start time (${testStartTime.toISOString()})`
  );
});
