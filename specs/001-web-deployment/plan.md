# Implementation Plan: Web Build Deployment Pipeline

**Branch**: `001-web-deployment` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-web-deployment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement web deployment pipeline for React Native/Expo application with ephemeral PR previews and production deployments. Extends existing GitHub Actions CI/CD pipeline to build and deploy web artifacts to Supabase hosting infrastructure managed through Terraform. Enables parallel web and Android deployments while maintaining current production database connectivity.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript/JavaScript with React Native 0.79.5, Expo SDK 53, React 19.0.0  
**Primary Dependencies**: Expo Router, React Native Paper, @supabase/supabase-js, @legendapp/state  
**Storage**: Supabase PostgreSQL (existing production database), Supabase hosting for static web assets  
**Testing**: Jest, React Native Testing Library, Maestro for integration testing  
**Target Platform**: Web browsers (modern ES2020+ support), deployed via Supabase hosting
**Project Type**: Mobile + Web (React Native with web target)  
**Performance Goals**: <5min PR preview deployment, <10min production deployment, 95% deployment success rate  
**Constraints**: Must use existing production database, terraform-managed infrastructure only, parallel Android builds  
**Scale/Scope**: Single web deployment per environment, CI/CD pipeline extension, Supabase hosting limits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Status**: ✅ PASSED - No constitution constraints detected  
**Post-Design Status**: ✅ PASSED - Design maintains compliance

**Design Review**: After completing Phase 1 design and contracts, the implementation plan continues to align with project practices:
- **Infrastructure as Code**: All new infrastructure (Vercel project, terraform resources) managed through terraform
- **Existing Technology Stack**: Leverages current React Native/Expo/Supabase stack without introducing new frameworks
- **Testing Strategy**: Maintains existing Jest and Maestro testing patterns for web deployment validation
- **CI/CD Extension**: Extends existing GitHub Actions workflows rather than replacing them
- **Error Handling**: Uses established error blocking and logging systems for web deployment failures
- **Data Access**: Connects to existing production database without schema changes or new data models

**No Constitution Violations**: The design follows established patterns and extends current capabilities without violating any project principles.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Current React Native + Web Structure (no changes to source)
app/                          # Expo Router screens (unchanged)
├── (tabs)/
├── _layout.tsx
└── [existing screens]

lib/                          # Business logic (unchanged)
├── components/
├── data/
├── hooks/
└── utils/

# New Infrastructure Files
.github/workflows/
├── production-deployment.yml  # MODIFY: Add web deployment job
├── pr-validation.yml         # MODIFY: Add ephemeral web deployment
└── web-deployment.yml        # NEW: Reusable web deployment workflow

terraform/
├── main.tf                   # MODIFY: Add Supabase hosting resources
├── web-hosting.tf            # NEW: Web hosting configuration
└── variables.tf              # MODIFY: Add web hosting variables

# Generated Build Artifacts (gitignored)
dist/                         # Expo web build output
├── _expo/
├── assets/
└── static/
```

**Structure Decision**: Mobile + Web deployment extension - no source code changes required. The existing React Native app with Expo already supports web compilation via `expo export -p web`. Implementation focuses on CI/CD pipeline extensions and infrastructure provisioning through existing terraform configuration.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
