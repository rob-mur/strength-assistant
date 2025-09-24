<!--
Sync Impact Report:
- Version change: [TEMPLATE] → 1.0.0 (Initial constitution)
- Added sections: All core principles and governance
- Modified principles: N/A (initial creation)
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Constitution Check references established)
  ✅ .specify/templates/spec-template.md (References constitution principles)
  ✅ .specify/templates/tasks-template.md (Local testing principle integrated)
- Follow-up TODOs: None
-->

# Strength Assistant Constitution

## Core Principles

### I. Local Testing First

All changes MUST be tested locally using devbox before CI/CD execution. The development environment MUST be reproducible across team members using devbox configuration. Any functionality that can be validated locally (builds, tests, linting, type checking) MUST be validated locally before pushing to CI.

**Rationale**: Devbox provides controlled, reproducible development environments. Local validation reduces CI pipeline load, catches issues earlier, and enables faster development iteration.

### II. Test-Driven Development

Tests MUST be written before implementation. All business logic MUST have corresponding unit tests. Integration tests MUST cover critical user flows. The Red-Green-Refactor cycle is mandatory for all feature development.

**Rationale**: TDD ensures code quality, documentation through tests, and prevents regressions while maintaining development velocity.

### III. CI/CD Infrastructure as Code

All CI/CD workflows MUST be version controlled and declarative. GitHub Actions MUST be parameterized and reusable to eliminate code duplication. Build processes MUST use devbox to ensure consistency between local and CI environments.

**Rationale**: Infrastructure as code ensures reproducible deployments, enables rollbacks, and maintains consistency across environments.

### IV. Anonymous User Testing

Production testing MUST use fresh anonymous users created through standard application flows. No persistent test data or complex cleanup procedures are permitted. Test isolation MUST be achieved through user session design, not external cleanup processes.

**Rationale**: Anonymous users eliminate data contamination risks, reduce operational complexity, and ensure tests don't affect real user data.

### V. Progressive Validation

Development follows the pattern: unit tests → integration tests → production validation → deployment. Each stage MUST pass before proceeding to the next. Production validation MUST test against actual production infrastructure post-deployment.

**Rationale**: Progressive validation catches issues at the appropriate level, reduces production incidents, and builds confidence in deployments.

## Development Workflow

All development MUST follow the established project structure:

- Business logic in `lib/` directory
- Routes and screens in `app/` directory
- Supabase-only backend (no Firebase)
- Direct framework usage without unnecessary abstraction layers

Code changes MUST be validated locally using devbox shell scripts before creating pull requests. The CI/CD pipeline serves as final validation, not primary testing.

## Quality Standards

**Testing**: Jest for unit tests, Maestro for integration tests, production validation against live infrastructure
**Code Quality**: TypeScript strict mode, ESLint enforcement, automated formatting
**Performance**: Mobile-first performance considerations, offline capability where applicable
**Security**: Anonymous user isolation, no secrets in code, secure API practices

## Governance

This constitution supersedes all other development practices. Amendments require:

1. Documentation of rationale and impact
2. Update of dependent templates and tooling
3. Team consensus on principle changes
4. Version increment following semantic versioning

All pull requests and code reviews MUST verify constitutional compliance. Violations require justification or design changes. Complex architectural decisions MUST reference constitutional principles for guidance.

**Version**: 1.0.0 | **Ratified**: 2025-09-24 | **Last Amended**: 2025-09-24
