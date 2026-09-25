# Perfect Stack Testing Suite

Integration and Behavior-Driven Development (BDD) testing suite for the Perfect Stack ecosystem.

---

## 🎯 Goals & Architecture

The testing suite is decoupled into two independent sub-projects to keep backend service integration and frontend browser automation cleanly separated with domain-specific focus:

1. **[`testing/test-server`](./test-server)**: Fast, service-level integration testing for `@perfect-stack/nestjs-server` modules (`DataService`, `QueryService`, `OrmService`, `RuleService`, `KnexModule`).
2. **[`testing/test-ui`](./test-ui)**: End-to-end browser testing using Playwright and Cucumber against a dedicated **Vet Clinic** application (`Pet`, `Species`, `Owner`), running with its own standalone NestJS server and Angular client.

---

## 🏗️ Directory Overview

```text
testing/
├── test-server/                   # Server Services Integration Suite
│   ├── features/                  # Gherkin .feature specifications
│   │   └── server/data/
│   │       ├── data/              # DataService features (CRUD, lifecycle, sort index)
│   │       └── query/             # QueryService features (criteria, pagination, sorting, eager-loading)
│   ├── meta/                      # Metadata schemas for server integration (Person, Department, etc.)
│   ├── step-definitions/          # Step definition implementations
│   ├── support/                   # ServerHarness & World context
│   ├── test-database.sqlite       # Local SQLite test database
│   ├── cucumber.js
│   └── package.json
│
└── test-ui/                       # Frontend & E2E Browser Testing Suite (Vet Clinic)
    ├── client/                    # Angular client importing @perfect-stack/ngx-perfect-stack
    ├── server/                    # Standalone NestJS server running Vet Clinic backend
    ├── meta/                      # Vet Clinic domain metadata (Species.json, Pet.json, Owner.json)
    ├── features/                  # Gherkin UI specifications
    ├── step-definitions/          # Playwright browser step definitions
    ├── support/                   # Playwright UIWorld and browser lifecycle hooks
    ├── reports/                   # HTML & JSON Cucumber execution reports
    ├── cucumber.js
    └── package.json
```

---

## 🚀 Running Tests

### 1. Server Integration Tests (`test-server`)

Runs the full suite of backend integration tests (DataService & QueryService):

```bash
cd testing/test-server
npm test
```

---

### 2. UI & Playwright End-to-End Tests (`test-ui`)

All test execution commands below automatically manage both the NestJS backend server (`http://localhost:3080`) and the Angular frontend dev server (`http://localhost:4200`) lifecycle:

```bash
cd testing/test-ui
```

#### A. Headless Mode (Default / CI)
Runs all BDD scenarios in headless Chromium:

```bash
npm test
```

#### B. Headed Mode (Watch Browser Execution)
Opens a visible Chromium browser window and runs tests with a slight delay between actions so you can visually follow execution:

```bash
npm run test:headed
```

> **Tip:** You can adjust the execution speed by setting the `SLOW_MO` environment variable (in milliseconds):
> ```bash
> SLOW_MO=1000 npm run test:headed   # 1 second delay between browser actions
> ```

#### C. Interactive Debugging & Stepping (Playwright Inspector)
Launches the **Playwright Inspector GUI** alongside the browser for step-by-step interactive debugging:

```bash
npm run test:debug
```

- **Step Over (F10)**: Executes the test step-by-step, highlighting matching DOM elements live.
- **Resume (F8)**: Continues running until completion or the next breakpoint.
- **Locator Explorer**: Hover/click any UI element to generate and test locators interactively.
- **Automatic Timeout Handling**: Cucumber step timeouts are automatically disabled in debug mode so scenarios will not time out while paused.

#### D. Pausing at a Specific Gherkin Step
You can insert a pause anywhere inside a `.feature` scenario file:

```gherkin
  When I enter "Barnaby" into the "name" field
  And I pause the test
  And I select "Canine" from the "species" dropdown
```

When Cucumber reaches `And I pause the test`, it will pause the page and open the Playwright Inspector.

---

### 3. Running the Vet Clinic App Standalone

You can start the Vet Clinic frontend and backend servers independently outside of automated tests:

#### Start Backend Server
```bash
cd testing/test-ui/server
npm run start
# Server listens on http://localhost:3080 with SQLite persistence
```

#### Start Frontend Client
```bash
cd testing/test-ui/client
npm run start
# Client serves on http://localhost:4200
```

---

## 📊 Test Reports & Summaries

- **HTML Report**: After a test run in `test-ui`, open [`reports/cucumber-report.html`](./test-ui/reports/cucumber-report.html) in your browser for detailed step metrics and failure screenshots.
- **Markdown Step Summary**: Run `node scripts/generate-summary.js` inside `test-server` or `test-ui` to produce a Markdown table breakdown compatible with GitHub Actions (`$GITHUB_STEP_SUMMARY`).

---

## 📋 Data-Driven Test Isolation Principle

- **No Reliance on Global DB Reset**: Rather than dropping or truncating tables between every scenario, tests maintain isolation through **intentional, distinct test datasets** phases.
- **Unique Identifying Values**: Use distinctive identifiers, names, or prefixes for scenario-specific data (e.g. `qmc.alice.baker@corp.com`, `QEL-Oliver`).
- **Targeted Filter Queries**: Queries assert on expected slices of data using explicit search criteria rather than assuming an empty table.
