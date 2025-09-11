# Strength Assistant Constitution

## Core Principles

### I. Library-First Architecture
Every feature starts as a standalone library with clear boundaries. Libraries must be self-contained, independently testable, and well-documented. No organizational-only libraries without clear functional purpose.

### II. CLI Interface Standards
Every library exposes functionality via CLI with consistent text I/O protocols: stdin/args → stdout, errors → stderr. Support both JSON and human-readable formats for maximum composability.

### III. Test-First Development (NON-NEGOTIABLE)
**TypeScript Compilation**: TypeScript compilation MUST succeed before test execution. `devbox run test` MUST pass completely before any commit. Pre-commit hooks MUST validate TypeScript compilation.

**TDD Requirements**: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced.

**FORBIDDEN**: Committing code that breaks TypeScript compilation, implementation before test, skipping RED phase.

**REQUIRED**: Immediate fix of any TypeScript compilation errors, all tests runnable at all times.

### IV. Integration Testing Standards
Focus areas requiring integration tests: New library contract tests, contract changes, inter-service communication, shared schemas. Real dependencies required - no mocking for integration tests.

### V. Observability Requirements  
Structured logging required for all components. Text I/O ensures debuggability. Frontend logs must stream to backend for unified monitoring.

### VI. Versioning & Breaking Changes
MAJOR.MINOR.BUILD format mandatory. BUILD increments on every change. Breaking changes require parallel testing and migration plans.

### VII. Simplicity Principle
Start simple, apply YAGNI principles. Maximum 3 projects per feature. Use frameworks directly without wrapper classes. Single data model without DTOs unless serialization differs.

## TypeScript Quality Standards

**Strict Mode Enforcement**: TypeScript strict mode must be enabled with noImplicitAny, noImplicitReturns, and comprehensive type checking.

**Pre-commit Validation**: Git hooks must validate TypeScript compilation before allowing commits. No exceptions.

**CI/CD Integration**: All pipelines must include TypeScript validation as a mandatory gate. Deployment blocked if TypeScript compilation fails.

## Development Workflow

**Code Quality Gates**: All PRs must pass TypeScript compilation, ESLint, Prettier, and Jest tests before merge approval.

**Testing Requirements**: `devbox run test` success is mandatory for feature completion. Integration tests run in CI, unit tests must pass locally.

**Error Resolution**: TypeScript compilation errors require immediate resolution - no deferring to "later" or "separate PR".

## Governance

Constitution supersedes all other practices. Amendments require formal documentation, approval process, and migration plan. All PRs/reviews must verify constitutional compliance.

Complexity must be justified against constitutional principles. Use CLAUDE.md for runtime development guidance aligned with constitutional requirements.

**Version**: 2.2.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15