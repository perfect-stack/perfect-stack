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

### 2. UI & Playwright Tests (`test-ui`)

Runs browser automation scenarios with Playwright and Cucumber:

```bash
cd testing/test-ui
npm test
```

### 3. Running the Vet Clinic App Standalone

You can start the Vet Clinic backend server independently outside of automated tests:

```bash
cd testing/test-ui/server
npm run start
# Server listens on http://localhost:3080 with SQLite persistence
```

---

## 📋 Data-Driven Test Isolation Principle

- **No Reliance on Global DB Reset**: Rather than dropping or truncating tables between every scenario, tests maintain isolation through **intentional, distinct test datasets**.
- **Unique Identifying Values**: Use distinctive identifiers, names, or prefixes for scenario-specific data (e.g. `qmc.alice.baker@corp.com`, `QEL-Oliver`).
- **Targeted Filter Queries**: Queries assert on expected slices of data using explicit search criteria rather than assuming an empty table.
