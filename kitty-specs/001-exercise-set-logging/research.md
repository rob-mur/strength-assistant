# Research: Exercise Set Logging

_Phase 0 Output - Research findings and technology decisions_

## Research Questions

### Question 1: RPE Input Method

**Decision**: React Native Paper Slider component with custom step intervals
**Rationale**: Provides intuitive touch interaction for 1-10 scale with 0.5 increments, aligns with existing Paper design system
**Alternatives considered**: Custom stepper buttons (less intuitive), dropdown picker (poor UX for frequent use), text input (error-prone)

### Question 2: Form Validation Strategy

**Decision**: Real-time validation with immediate error feedback using React Hook Form
**Rationale**: Provides <200ms feedback requirement, prevents invalid submissions, good UX for rapid data entry
**Alternatives considered**: Submit-time validation only (poor UX), custom validation (reinventing wheel)

## Technology Decisions

### Form Management

**Decision**: React Hook Form with React Native Paper integration
**Rationale**: Lightweight, excellent performance, built-in validation, works seamlessly with Paper components
**Alternatives considered**: Formik (heavier), custom state management (more complex), direct state (no validation benefits)

### Data Persistence Strategy

**Decision**: Legend State for local state + immediate Supabase sync with retry mechanism  
**Rationale**: Ensures offline capability, immediate UI feedback, reliable eventual consistency
**Alternatives considered**: Supabase-only (no offline), Legend State-only (no cloud backup), manual queue system (complex)

## Implementation Patterns

### Validation Rules Implementation

**Decision**: Zod schema validation with custom rules for each field type
**Rationale**: Type-safe validation, reusable across components, clear error messages, integrates with React Hook Form
**Alternatives considered**: Custom validation functions (less maintainable), Joi (heavier), manual checks (error-prone)

### Default Value Behavior

**Decision**: Auto-populate weight/reps from last set in current session using Legend State computed values
**Rationale**: Reduces typing by 50%, maintains session context, user can still override easily
**Alternatives considered**: Empty forms (poor UX), global defaults (not contextual), database-stored defaults (complex)
