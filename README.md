# Perfect-Stack

Perfect-stack is a low-code platform and application stack for building enterprise level web applications. Based on 
Angular/NestJS/Docker and PostgreSQL it contains ready to run working code and utilities for getting started quickly 
with modern enterprise development.

Define an entity-model within the application. Generate the schema and update the database. Add web pages to search,
view and edit the data all without writing any code.

* Define
* View
* Edit


## Why

- Low code
- Speed of development
- Modern future-proof architecture
- Lots of baked-in features that otherwise get missed
- Less cost


## What

- Angular
- NestJS
- PostgresSQL
- JWT authentication
- Docker / Lambda


## Features

This is the roadmap of planned features.

* User defined data model
* User defined web forms
* User defined queries
* Pagination
* Table sorting
* Data Validation rules
* Rich text data types
* Media attachments
* UI controls for Text, Numeric, Dates, Dropdown lists
* Charts
* Maps
* Tags
* Reference data
* Data Exports
* Data Imports
* Authentication
* Role-based access control
* Environments & Config Properties


## CI/CD & Publishing Releases

The GitHub Actions workflow (`.github/workflows/perfect-stack.yml`) handles build verification, automated testing (`test-server` and `test-ui`), version bumping, package publishing to GitHub Packages, and git tagging.

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
