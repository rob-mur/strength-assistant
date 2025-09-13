# Project Constitution

## Core Principles

1.  **Predictable Execution**: After executing any command (especially for testing or building), predict the expected observable behavior. For example:
    *   "Running these tests now, and I expect them to fail because the implementation is missing."
    *   "I am now running the linter, and I expect it to pass."
    *   "This will now run the tests, which I expect to pass as I have implemented the feature and its tests."

2.  **Sequential Task Execution**: Work on tasks one at a time (sequentially). Do not proceed to the next task until the current one is complete and verified. This allows for a tight feedback loop.

3.  **Code Organization**:
    *   All application routes and screens reside in the `app/` directory.
    *   All other business logic, data access, and services must be placed under the `lib/` directory.
    *   Data repository logic (e.g., for Firebase or Supabase interactions) should be located in `lib/repo/` or `lib/data/`.

4.  **Framework Usage**:
    *   `legend-state` can be used directly for state management without needing to be hidden behind an interface if it simplifies the implementation.
    *   Backend services (like Firebase and Supabase) must be abstracted, with the implementations residing in the `lib/repo` or `lib/data` directories.
