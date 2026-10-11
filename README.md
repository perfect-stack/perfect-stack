# Perfect-Stack

Perfect-Stack is a metadata-driven low-code platform and enterprise application stack for building modern web applications. Based on Angular, NestJS, Docker, and PostgreSQL/SQLite, it provides a complete runtime and tooling ecosystem to eliminate repetitive CRUD boilerplate.

Define an entity model declaratively. Generate schemas and sync databases automatically. Add web pages to search, view, edit, and navigate data—all without writing boilerplate code.

* **Define** (Meta Entities & Validation Rules)
* **View** (Dynamic Search, Tables, Trees & Card Layouts)
* **Edit** (Reactive Forms, Parent-Child Cascades, Typeaheads & Pickers)

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- [**Development Guide**](docs/Development%20Guide.md) ([`docs/Development Guide.md`](file:///Users/richardperfect/dev/perfect-consulting/perfect-stack/docs/Development%20Guide.md)): Practical onboarding guide for developers working on downstream applications. Explains core concepts, the 80/20 rule, developer playbooks (adding entities, forms, relationships, navigation, roles), batch jobs, and extending with custom code.
- [**System Architecture**](docs/Architecture.md) ([`docs/Architecture.md`](file:///Users/richardperfect/dev/perfect-consulting/perfect-stack/docs/Architecture.md)): Authoritative architectural blueprint covering the monorepo structure, core subsystem locations, end-to-end execution flow, local `yalc` workflows, and testing harnesses.

---

## Why Perfect-Stack

- **Low Code, High Control**: 80% of standard business domain features require zero code, while remaining fully extensible with custom NestJS and Angular code.
- **Speed of Development**: Instant schema generation, universal REST endpoints, and dynamic UI rendering.
- **Modern Architecture**: Clean TypeScript monorepo with strict separation of concerns.
- **Enterprise Features Built-In**: Auditing, role-based access control, file attachments, and batch job execution out of the box.

---

## Tech Stack

- **Frontend**: Angular, `@ng-bootstrap/ng-bootstrap`, TinyMCE, Azure MSAL
- **Backend**: NestJS, Node.js, TypeScript
- **Database & ORM**: PostgreSQL, SQLite, Knex.js, Sequelize
- **Authentication**: JWT & Azure Active Directory (MSAL)
- **Deployment & Infra**: Docker, AWS Lambda

---

## Core Features

- **Dynamic Data Modeling**: Declarative entities with typed attributes, validation rules, timestamps, and relationships (`ManyToOne`, `OneToMany`, `OneToOne`, `OneToPoly`).
- **Automatic Schema Management**: Generates and syncs database tables, columns, indexes, and foreign keys at startup.
- **Universal REST & Query APIs**: Generic CRUD endpoints (`/data/{entity}`) with multi-criteria filtering, depth-bounded relations, and pagination.
- **Recursive CTE Hierarchy Trees**: Native support for parent-child tree hierarchies and tree view UI.
- **Adaptive 12-Column UI Renderer**: Dynamic search pages, reactive edit forms, and layout styles (`Stockholm`, `Paris`, `Venice`, `New York`).
- **Rich Control Palette**: Input widgets for Text, Numeric, Dates, Dropdown pickers, Typeahead auto-complete, Colour bands, and Maps.
- **Visual In-App Designers**: Built-in visual editors to create entities, design page layouts, configure menus, and set up roles directly in the browser (`/meta/*`).
- **Role-Based Access Control (RBAC)**: Fine-grained permission model (`Read`, `Edit`, `Delete`, `Menu`) mapped to user groups.
- **Media & File Attachments**: Integrated file upload, media gallery, and local/S3 repository support.
- **Background & Batch Jobs**: Extensible job runner with execution context and monitoring dashboard (`/batch/view`).
- **Audit Trails**: Built-in entity modification tracking.
- **Data Imports**: CSV/data import framework (`/data/import`).

### Planned Roadmap
- Charts & Metric Dashboards
- Tags & Freeform Tagging
- Data Exports (CSV / Excel)
- Reference Data Management Utilities

---

## Reference Implementation & Testing

The repository includes canonical reference implementations and test harnesses:

- **BDD Integration Tests (`testing/test-server`)**: Fast, headless service integration tests using Cucumber against SQLite. Run via `cd testing/test-server && npm test`.
- **Reference Application & E2E Tests (`testing/vet-clinic`)**: Full-stack reference implementation demonstrating the entire stack with Playwright E2E browser tests. Run via `cd testing/vet-clinic && npm test`.

---

## CI/CD & Publishing Releases

The GitHub Actions workflow (`.github/workflows/perfect-stack.yml`) handles build verification, automated testing (`test-server` and `vet-clinic`), version bumping, package publishing to GitHub Packages, and git tagging.

### Automated Release on `main`
- Pushing to the `main` branch runs all test suites and automatically triggers the `publish-release` job.

### Publishing Releases from a Feature Branch (`workflow_dispatch`)
To publish release packages directly from a feature/development branch (such as `tree-structure` or any non-`main` branch):

1. Navigate to the repository's **Actions** tab on GitHub.
2. Select the **Perfect Stack CI/CD** workflow on the left sidebar.
3. Click the **Run workflow** dropdown button.
4. Select your target branch (e.g. `tree-structure`) from the **Use workflow from** dropdown.
5. Click **Run workflow**.

> **Note:** The `publish-release` job condition checks:
> ```yaml
> if: github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
> ```
> This allows manual execution via `workflow_dispatch` on any branch to perform the full test pipeline, bump version numbers, publish packages, and commit release tags back to that branch.
