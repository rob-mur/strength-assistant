/**
 * UserAccount Model Tests - Comprehensive Coverage
 *
 * Essential test coverage for the UserAccount model focusing on:
 * - User account creation and validation
 * - Authentication types (anonymous vs authenticated)
 * - Email and password validation
 * - Account upgrades and transitions
 * - Database serialization/deserialization
 * - Utility functions and sync status
 */

import {
  UserAccount,
  UserAccountInput,
  AuthCredentials,
  UserValidationError,
  AuthenticationError,
  createUserAccount,
  updateLastSync,
  validateUserInput,
  validateUserAccount,
  validateEmail,
  validatePassword,
  validateCredentials,
  canSyncToCloud,
  needsAccountUpgrade,
  createAnonymousUser,
  createAuthenticatedUser,
  upgradeToAuthenticated,
  toDbFormat,
  fromDbFormat,
  UserUtils,
} from "../../lib/models/UserAccount";

describe("UserAccount Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current time for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Error Classes", () => {
    it("should create UserValidationError with message", () => {
      const error = new UserValidationError("Test validation error");

      expect(error.message).toBe("Test validation error");
      expect(error.name).toBe("UserValidationError");
      expect(error.field).toBeUndefined();
      expect(error instanceof Error).toBe(true);
    });

    it("should create UserValidationError with field", () => {
      const error = new UserValidationError("Test error", "email");

      expect(error.message).toBe("Test error");
      expect(error.field).toBe("email");
    });

    it("should create AuthenticationError with message", () => {
      const error = new AuthenticationError("Auth failed");

      expect(error.message).toBe("Auth failed");
      expect(error.name).toBe("AuthenticationError");
      expect(error.code).toBeUndefined();
    });

    it("should create AuthenticationError with code", () => {
      const error = new AuthenticationError(
        "Auth failed",
        "INVALID_CREDENTIALS",
      );

      expect(error.message).toBe("Auth failed");
      expect(error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("createUserAccount", () => {
    it("should create anonymous user account", () => {
      const input: UserAccountInput = { isAnonymous: true };

      const user = createUserAccount(input);

      expect(user.isAnonymous).toBe(true);
      expect(user.email).toBeUndefined();
      expect(user.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(user.lastSyncAt).toBeUndefined();
    });

    it("should create authenticated user account", () => {
      const input: UserAccountInput = {
        email: "TEST@EXAMPLE.COM  ", // Test trimming and lowercasing
        isAnonymous: false,
      };

      const user = createUserAccount(input);

      expect(user.isAnonymous).toBe(false);
      expect(user.email).toBe("test@example.com");
      expect(user.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should validate input before creating account", () => {
      const invalidInput: UserAccountInput = {
        email: "test@example.com",
        isAnonymous: true,
      };

      expect(() => createUserAccount(invalidInput)).toThrow(
        UserValidationError,
      );
      expect(() => createUserAccount(invalidInput)).toThrow(
        "Anonymous users cannot have email addresses",
      );
    });
  });

  describe("updateLastSync", () => {
    it("should update last sync timestamp", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "test@example.com",
        createdAt: new Date("2023-12-01T00:00:00.000Z"),
      };

      const updated = updateLastSync(user);

      expect(updated).toEqual({
        ...user,
        lastSyncAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Original user should be unchanged
      expect(user.lastSyncAt).toBeUndefined();
    });
  });

  describe("validateUserInput", () => {
    it("should validate anonymous user input", () => {
      const input: UserAccountInput = { isAnonymous: true };

      expect(() => validateUserInput(input)).not.toThrow();
    });

    it("should validate authenticated user input", () => {
      const input: UserAccountInput = {
        email: "test@example.com",
        isAnonymous: false,
      };

      expect(() => validateUserInput(input)).not.toThrow();
    });

    it("should reject anonymous user with email", () => {
      const input: UserAccountInput = {
        email: "test@example.com",
        isAnonymous: true,
      };

      expect(() => validateUserInput(input)).toThrow(
        "Anonymous users cannot have email addresses",
      );
    });

    it("should reject authenticated user without email", () => {
      const input: UserAccountInput = { isAnonymous: false };

      expect(() => validateUserInput(input)).toThrow(
        "Non-anonymous users must have email addresses",
      );
    });

    it("should validate email format when provided", () => {
      const input: UserAccountInput = {
        email: "invalid-email",
        isAnonymous: false,
      };

      expect(() => validateUserInput(input)).toThrow("Invalid email format");
    });
  });

  describe("validateUserAccount", () => {
    let validUser: UserAccount;

    beforeEach(() => {
      validUser = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "test@example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };
    });

    it("should validate complete user account", () => {
      expect(() => validateUserAccount(validUser)).not.toThrow();
    });

    it("should reject missing user ID", () => {
      const user: any = { ...validUser, id: undefined };

      expect(() => validateUserAccount(user)).toThrow("User ID is required");
    });

    it("should reject non-string user ID", () => {
      const user: any = { ...validUser, id: 123 };

      expect(() => validateUserAccount(user)).toThrow("User ID is required");
    });

    it("should reject invalid UUID format", () => {
      const user = { ...validUser, id: "invalid-uuid" };

      expect(() => validateUserAccount(user)).toThrow(
        "User ID must be a valid UUID",
      );
    });

    it("should reject non-boolean isAnonymous", () => {
      const user: any = { ...validUser, isAnonymous: "true" };

      expect(() => validateUserAccount(user)).toThrow(
        "isAnonymous must be a boolean",
      );
    });

    it("should reject anonymous user with email", () => {
      const user = { ...validUser, isAnonymous: true };

      expect(() => validateUserAccount(user)).toThrow(
        "Anonymous users cannot have email addresses",
      );
    });

    it("should reject authenticated user without email", () => {
      const user = { ...validUser, email: undefined };

      expect(() => validateUserAccount(user)).toThrow(
        "Non-anonymous users must have email addresses",
      );
    });

    it("should validate email format", () => {
      const user = { ...validUser, email: "invalid" };

      expect(() => validateUserAccount(user)).toThrow("Invalid email format");
    });

    it("should reject invalid createdAt", () => {
      const user: any = { ...validUser, createdAt: "invalid-date" };

      expect(() => validateUserAccount(user)).toThrow(
        "Invalid createdAt timestamp",
      );
    });

    it("should reject invalid lastSyncAt", () => {
      const user: any = {
        ...validUser,
        lastSyncAt: new Date("invalid"),
      };

      expect(() => validateUserAccount(user)).toThrow(
        "Invalid lastSyncAt timestamp",
      );
    });

    it("should reject lastSyncAt before createdAt", () => {
      const user = {
        ...validUser,
        lastSyncAt: new Date("2023-12-01T00:00:00.000Z"),
      };

      expect(() => validateUserAccount(user)).toThrow(
        "lastSyncAt cannot be before createdAt",
      );
    });

    it("should allow undefined lastSyncAt", () => {
      const user = { ...validUser, lastSyncAt: undefined };

      expect(() => validateUserAccount(user)).not.toThrow();
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "test+tag@example.org",
        "user123@test-domain.com",
      ];

      validEmails.forEach((email) => {
        expect(() => validateEmail(email)).not.toThrow();
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid",
        "@example.com",
        "test@",
        "test@example.",
        "test@.example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(() => validateEmail(email)).toThrow("Invalid email format");
      });
    });

    it("should reject each invalid email format individually", () => {
      expect(() => validateEmail("invalid")).toThrow("Invalid email format");
      expect(() => validateEmail("@example.com")).toThrow(
        "Invalid email format",
      );
      expect(() => validateEmail("test@")).toThrow("Invalid email format");
      expect(() => validateEmail("test@domain.")).toThrow(
        "Invalid email format",
      );
    });

    it("should reject missing email", () => {
      expect(() => validateEmail(undefined as any)).toThrow(
        "Email is required",
      );
      expect(() => validateEmail(null as any)).toThrow("Email is required");
    });

    it("should reject non-string email", () => {
      expect(() => validateEmail(123 as any)).toThrow("Email is required");
    });

    it("should reject empty email", () => {
      expect(() => validateEmail("   ")).toThrow("Email cannot be empty");
    });

    it("should reject email that is too long", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(() => validateEmail(longEmail)).toThrow(
        "Email too long (max 254 characters)",
      );
    });
  });

  describe("validatePassword", () => {
    it("should validate strong passwords", () => {
      const validPasswords = [
        "password123",
        "mySecureP@ss!",
        "Test123456",
        "complex_password_99",
      ];

      validPasswords.forEach((password) => {
        expect(() => validatePassword(password)).not.toThrow();
      });
    });

    it("should reject missing password", () => {
      expect(() => validatePassword(undefined as any)).toThrow(
        "Password is required",
      );
      expect(() => validatePassword(null as any)).toThrow(
        "Password is required",
      );
    });

    it("should reject non-string password", () => {
      expect(() => validatePassword(123 as any)).toThrow(
        "Password is required",
      );
    });

    it("should reject short passwords", () => {
      expect(() => validatePassword("short1")).toThrow(
        "Password must be at least 8 characters long",
      );
    });

    it("should reject long passwords", () => {
      const longPassword = "a".repeat(129);
      expect(() => validatePassword(longPassword)).toThrow(
        "Password too long (max 128 characters)",
      );
    });

    it("should reject passwords without numbers or special characters", () => {
      expect(() => validatePassword("justletters")).toThrow(
        "Password must contain at least one number or special character",
      );
    });
  });

  describe("validateCredentials", () => {
    it("should validate correct credentials", () => {
      const credentials: AuthCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      expect(() => validateCredentials(credentials)).not.toThrow();
    });

    it("should reject invalid email in credentials", () => {
      const credentials: AuthCredentials = {
        email: "invalid-email",
        password: "password123",
      };

      expect(() => validateCredentials(credentials)).toThrow(
        "Invalid email format",
      );
    });

    it("should reject invalid password in credentials", () => {
      const credentials: AuthCredentials = {
        email: "test@example.com",
        password: "weak",
      };

      expect(() => validateCredentials(credentials)).toThrow(
        "Password must be at least 8 characters long",
      );
    });
  });

  describe("canSyncToCloud", () => {
    it("should return true for authenticated user with email", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "test@example.com",
        createdAt: new Date(),
      };

      expect(canSyncToCloud(user)).toBe(true);
    });

    it("should return false for anonymous user", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: true,
        createdAt: new Date(),
      };

      expect(canSyncToCloud(user)).toBe(false);
    });

    it("should return false for user without email", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        createdAt: new Date(),
      };

      expect(canSyncToCloud(user)).toBe(false);
    });
  });

  describe("needsAccountUpgrade", () => {
    it("should return true for anonymous user", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: true,
        createdAt: new Date(),
      };

      expect(needsAccountUpgrade(user)).toBe(true);
    });

    it("should return false for authenticated user", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "test@example.com",
        createdAt: new Date(),
      };

      expect(needsAccountUpgrade(user)).toBe(false);
    });
  });

  describe("createAnonymousUser", () => {
    it("should create anonymous user account", () => {
      const user = createAnonymousUser();

      expect(user.isAnonymous).toBe(true);
      expect(user.email).toBeUndefined();
      expect(user.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("createAuthenticatedUser", () => {
    it("should create authenticated user account", () => {
      const user = createAuthenticatedUser("TEST@EXAMPLE.COM  ");

      expect(user.isAnonymous).toBe(false);
      expect(user.email).toBe("test@example.com");
      expect(user.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("upgradeToAuthenticated", () => {
    it("should upgrade anonymous user to authenticated", () => {
      const anonymousUser: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const upgraded = upgradeToAuthenticated(
        anonymousUser,
        "NEW@EXAMPLE.COM  ",
      );

      expect(upgraded).toEqual({
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "new@example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Original user should be unchanged
      expect(anonymousUser.isAnonymous).toBe(true);
      expect(anonymousUser.email).toBeUndefined();
    });

    it("should reject upgrading already authenticated user", () => {
      const authenticatedUser: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "existing@example.com",
        createdAt: new Date(),
      };

      expect(() =>
        upgradeToAuthenticated(authenticatedUser, "new@example.com"),
      ).toThrow("User is already authenticated");
    });

    it("should validate email during upgrade", () => {
      const anonymousUser: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: true,
        createdAt: new Date(),
      };

      expect(() =>
        upgradeToAuthenticated(anonymousUser, "invalid-email"),
      ).toThrow("Invalid email format");
    });
  });

  describe("toDbFormat", () => {
    it("should convert user account to database format", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "test@example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        lastSyncAt: new Date("2024-01-01T12:00:00.000Z"),
      };

      const dbFormat = toDbFormat(user);

      expect(dbFormat).toEqual({
        id: "123e4567-e89b-42d3-9456-426614174000",
        email: "test@example.com",
        is_anonymous: false,
        created_at: "2024-01-01T00:00:00.000Z",
        last_sync_at: "2024-01-01T12:00:00.000Z",
      });
    });

    it("should handle optional fields as null", () => {
      const user: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const dbFormat = toDbFormat(user);

      expect(dbFormat.email).toBeNull();
      expect(dbFormat.last_sync_at).toBeNull();
    });
  });

  describe("fromDbFormat", () => {
    it("should convert database format to user account", () => {
      const dbRecord = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        email: "test@example.com",
        is_anonymous: false,
        created_at: "2024-01-01T00:00:00.000Z",
        last_sync_at: "2024-01-01T12:00:00.000Z",
      };

      const user = fromDbFormat(dbRecord);

      expect(user).toEqual({
        id: "123e4567-e89b-42d3-9456-426614174000",
        email: "test@example.com",
        isAnonymous: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        lastSyncAt: new Date("2024-01-01T12:00:00.000Z"),
      });
    });

    it("should handle null optional fields", () => {
      const dbRecord = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        email: null,
        is_anonymous: true,
        created_at: "2024-01-01T00:00:00.000Z",
        last_sync_at: null,
      };

      const user = fromDbFormat(dbRecord);

      expect(user.email).toBeUndefined();
      expect(user.lastSyncAt).toBeUndefined();
      expect(user.isAnonymous).toBe(true);
    });

    it("should validate converted record", () => {
      const invalidDbRecord = {
        id: "invalid-uuid",
        email: null,
        is_anonymous: true,
        created_at: "2024-01-01T00:00:00.000Z",
      };

      expect(() => fromDbFormat(invalidDbRecord)).toThrow(UserValidationError);
    });
  });

  describe("UserUtils", () => {
    describe("getDisplayName", () => {
      it("should return email prefix for authenticated user", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "john.doe@example.com",
          createdAt: new Date(),
        };

        expect(UserUtils.getDisplayName(user)).toBe("john.doe");
      });

      it('should return "Anonymous User" for anonymous user', () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: true,
          createdAt: new Date(),
        };

        expect(UserUtils.getDisplayName(user)).toBe("Anonymous User");
      });

      it('should return "User" for authenticated user without email', () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          createdAt: new Date(),
        };

        expect(UserUtils.getDisplayName(user)).toBe("User");
      });
    });

    describe("hasSyncedRecently", () => {
      it("should return true for recent sync within threshold", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-31T00:00:00.000Z"),
          lastSyncAt: new Date("2023-12-31T23:00:00.000Z"), // 1 hour ago
        };

        expect(UserUtils.hasSyncedRecently(user, 24)).toBe(true);
      });

      it("should return false for sync beyond threshold", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-30T00:00:00.000Z"),
          lastSyncAt: new Date("2023-12-30T12:00:00.000Z"), // More than 24 hours ago
        };

        expect(UserUtils.hasSyncedRecently(user, 24)).toBe(false);
      });

      it("should return false when no sync recorded", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date(),
        };

        expect(UserUtils.hasSyncedRecently(user)).toBe(false);
      });

      it("should use default threshold of 24 hours", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-31T00:00:00.000Z"),
          lastSyncAt: new Date("2023-12-31T12:00:00.000Z"), // 12 hours ago
        };

        expect(UserUtils.hasSyncedRecently(user)).toBe(true);
      });
    });

    describe("getSyncStatusDescription", () => {
      it('should return "Local only" for anonymous user', () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: true,
          createdAt: new Date(),
        };

        expect(UserUtils.getSyncStatusDescription(user)).toBe(
          "Local only (anonymous)",
        );
      });

      it('should return "Never synced" for user without sync', () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date(),
        };

        expect(UserUtils.getSyncStatusDescription(user)).toBe("Never synced");
      });

      it('should return "Synced recently" for sync within 1 hour', () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-31T23:30:00.000Z"),
          lastSyncAt: new Date("2023-12-31T23:30:00.000Z"), // 30 minutes ago
        };

        expect(UserUtils.getSyncStatusDescription(user)).toBe(
          "Synced recently",
        );
      });

      it("should return hours for sync within 24 hours", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-31T20:00:00.000Z"),
          lastSyncAt: new Date("2023-12-31T20:00:00.000Z"), // 4 hours ago
        };

        expect(UserUtils.getSyncStatusDescription(user)).toBe(
          "Synced 4 hours ago",
        );
      });

      it("should return single day for 1 day ago", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-30T12:00:00.000Z"),
          lastSyncAt: new Date("2023-12-30T12:00:00.000Z"), // More than 24 hours ago
        };

        expect(UserUtils.getSyncStatusDescription(user)).toBe(
          "Synced 1 day ago",
        );
      });

      it("should return multiple days for more than 1 day ago", () => {
        const user: UserAccount = {
          id: "123e4567-e89b-42d3-9456-426614174000",
          isAnonymous: false,
          email: "test@example.com",
          createdAt: new Date("2023-12-28T00:00:00.000Z"),
          lastSyncAt: new Date("2023-12-28T00:00:00.000Z"), // Exactly 4 days ago
        };

        expect(UserUtils.getSyncStatusDescription(user)).toBe(
          "Synced 4 days ago",
        );
      });
    });
  });

  describe("UUID Generation and Validation", () => {
    it("should generate valid UUID format for user ID", () => {
      const user1 = createAnonymousUser();
      const user2 = createAnonymousUser();

      // Should be valid UUID v4 format
      expect(user1.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(user2.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      // Should be unique
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete user lifecycle", () => {
      // Create anonymous user
      let user = createAnonymousUser();
      expect(user.isAnonymous).toBe(true);
      expect(needsAccountUpgrade(user)).toBe(true);
      expect(canSyncToCloud(user)).toBe(false);

      // Upgrade to authenticated
      user = upgradeToAuthenticated(user, "test@example.com");
      expect(user.isAnonymous).toBe(false);
      expect(user.email).toBe("test@example.com");
      expect(needsAccountUpgrade(user)).toBe(false);
      expect(canSyncToCloud(user)).toBe(true);

      // Update sync timestamp
      user = updateLastSync(user);
      expect(user.lastSyncAt).toBeDefined();
      expect(UserUtils.hasSyncedRecently(user)).toBe(true);
    });

    it("should handle database serialization round trip", () => {
      const originalUser: UserAccount = {
        id: "123e4567-e89b-42d3-9456-426614174000",
        isAnonymous: false,
        email: "test@example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        lastSyncAt: new Date("2024-01-01T12:00:00.000Z"),
      };

      const dbFormat = toDbFormat(originalUser);
      const restoredUser = fromDbFormat(dbFormat);

      expect(restoredUser).toEqual(originalUser);
    });

    it("should validate credentials for registration flow", () => {
      const credentials: AuthCredentials = {
        email: "newuser@example.com",
        password: "SecurePass123!",
      };

      expect(() => validateCredentials(credentials)).not.toThrow();

      const user = createAuthenticatedUser(credentials.email);
      expect(user.email).toBe("newuser@example.com");
      expect(user.isAnonymous).toBe(false);
    });
  });
});
