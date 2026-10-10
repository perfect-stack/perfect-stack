# Engineering Standards & Architecture Rules

## System Architecture & Onboarding Instructions
- **FIRST STEP FOR NEW CONVERSATIONS**: Before exploring the codebase, running exploratory search commands, or implementing features, **read [`Architecture.md`](../../Architecture.md)** (or [`Architecture.md`](file:///Users/richardperfect/dev/perfect-consulting/perfect-stack/Architecture.md)). It provides the authoritative architectural map, glossary of terms (clarifying Meta Entity / Meta Page JSON vs. runtime objects), monorepo layout, and links to canonical reference files like [`testing/vet-clinic/meta`](file:///Users/richardperfect/dev/perfect-consulting/perfect-stack/testing/vet-clinic/meta).
- **Architecture Maintenance Rule**: If you introduce or modify any architectural patterns, core abstractions, directory structures, or design conventions, you **must update [`Architecture.md`](../../Architecture.md)** so that the living documentation remains strictly in sync with the codebase.

## Baseline & Relationship to Standard Practices
- Apply standard idiomatic practices and clean code conventions for the relevant language/framework unless a rule below explicitly dictates otherwise.
- In the event of a conflict between general industry defaults and the project-specific rules listed here, these project rules take precedence.
- Maintain existing local patterns and conventions found in neighboring files rather than introducing divergent styles.

## Project-Specific Constraints

### Testing
- I want automated testing to be focused on high-level regression testing and not low-level proof of correctness.
- Don't add new unit tests unless explicitly requested
- Don't add new regression tests in the "testing" module without asking me first

### Code Style
- I often have comments in the code that are important for describing design ideas or guarding against past and future bugs.
- Don't remove textual comments unless the code is clearly redundant or irrelevant.
