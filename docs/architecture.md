# Architecture Documentation

## 1. Executive Summary

This document describes the architecture of the Strength Assistant mobile application. The project is a monolithic mobile application built with React Native and Expo. It follows a component-based architecture for the frontend and a client-server model for its backend interactions, using Supabase for data, authentication, and other backend services.

## 2. Technology Stack

| Category       | Technology            |
| :------------- | :-------------------- |
| Language       | TypeScript            |
| Framework      | React Native (Expo)   |
| UI Toolkit     | React Native Paper    |
| Navigation     | React Navigation      |
| State          | @legendapp/state      |
| Backend        | Supabase              |
| Testing        | Jest, RTL             |

## 3. Architecture Pattern

The application employs a **Component-Based Architecture**, which is standard for React Native. The UI is composed of a hierarchy of reusable components.

For data and services, it uses a **Client-Server Architecture**. The mobile app acts as the client, communicating with the Supabase backend for all data persistence, authentication, and business logic that resides on the server.

## 4. Data Architecture

The database schema is managed via SQL migration files located in the `supabase/migrations` directory. The application interacts with the database through the Supabase client library, as defined in `lib/data/SupabaseClient.ts`. Data models and types for the application are defined in the `lib/models` directory.

## 5. API Design

The application does not expose its own API. Instead, it consumes the API provided by Supabase. All interactions with the backend (e.g., fetching exercises, logging workouts) are handled through service functions (like `ExerciseService.ts`) that use the Supabase client.

## 6. Source Tree

Refer to the [Source Tree Analysis](./source-tree-analysis.md) for a detailed breakdown of the directory structure.

## 7. Development & Deployment

-   **Development**: Instructions can be found in the [Development Guide](./development-guide.md).
-   **Deployment**: The application is deployed using Expo Application Services (EAS). See the [Deployment Guide](./deployment-guide.md) for more details.
