# Data Models

_This document is a placeholder generated during a "quick" scan. A "deep" or "exhaustive" scan is required to populate this with detailed data models and relationships._

## Overview

The database schema is managed through SQL migrations located in the `supabase/migrations` directory. These migrations define the tables, columns, relationships, and constraints for the application's data.

## Key Tables (Inferred from Migrations)

Based on the migration file names, the following tables are likely part of the schema:

-   **exercises**: Stores information about different exercises.
-   **exercise_schedules**: Manages user workout plans or schedules.

## Data Access

The application code defines its data structures and types in the `lib/models` directory. These TypeScript interfaces provide type safety for the data retrieved from Supabase.
