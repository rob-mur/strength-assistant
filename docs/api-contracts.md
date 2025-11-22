# API Contracts

_This document is a placeholder generated during a "quick" scan. A "deep" or "exhaustive" scan is required to populate this with detailed API endpoint contracts._

## Overview

The application communicates with a **Supabase** backend. It does not expose its own API but consumes the auto-generated REST and real-time APIs provided by Supabase.

## Key Interactions

-   **Authentication**: User sign-up, sign-in, and session management are handled via Supabase Auth.
-   **Data Access**: The application uses the Supabase client library (`supabase-js`) to perform CRUD (Create, Read, Update, Delete) operations on database tables.

## Service Layer

The primary logic for interacting with the Supabase API is abstracted in the `lib/data` directory. Key files include:

-   `lib/data/supabase/SupabaseClient.ts`: Initializes and configures the Supabase client.
-   `lib/data/ExerciseService.ts`: Contains functions for fetching and manipulating exercise-related data.
