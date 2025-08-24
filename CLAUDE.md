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
- **Devbox**: Nix-based reproducible development environment for consistent tooling

## Claude Code Integration

### Environment Setup
Claude Code uses devbox for consistent dependency management across CI and local development:

```bash
# Initialize environment (equivalent to devbox shell)
devbox install

# Run development commands through devbox
devbox run test                    # Run Jest tests
devbox run build_preview          # Build preview version
devbox run build_production       # Build production version
devbox run integration_test_android  # Run Android integration tests
devbox run integration_test_chrome   # Run Chrome integration tests
```

### Approved Command Whitelist
Claude Code is configured with the following approved commands for secure operation:

#### Core Development Commands
- `npm install` - Install dependencies
- `npm start` / `npx expo start` - Start development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

#### Testing & Quality Assurance
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run format` - Format code
- `npm run format:check` - Check code formatting
- `npx tsc --noEmit` - TypeScript type checking

#### Devbox Commands
- `devbox shell` - Enter devbox environment
- `devbox install` - Install devbox dependencies
- `devbox run *` - Run any devbox script
- `devbox generate` - Generate devbox configuration

#### Storybook
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook for production
- `npm run storybook-generate` - Generate Storybook stories

#### Expo Commands
- `npx expo install` - Install Expo dependencies
- `npx expo doctor` - Check Expo configuration
- `npx expo prebuild` - Generate native code

#### Git Operations
- `git status` - Check repository status
- `git diff` - View changes
- `git log` - View commit history
- `git add` - Stage changes
- `git commit` - Commit changes
- `git push` - Push to remote
- `git rm` - Remove files from git
- `gh` - GitHub CLI operations

### Security Considerations
The whitelist excludes:
- System-level operations (sudo, chmod, etc.)
- File manipulation outside git/npm context
- Network operations beyond package management
- Environment variable access or secret manipulation
- Arbitrary shell command execution

This ensures Claude can assist with development tasks while maintaining security boundaries.
