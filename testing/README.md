# Perfect Stack Testing Suite

Integration and Behavior-Driven Development (BDD) testing suite for the Perfect Stack ecosystem.

---

## 🎯 Goals & Testing Strategy

The primary goal of this testing suite is to provide a robust, fast, and human-readable verification framework across both backend services and frontend applications in the Perfect Stack repository.

### 1. Behavior-Driven Development (BDD) as Living Documentation
- **Gherkin Feature Specifications**: Scenarios are written in plain language (`Given / When / Then`) under [`features/`](./features) to act as living documentation for business requirements and technical capabilities.
- **Unified Domain Language**: Keeps developers, stakeholders, and automated test runners aligned on expected system behavior.

### 2. Fast, Dependency-Free Local Testing (SQLite)
- **Zero External Infrastructure**: Integration tests run out-of-the-box locally and in CI without requiring live PostgreSQL instances, AWS Secrets Manager, or RDS connectivity.
- **Isolated SQLite Storage**: Leverages SQLite file/in-memory mode for fast database spins, rapid migrations, and zero teardown friction.
- **Production Postgres Parity**: Core libraries (`@perfect-stack/nestjs-server`) maintain dialect-aware factories (`postgres` vs `sqlite`), ensuring local SQLite test speed without altering or risking production Postgres behavior.

### 3. Comprehensive End-to-End & Integration Coverage
- **Server Services Integration**: Validates NestJS modules (`OrmModule`, `MetaEntityModule`, `DataModule`, `KnexModule`, `QueryService`) working together with dynamic model schemas, validation rules, and persistence operations.
- **UI & Browser Automation**: Supports Playwright for browser testing against UI components and full client workflows under the same BDD framework.

---

## 🏗️ Directory Structure

```text
testing/
├── features/                  # Gherkin .feature specifications
│   ├── server/                # Backend / service integration scenarios (e.g. data-crud.feature)
│   └── ui/                    # Playwright browser / frontend scenarios
├── meta/                      # Dedicated metadata schemas for test scenarios
│   └── entities/              # Test entity definitions (Person.json, Address.json)
├── step-definitions/          # Step definition implementations
│   ├── server/                # Server-side step definitions
│   ├── ui/                    # UI / Playwright step definitions
│   └── common/                # Shared step definitions
├── support/                   # Test harnesses, lifecycle hooks, and world context
│   ├── hooks.ts               # Cucumber Before / After hooks
│   ├── world.ts               # Custom Cucumber World context
│   └── server/
│       └── server-harness.ts  # NestJS Test module & SQLite environment initializer
├── cucumber.js                # Cucumber configuration and profile definitions
├── package.json               # Dependencies and test execution scripts
└── tsconfig.json              # TypeScript configuration with path aliases
```

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Server Integration Profile Only
```bash
npm run test:server
```

### Run UI / Playwright Profile Only
```bash
npm run test:ui
```

---

## ⚙️ Architecture & Test Harness

### `ServerHarness`
Located at [`support/server/server-harness.ts`](./support/server/server-harness.ts):
- Initializes a standalone NestJS `TestingModule` using local configuration.
- Automatically sets `DATABASE_DIALECT=sqlite` and points storage to an isolated test database (`test-database.sqlite`).
- Loads dedicated test metadata definitions from [`meta/`](./meta).
- Performs schema synchronization via Sequelize and initializes meta-entity models before executing feature steps.

### Custom World Context
Located at [`support/world.ts`](./support/world.ts):
- Provides scenario-scoped state management (e.g., current entity under test, query responses, authentication context).
- Resets state between scenarios to guarantee test isolation.

---

## ✍️ Adding New Tests

1. **Define the Feature**: Create a `.feature` file in [`features/server/`](./features/server/) or [`features/ui/`](./features/ui/).
2. **Configure Test Meta (if needed)**: Add or adjust schema definitions under [`meta/entities/`](./meta/entities/).
3. **Implement Step Definitions**: Implement matching steps in [`step-definitions/`](./step-definitions/) using the `CustomWorld` context.
4. **Keep Steps Atomic & Reusable**: Prefer general-purpose steps where appropriate to reuse existing assertions across features.
5. **Ensure Dialect Independence**: When writing server queries and test validations, rely on ORM abstractions or ANSI-compliant SQL supported by both Postgres and SQLite.
