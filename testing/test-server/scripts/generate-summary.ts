import * as fs from 'fs';
import * as path from 'path';

interface CucumberStep {
  name: string;
  result: {
    status: string;
    duration?: number;
    error_message?: string;
  };
}

interface CucumberElement {
  name: string;
  type: string;
  steps: CucumberStep[];
}

interface CucumberFeature {
  name: string;
  uri: string;
  elements: CucumberElement[];
}

function generateSummary() {
  const jsonReportPath = path.join(__dirname, '../reports/cucumber-report.json');
  if (!fs.existsSync(jsonReportPath)) {
    console.log('No cucumber-report.json found at ' + jsonReportPath);
    return;
  }

  const raw = fs.readFileSync(jsonReportPath, 'utf8');
  if (!raw.trim()) {
    console.log('cucumber-report.json is empty');
    return;
  }

  const features: CucumberFeature[] = JSON.parse(raw);

  let totalScenarios = 0;
  let passedScenarios = 0;
  let failedScenarios = 0;
  let totalSteps = 0;
  let passedSteps = 0;
  let failedSteps = 0;
  let totalDurationNanos = 0;

  const featureRows: string[] = [];
  const failureDetails: string[] = [];

  for (const feature of features) {
    let fScenarios = 0;
    let fPassed = 0;
    let fFailed = 0;

    for (const scenario of feature.elements) {
      if (scenario.type !== 'scenario') continue;
      fScenarios++;
      totalScenarios++;

      let scenarioPassed = true;
      for (const step of scenario.steps) {
        totalSteps++;
        if (step.result.duration) {
          totalDurationNanos += step.result.duration;
        }

        if (step.result.status === 'passed') {
          passedSteps++;
        } else {
          scenarioPassed = false;
          failedSteps++;
          if (step.result.status === 'failed') {
            failureDetails.push(
              `### ❌ ${feature.name} > ${scenario.name}\n- **Step**: \`${step.name}\`\n\`\`\`\n${step.result.error_message || 'Unknown error'}\n\`\`\``,
            );
          }
        }
      }

      if (scenarioPassed) {
        fPassed++;
        passedScenarios++;
      } else {
        fFailed++;
        failedScenarios++;
      }
    }

    const featureStatus = fFailed === 0 ? '✅ Passed' : '❌ Failed';
    featureRows.push(
      `| ${feature.name} | ${fScenarios} | ${fPassed} | ${fFailed} | ${featureStatus} |`,
    );
  }

  const totalDurationSec = (totalDurationNanos / 1e9).toFixed(2);
  const overallBadge =
    failedScenarios === 0
      ? '### 🚀 All Test Scenarios Passed!'
      : `### ⚠️ ${failedScenarios} Test Scenario(s) Failed`;

  let md = `## 🥒 Cucumber Test Execution Summary\n\n`;
  md += `${overallBadge}\n\n`;
  md += `| Total Features | Total Scenarios | Passed | Failed | Total Steps | Duration |\n`;
  md += `| --- | --- | --- | --- | --- | --- |\n`;
  md += `| ${features.length} | ${totalScenarios} | ${passedScenarios} | ${failedScenarios} | ${totalSteps} | ${totalDurationSec}s |\n\n`;

  md += `### 📋 Feature Breakdown\n\n`;
  md += `| Feature | Scenarios | Passed | Failed | Status |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  md += featureRows.join('\n') + '\n\n';

  if (failureDetails.length > 0) {
    md += `### 🔍 Failure Details\n\n`;
    md += failureDetails.join('\n\n') + '\n\n';
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, md);
    console.log(`Summary written to GITHUB_STEP_SUMMARY (${summaryFile})`);
  } else {
    console.log(md);
  }
}

generateSummary();
