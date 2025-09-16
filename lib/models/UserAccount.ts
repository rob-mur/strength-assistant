/**
 * UserAccount Model with Authentication Types
 * 
 * Represents user identity for cross-device synchronization with support
 * for both email/password and anonymous authentication.
 */

export interface UserAccount {
  id: string;
  email?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastSyncAt?: Date;
}

export interface UserAccountInput {
  email?: string;
  isAnonymous: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Validation errors for UserAccount operations
 */
export class UserValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Creates a new UserAccount with validation
 */
export function createUserAccount(input: UserAccountInput): UserAccount {
  validateUserInput(input);

  const now = new Date();
  
  return {
    id: generateUserId(),
    email: input.email?.toLowerCase().trim(),
    isAnonymous: input.isAnonymous,
    createdAt: now
  };
}

/**
 * Updates user account with new sync timestamp
 */
export function updateLastSync(user: UserAccount): UserAccount {
  return {
    ...user,
    lastSyncAt: new Date()
  };
}

/**
 * Validates user input data
 */
export function validateUserInput(input: UserAccountInput): void {
  if (input.isAnonymous && input.email) {
    throw new UserValidationError('Anonymous users cannot have email addresses');
  }

  if (!input.isAnonymous && !input.email) {
    throw new UserValidationError('Non-anonymous users must have email addresses');
  }

  if (input.email) {
    validateEmail(input.email);
  }
}

/**
 * Validates complete UserAccount
 */
export function validateUserAccount(user: UserAccount): void {
  if (!user.id || typeof user.id !== 'string') {
    throw new UserValidationError('User ID is required', 'id');
  }

  if (!isValidUUID(user.id)) {
    throw new UserValidationError('User ID must be a valid UUID', 'id');
  }

  if (typeof user.isAnonymous !== 'boolean') {
    throw new UserValidationError('isAnonymous must be a boolean', 'isAnonymous');
  }

  if (user.isAnonymous && user.email) {
    throw new UserValidationError('Anonymous users cannot have email addresses');
  }

  if (!user.isAnonymous && !user.email) {
    throw new UserValidationError('Non-anonymous users must have email addresses');
  }

  if (user.email) {
    validateEmail(user.email);
  }

  if (!(user.createdAt instanceof Date) || isNaN(user.createdAt.getTime())) {
    throw new UserValidationError('Invalid createdAt timestamp', 'createdAt');
  }

  if (user.lastSyncAt && (!(user.lastSyncAt instanceof Date) || isNaN(user.lastSyncAt.getTime()))) {
    throw new UserValidationError('Invalid lastSyncAt timestamp', 'lastSyncAt');
  }

  if (user.lastSyncAt && user.lastSyncAt.getTime() < user.createdAt.getTime()) {
    throw new UserValidationError('lastSyncAt cannot be before createdAt', 'lastSyncAt');
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new UserValidationError('Email is required', 'email');
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    throw new UserValidationError('Email cannot be empty', 'email');
  }

  if (trimmedEmail.length > 254) {
    throw new UserValidationError('Email too long (max 254 characters)', 'email');
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    throw new UserValidationError('Invalid email format', 'email');
  }
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new UserValidationError('Password is required', 'password');
  }

  if (password.length < 8) {
    throw new UserValidationError('Password must be at least 8 characters long', 'password');
  }

  if (password.length > 128) {
    throw new UserValidationError('Password too long (max 128 characters)', 'password');
  }

  // Check for at least one number or special character (basic strength check)
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(password);
  if (!hasNumberOrSpecial) {
    throw new UserValidationError('Password must contain at least one number or special character', 'password');
  }
}

/**
 * Validates authentication credentials
 */
export function validateCredentials(credentials: AuthCredentials): void {
  validateEmail(credentials.email);
  validatePassword(credentials.password);
}

/**
 * Checks if user can sync data to cloud
 */
export function canSyncToCloud(user: UserAccount): boolean {
  return !user.isAnonymous && !!user.email;
}

/**
 * Checks if user needs account upgrade (anonymous -> authenticated)
 */
export function needsAccountUpgrade(user: UserAccount): boolean {
  return user.isAnonymous;
}

/**
 * Creates an anonymous user account
 */
export function createAnonymousUser(): UserAccount {
  return createUserAccount({ isAnonymous: true });
}

/**
 * Creates an authenticated user account
 */
export function createAuthenticatedUser(email: string): UserAccount {
  return createUserAccount({ 
    email: email.toLowerCase().trim(), 
    isAnonymous: false 
  });
}

/**
 * Upgrades anonymous user to authenticated user
 */
export function upgradeToAuthenticated(user: UserAccount, email: string): UserAccount {
  if (!user.isAnonymous) {
    throw new UserValidationError('User is already authenticated');
  }

  validateEmail(email);

  return {
    ...user,
    email: email.toLowerCase().trim(),
    isAnonymous: false
  };
}

/**
 * Converts UserAccount to database-safe format
 */
export function toDbFormat(user: UserAccount): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email || null,
    is_anonymous: user.isAnonymous,
    created_at: user.createdAt.toISOString(),
    last_sync_at: user.lastSyncAt?.toISOString() || null
  };
}

/**
 * Converts database format to UserAccount
 */
export function fromDbFormat(dbRecord: Record<string, unknown>): UserAccount {
  const user: UserAccount = {
    id: dbRecord.id as string,
    isAnonymous: dbRecord.is_anonymous as boolean,
    createdAt: new Date(dbRecord.created_at as string)
  };

  if (dbRecord.email) {
    user.email = dbRecord.email as string;
  }

  if (dbRecord.last_sync_at) {
    user.lastSyncAt = new Date(dbRecord.last_sync_at as string);
  }

  // Validate the converted record
  validateUserAccount(user);

  return user;
}

/**
 * Generates a new UUID for user ID
 */
function generateUserId(): string {
  // Simple UUID v4 generation (in production, use a proper UUID library)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * User account utilities
 */
export const UserUtils = {
  /**
   * Gets display name for user
   */
  getDisplayName: (user: UserAccount): string => {
    if (user.email) {
      return user.email.split('@')[0]; // Use part before @ as display name
    }
    return user.isAnonymous ? 'Anonymous User' : 'User';
  },

  /**
   * Checks if user has synced recently
   */
  hasSyncedRecently: (user: UserAccount, hoursThreshold: number = 24): boolean => {
    if (!user.lastSyncAt) return false;
    
    const now = new Date();
    const threshold = hoursThreshold * 60 * 60 * 1000; // Convert hours to ms
    
    return (now.getTime() - user.lastSyncAt.getTime()) < threshold;
  },

  /**
   * Gets sync status description
   */
  getSyncStatusDescription: (user: UserAccount): string => {
    if (user.isAnonymous) {
      return 'Local only (anonymous)';
    }
    
    if (!user.lastSyncAt) {
      return 'Never synced';
    }
    
    const now = new Date();
    const hoursSinceSync = (now.getTime() - user.lastSyncAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync < 1) {
      return 'Synced recently';
    } else if (hoursSinceSync < 24) {
      return `Synced ${Math.floor(hoursSinceSync)} hours ago`;
    } else {
      const daysSinceSync = Math.floor(hoursSinceSync / 24);
      return `Synced ${daysSinceSync} day${daysSinceSync === 1 ? '' : 's'} ago`;
    }
  }
};