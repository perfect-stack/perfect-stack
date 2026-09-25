# Angular Workspace & Monorepo Architecture

This Angular workspace manages `@perfect-stack/ngx-perfect-stack` (the core library) and applications including `demo-client`, `capture-client`, and `test-ui-client` (`testing/test-ui/client`).

---

## Workspace Structure

```
perfect-stack/
├── angular-workspace/
│   ├── projects/
│   │   ├── ngx-perfect-stack/     # Core component library
│   │   ├── demo-client/           # Demo frontend application
│   │   ├── capture-client/        # Capture frontend application
│   │   └── test-ui-client/        # Symlink / mapped to testing/test-ui/client
│   ├── node_modules/              # SINGLE source of truth for all @angular/* dependencies
│   ├── angular.json               # Multi-project workspace config
│   └── tsconfig.json              # Root TS paths
└── testing/
    └── test-ui/
        └── client/                # Project source for test-ui-client
```

---

## Important: Single Angular Runtime Requirement (Preventing Dual Angular Bundles)

### The Issue
Angular (especially v22+) maintains a global singleton runtime for DI injection contexts, Router outlets (`ɵEmptyOutletComponent`), and template `lView` structures. 

If a subproject (such as `testing/test-ui/client`) installs its own `node_modules` or has separate `@angular/*` packages:
1. **NG0912 Component ID Collision**: Both the library and the application bundle their own copy of `@angular/router`, creating two duplicate `ɵEmptyOutletComponent` definitions with selector `ng-component`.
2. **NG0203 Injection Context Error**: `inject()` calls (such as `_HttpHandler` / `HttpClient`) fail because injector contexts from one Angular instance cannot resolve tokens registered in another Angular instance.
3. **Template Assertion Failures**: `ASSERTION ERROR: Array must be defined` crashes occur during template execution because internal `lView` array slots are mismatched across multiple runtime instances.

### How to Prevent This
1. **Never run `npm install` inside `testing/test-ui/client/`**. All Angular dependencies are resolved centrally from `angular-workspace/node_modules`.
2. **`testing/test-ui/client/tsconfig.app.json`** extends `../../tsconfig.json` (or `angular-workspace/tsconfig.json`) and maps `@perfect-stack/ngx-perfect-stack` directly to `dist/ngx-perfect-stack`.
3. **All client builds and dev servers run from `angular-workspace`**:
   - `npm run build:lib` — Builds the `ngx-perfect-stack` library.
   - `npx ng build test-ui-client` — Builds `test-ui-client` using the single workspace dependency tree into `angular-workspace/dist/test-ui-client`.
   - `npm run start:test-ui-client` — Serves `test-ui-client` with live reload.

---

## Development Commands

From `angular-workspace/`:
- `npm run build:lib`: Build `@perfect-stack/ngx-perfect-stack`
- `npm run start:demo-client`: Serve `demo-client` on `http://localhost:4200`
- `npm run start:test-ui-client`: Serve `test-ui-client` on `http://localhost:4200`
- `npx ng build test-ui-client`: Production bundle generation for test-ui-client
