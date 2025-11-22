# Source Tree Analysis

This document provides an annotated overview of the project's directory structure, highlighting critical folders and their purposes.

```
strength-assistant/
├── app/             # Expo Router root, defines app layout and navigation.
│   ├── (tabs)/      # Directory for each tab screen in the app.
│   └── _layout.tsx  # Main layout component for the entire app.
├── assets/          # Static assets like images and fonts.
├── lib/             # Core application logic and shared code.
│   ├── components/  # Reusable React Native components.
│   ├── data/        # Data fetching logic (e.g., Supabase client, services).
│   ├── hooks/       # Custom React hooks.
│   ├── models/      # TypeScript types and interfaces for data structures.
│   ├── state/       # Global state management setup (@legendapp/state).
│   └── utils/       # Utility functions.
├── supabase/        # Supabase configuration and migrations.
│   └── migrations/  # SQL database schema migrations.
├── android/         # Android native project files.
├── ios/             # iOS native project files.
├── package.json     # Project dependencies and scripts.
└── tsconfig.json    # TypeScript configuration.
```
