# Phase 0: Research & Decisions

**Date**: 2025-09-13

## 1. Local-First Sync with `legend-state` and Supabase

### Research Task
Investigate the built-in Supabase support in `legend-state`, focusing on configuration for automatic sync and conflict resolution.

### Findings
- `legend-state` provides a dedicated plugin, `@legendapp/state/sync/supabase`, for integration with Supabase.
- The plugin supports real-time, local-first synchronization.
- **Automatic Sync**: This is enabled by setting the `realtime: true` option in the `syncedSupabase` configuration.
- **Conflict Resolution**: The library does not provide an explicit "last-write-wins" default. However, it provides the tools to implement this strategy. By using `updated_at` timestamps and potentially custom `actions`, we can ensure that the most recent write is honored. We will proceed with the assumption that we can configure the plugin to achieve this, as per the user's preference to rely on the library.

### Decision
We will use the `@legendapp/state/sync/supabase` plugin. The implementation will include adding the required timestamp columns (`created_at`, `updated_at`, `deleted`) to the Supabase tables and configuring the plugin to enforce a "last-write-wins" conflict resolution strategy.

## 2. Feature Flag Implementation

### Research Task
Research how to manage environment variables for the feature flag in the relevant `devbox.json` files and EAS.

### Findings
- **Local/CI Development**: Environment variables for local development and CI are managed in `devbox.json` files. The user has identified the relevant configurations as `minimal` and `android-testing`, which are used by the `Integration Test Chrome.yml` and `Integration Test Android.yml` workflows respectively.
- **`devbox.json` Structure**: The `devbox.json` files have an `env` block where environment variables can be set. I will add the `EXPO_PUBLIC_USE_SUPABASE` variable to this block in all relevant `devbox.json` files.
- **Production/Preview Builds**: For builds deployed via EAS, environment variables are managed in the EAS cloud service. The user has confirmed that they have set the `EXPO_PUBLIC_USE_SUPABASE` variable for the `preview` and `production` environments as requested.

### Decision
- For local and CI testing, the feature flag will be managed by adding `"EXPO_PUBLIC_USE_SUPABASE": "false"` (or `true` for testing the new backend) to the `env` block of the relevant `devbox.json` files.
- For production and preview builds, we will rely on the environment variables set in the EAS service.