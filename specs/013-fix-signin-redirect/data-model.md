# Data Model: Email Verification Redirect Fix

**Feature**: 013-fix-signin-redirect  
**Date**: 2025-10-22  
**Source**: Extracted from feature specification

## Core Entities

### User Account
**Purpose**: Represents user in the authentication system  
**Source**: Existing Supabase Auth users table

**Attributes**:
- `id`: UUID - Unique user identifier
- `email`: String - User's email address (unique)
- `email_verified`: Boolean - Email verification status
- `platform_type`: Enum - Platform where account was created ('android', 'web')
- `last_verification_attempt`: Timestamp - Last email verification attempt
- `verification_count`: Integer - Number of verification attempts
- `created_at`: Timestamp - Account creation time
- `updated_at`: Timestamp - Last modification time

**Validation Rules**:
- Email must be valid format and unique
- Platform type must be 'android' or 'web'
- Verification count cannot exceed 5 attempts per 24 hours

**State Transitions**:
- `email_verified: false` → `email_verified: true` (on successful verification)
- Platform type is immutable after creation
- Last verification attempt updates on each verification link click

### Verification Token  
**Purpose**: Secure token for email verification links  
**Source**: Supabase Auth verification tokens (managed by Supabase)

**Attributes**:
- `token_hash`: String - Hashed verification token (primary identifier)
- `user_id`: UUID - Associated user account
- `email`: String - Email address being verified
- `token_type`: Enum - Type of verification ('email_verification', 'signup')
- `expires_at`: Timestamp - Token expiration (24 hours from creation)
- `redirect_target`: String - Platform-specific redirect URL
- `verification_attempts`: Integer - Number of times token was used
- `verified_at`: Timestamp - When verification was completed (null if pending)
- `created_at`: Timestamp - Token creation time

**Validation Rules**:
- Token expires after 24 hours
- Token can only be used once successfully
- Maximum 3 verification attempts per token
- Redirect target must be valid URL format

**State Transitions**:
- `verified_at: null` → `verified_at: timestamp` (on successful verification)
- `verification_attempts` increments on each use
- Token becomes invalid after successful verification or expiration

### Verification Session
**Purpose**: Track verification attempts and session state  
**Source**: New entity for cross-device verification support

**Attributes**:
- `id`: UUID - Unique session identifier
- `user_id`: UUID - Associated user account
- `device_fingerprint`: String - Device identifier for cross-device support
- `platform`: Enum - Device platform ('android', 'web', 'unknown')
- `user_agent`: String - Browser/app user agent string
- `ip_address`: String - Client IP address
- `verification_token`: String - Associated verification token
- `status`: Enum - Session status ('pending', 'verified', 'expired', 'failed')
- `redirect_performed`: Boolean - Whether redirect was executed
- `created_at`: Timestamp - Session start time
- `completed_at`: Timestamp - Session completion time

**Validation Rules**:
- Session expires after 30 minutes of inactivity
- Platform determined from user agent analysis
- IP address logged for security audit
- Status transitions follow defined flow

**State Transitions**:
- `pending` → `verified` (successful verification)
- `pending` → `failed` (verification error)
- `pending` → `expired` (timeout)
- `redirect_performed` updates when redirect executed

## Relationships

### User Account → Verification Token
- **Type**: One-to-Many
- **Description**: A user can have multiple verification tokens over time
- **Constraints**: Only one active (non-verified, non-expired) token per user at a time

### Verification Token → Verification Session  
- **Type**: One-to-Many
- **Description**: A token can be accessed from multiple devices/sessions
- **Constraints**: All sessions must reference same user as token

### User Account → Verification Session
- **Type**: One-to-Many  
- **Description**: A user can have multiple verification sessions for cross-device support
- **Constraints**: Sessions are purged after completion + 7 days for security

## Data Storage

### Supabase Tables (Existing)
- `auth.users` - User accounts (managed by Supabase Auth)
- `auth.verification_tokens` - Verification tokens (managed by Supabase Auth)

### New Tables (If Required)
- `verification_sessions` - Custom table for cross-device verification tracking
- `verification_audit_log` - Security audit trail for verification attempts

### External Storage
- AWS Lambda environment variables for configuration
- Terraform state for infrastructure configuration

## Performance Considerations

### Indexing Strategy
- `verification_tokens.user_id` - Fast user token lookup
- `verification_tokens.expires_at` - Efficient cleanup of expired tokens
- `verification_sessions.user_id` - Cross-device session lookup
- `verification_sessions.created_at` - Time-based queries

### Caching Strategy
- User verification status cached in app state
- Token validation results cached for 5 minutes
- Platform detection results cached per user agent

### Data Retention
- Verification tokens: Auto-deleted after expiration (24 hours)
- Verification sessions: Purged after 7 days
- Audit logs: Retained for 90 days for security analysis