# Data Model: Authentication Configuration & Testing

## Core Entities

### 1. Environment Configuration

**Purpose**: Manage environment-specific settings for different build types

**Fields**:
- `buildType`: 'development' | 'staging' | 'production'
- `supabaseUrl`: string (URL for Supabase instance)
- `supabaseAnonKey`: string (public anonymous key)
- `isEmulator`: boolean (whether using local emulator)
- `enableFallback`: boolean (whether to enable local anonymous fallback)

**Validation Rules**:
- Production builds must have non-localhost URLs
- All URLs must be valid HTTPS URLs (except development emulator)
- Anonymous keys must be present and non-empty
- Build type must match environment detection

**State Transitions**:
```
Initialization → Environment Detection → Configuration Loading → Validation → Ready
```

### 2. Authentication Session

**Purpose**: Track authentication state consistently across build types

**Fields**:
- `userId`: string | null
- `sessionToken`: string | null
- `isAnonymous`: boolean
- `expiresAt`: Date | null
- `isValid`: boolean
- `source`: 'supabase' | 'local' | 'fallback'

**Validation Rules**:
- Session tokens must have valid expiration dates
- Anonymous sessions don't require tokens
- Session source must match actual authentication method

**Relationships**:
- Links to Environment Configuration for validation context
- Links to Auth Error for debugging failed sessions

### 3. Authentication Error

**Purpose**: Track and debug authentication failures with production context

**Fields**:
- `errorType`: 'network' | 'session' | 'configuration' | 'permission'
- `errorCode`: string
- `message`: string
- `buildType`: string
- `environmentConfig`: EnvironmentConfiguration
- `timestamp`: Date
- `stackTrace`: string | null
- `networkInfo`: NetworkInfo | null

**Validation Rules**:
- Error type must be from predefined enum
- Timestamp must be valid date
- Build type must match current environment

### 4. Test Result

**Purpose**: Track pre-release authentication testing results

**Fields**:
- `testName`: string
- `buildType`: string
- `environment`: string
- `status`: 'passed' | 'failed' | 'skipped'
- `duration`: number (milliseconds)
- `errorMessage`: string | null
- `runId`: string (for grouping related tests)
- `timestamp`: Date

**Validation Rules**:
- Status must be from predefined enum
- Duration must be non-negative
- Failed tests must have error messages

**Relationships**:
- Groups into test runs by runId
- Links to Authentication Errors for failed tests

### 5. Network Info

**Purpose**: Capture network conditions during auth failures

**Fields**:
- `isConnected`: boolean
- `connectionType`: 'wifi' | 'cellular' | 'unknown'
- `targetUrl`: string
- `responseStatus`: number | null
- `responseTime`: number | null (milliseconds)

**Validation Rules**:
- Connection type must be from predefined enum
- Response status must be valid HTTP status code if present
- Response time must be non-negative if present