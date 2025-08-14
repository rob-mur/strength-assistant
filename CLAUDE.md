# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` or `npx expo start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device  
- `npm run web` - Run in web browser

### Testing
- `npm test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:integration` - Run integration tests (config referenced but not found)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without making changes

### Storybook
- `npm run storybook` - Start Storybook dev server on port 6006
- `npm run build-storybook` - Build Storybook for production
- `npm run storybook-generate` - Generate Storybook stories

## Architecture Overview

### Project Structure
This is a React Native Expo app built with TypeScript, using file-based routing and Firebase for data persistence.

#### Key Directories
- `app/` - File-based routing with Expo Router, contains screens and navigation
- `lib/` - Core application logic
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `models/` - TypeScript interfaces and types
  - `repo/` - Data access layer with repository pattern
  - `data/firebase/` - Firebase configuration and utilities
  - `locales/` - Internationalization files
- `__tests__/` - Unit tests
- `stories/` - Storybook stories for components

### Navigation Structure
- Tab-based navigation using `@react-navigation/bottom-tabs`
- Main tabs: Home, Exercises, Workout
- Exercises tab has nested navigation with index and add screens

### Data Layer
- **Repository Pattern**: `ExerciseRepo` class provides data access abstraction
- **Firebase Integration**: Uses Firestore for data persistence with platform-specific configs
- **Models**: Simple `Exercise` interface with id and name fields
- **Real-time Updates**: Uses Firebase `onSnapshot` for live data synchronization

### State Management
- Custom hooks pattern (e.g., `useExercises`, `useAddExercise`)
- React hooks for local state management
- Firebase handles persistence and real-time sync

### Platform Configuration
- **Path Aliases**: `@/*` maps to project root for cleaner imports
- **Firebase**: Separate configs for web (`firebase.web.ts`) and native (`firebase.native.ts`)
- **Cross-platform**: Supports Android, iOS, and web deployment

### Theme and Styling
- Uses React Native Paper for Material Design 3 components
- Automatic light/dark theme switching based on system preference
- Custom fonts: JetBrains Mono and Noto Sans

### Testing Strategy
- Jest with React Native Testing Library for unit tests
- Component tests in `__tests__/components/`
- Hook tests in `__tests__/hooks/`
- Screen tests in `__tests__/screens/`
- Integration testing capability (config referenced)

### Development Tools
- **TypeScript**: Strict mode enabled with custom path mapping
- **ESLint**: Expo config with additional plugins for unused imports, Storybook, Jest, and Testing Library
- **Prettier**: Code formatting
- **Storybook**: Component development and documentation