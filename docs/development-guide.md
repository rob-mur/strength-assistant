# Development Guide

This guide provides instructions for setting up and running the project locally.

## Prerequisites

- Node.js (version as per project's `.nvmrc` or `package.json` engines field, if specified)
- npm or yarn package manager

## Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Application

-   **For development with Expo Go:**
    ```bash
    npm start
    ```
-   **To run on an Android emulator/device:**
    ```bash
    npm run android
    ```
-   **To run on an iOS simulator/device:**
    ```bash
    npm run ios
    ```
-   **To run in a web browser:**
    ```bash
    npm run web
    ```

## Testing

-   **Run all tests with coverage:**
    ```bash
    npm test
    ```
-   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    ```
