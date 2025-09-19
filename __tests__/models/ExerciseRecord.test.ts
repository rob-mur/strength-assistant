/**
 * ExerciseRecord Tests - Comprehensive Coverage
 *
 * Essential test coverage for the ExerciseRecord model focusing on:
 * - Exercise creation and validation
 * - Exercise updates and validation
 * - Sync status management
 * - Database format conversion
 * - Utility functions and sorting
 */

import {
  ExerciseRecord,
  ExerciseRecordInput,
  ExerciseRecordUpdate,
  ExerciseValidationError,
  createExerciseRecord,
  updateExerciseRecord,
  validateExerciseName,
  validateExerciseRecord,
  updateSyncStatus,
  needsSync,
  toDbFormat,
  fromDbFormat,
  ExerciseSort,
} from "../../lib/models/ExerciseRecord";

describe("ExerciseRecord", () => {
  describe("ExerciseValidationError", () => {
    it("should create error with message and field", () => {
      const error = new ExerciseValidationError("Test error", "name");
      expect(error.message).toBe("Test error");
      expect(error.field).toBe("name");
      expect(error.name).toBe("ExerciseValidationError");
    });

    it("should create error without field", () => {
      const error = new ExerciseValidationError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.field).toBeUndefined();
    });
  });

  describe("createExerciseRecord", () => {
    it("should create exercise record with valid input", () => {
      const input: ExerciseRecordInput = {
        name: "Push-ups",
        userId: "user123",
      };

      const record = createExerciseRecord(input);

      expect(record.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(record.name).toBe("Push-ups");
      expect(record.userId).toBe("user123");
      expect(record.syncStatus).toBe("pending");
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });

    it("should create exercise record without userId", () => {
      const input: ExerciseRecordInput = {
        name: "Squats",
      };

      const record = createExerciseRecord(input);

      expect(record.name).toBe("Squats");
      expect(record.userId).toBeUndefined();
    });

    it("should trim exercise name", () => {
      const input: ExerciseRecordInput = {
        name: "  Push-ups  ",
      };

      const record = createExerciseRecord(input);
      expect(record.name).toBe("Push-ups");
    });

    it("should throw error for invalid name", () => {
      const input: ExerciseRecordInput = {
        name: "",
      };

      expect(() => createExerciseRecord(input)).toThrow(
        ExerciseValidationError,
      );
    });
  });

  describe("updateExerciseRecord", () => {
    let existingRecord: ExerciseRecord;

    beforeEach(() => {
      existingRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Original Name",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        userId: "user123",
        syncStatus: "synced",
      };
    });

    it("should update exercise name and mark as pending", () => {
      const updates: ExerciseRecordUpdate = {
        name: "New Name",
      };

      const updated = updateExerciseRecord(existingRecord, updates);

      expect(updated.name).toBe("New Name");
      expect(updated.syncStatus).toBe("pending");
      expect(updated.updatedAt).not.toEqual(existingRecord.updatedAt);
      expect(updated.id).toBe(existingRecord.id);
      expect(updated.createdAt).toEqual(existingRecord.createdAt);
    });

    it("should not update if name is the same", () => {
      const updates: ExerciseRecordUpdate = {
        name: "Original Name",
      };

      const updated = updateExerciseRecord(existingRecord, updates);

      expect(updated.syncStatus).toBe("synced");
      expect(updated.updatedAt).toEqual(existingRecord.updatedAt);
    });

    it("should trim updated name", () => {
      const updates: ExerciseRecordUpdate = {
        name: "  Trimmed Name  ",
      };

      const updated = updateExerciseRecord(existingRecord, updates);
      expect(updated.name).toBe("Trimmed Name");
    });

    it("should throw error for empty updates", () => {
      expect(() => updateExerciseRecord(existingRecord, {})).toThrow(
        ExerciseValidationError,
      );
      expect(() => updateExerciseRecord(existingRecord, {})).toThrow(
        "No updates provided",
      );
    });

    it("should throw error for invalid name", () => {
      const updates: ExerciseRecordUpdate = {
        name: "",
      };

      expect(() => updateExerciseRecord(existingRecord, updates)).toThrow(
        ExerciseValidationError,
      );
    });
  });

  describe("validateExerciseName", () => {
    it("should pass for valid names", () => {
      expect(() => validateExerciseName("Push-ups")).not.toThrow();
      expect(() => validateExerciseName("Bench Press")).not.toThrow();
      expect(() => validateExerciseName("a")).not.toThrow();
    });

    it("should throw error for non-string input", () => {
      expect(() => validateExerciseName(null as any)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseName(undefined as any)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseName(123 as any)).toThrow(
        ExerciseValidationError,
      );
    });

    it("should throw error for empty string", () => {
      expect(() => validateExerciseName("")).toThrow(ExerciseValidationError);
      expect(() => validateExerciseName("   ")).toThrow(
        ExerciseValidationError,
      );
    });

    it("should throw error for too long names", () => {
      const longName = "a".repeat(256);
      expect(() => validateExerciseName(longName)).toThrow(
        ExerciseValidationError,
      );
    });

    it("should include field name in error", () => {
      try {
        validateExerciseName("");
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseValidationError);
        expect((error as ExerciseValidationError).field).toBe("name");
      }
    });

    it("should throw error for names with invalid characters", () => {
      expect(() => validateExerciseName("Exercise<script>")).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseName('Exercise"quote')).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseName("Exercise'quote")).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseName("Exercise&amp")).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseName("Exercise>tag")).toThrow(
        ExerciseValidationError,
      );
    });
  });

  describe("validateExerciseRecord", () => {
    let validRecord: ExerciseRecord;

    beforeEach(() => {
      validRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Valid Exercise",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "pending",
      };
    });

    it("should pass for valid record", () => {
      expect(() => validateExerciseRecord(validRecord)).not.toThrow();
    });

    it("should pass for valid record with userId", () => {
      validRecord.userId = "user123";
      expect(() => validateExerciseRecord(validRecord)).not.toThrow();
    });

    it("should throw error for invalid userId", () => {
      validRecord.userId = "";
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );

      validRecord.userId = "   ";
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );

      validRecord.userId = 123 as any;
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
    });

    it("should throw error for missing or invalid ID", () => {
      validRecord.id = "";
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        "Exercise ID is required",
      );

      validRecord.id = "invalid-uuid";
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        "Exercise ID must be a valid UUID",
      );
    });

    it("should throw error for invalid timestamps", () => {
      validRecord.createdAt = new Date("invalid");
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        "Invalid createdAt timestamp",
      );

      validRecord.createdAt = new Date("2023-01-01");
      validRecord.updatedAt = new Date("invalid");
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        "Invalid updatedAt timestamp",
      );
    });

    it("should throw error when updatedAt is before createdAt", () => {
      validRecord.createdAt = new Date("2023-01-02");
      validRecord.updatedAt = new Date("2023-01-01");
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        "updatedAt cannot be before createdAt",
      );
    });

    it("should throw error for invalid sync status", () => {
      (validRecord as any).syncStatus = "invalid";
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        ExerciseValidationError,
      );
      expect(() => validateExerciseRecord(validRecord)).toThrow(
        "Invalid sync status",
      );
    });
  });

  describe("updateSyncStatus", () => {
    let record: ExerciseRecord;

    beforeEach(() => {
      record = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        syncStatus: "pending",
      };
    });

    it("should update sync status to synced with updated timestamp", () => {
      const updated = updateSyncStatus(record, "synced");

      expect(updated.syncStatus).toBe("synced");
      expect(updated.updatedAt).not.toEqual(record.updatedAt);
      expect(updated.id).toBe(record.id);
      expect(updated.name).toBe(record.name);
    });

    it("should update sync status to error without timestamp change", () => {
      const updated = updateSyncStatus(record, "error");

      expect(updated.syncStatus).toBe("error");
      expect(updated.updatedAt).toEqual(record.updatedAt);
    });

    it("should update sync status to pending without timestamp change", () => {
      const updated = updateSyncStatus(record, "pending");

      expect(updated.syncStatus).toBe("pending");
      expect(updated.updatedAt).toEqual(record.updatedAt);
    });
  });

  describe("needsSync", () => {
    it("should return true for pending status", () => {
      const record: ExerciseRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "pending",
      };

      expect(needsSync(record)).toBe(true);
    });

    it("should return true for error status", () => {
      const record: ExerciseRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "error",
      };

      expect(needsSync(record)).toBe(true);
    });

    it("should return false for synced status", () => {
      const record: ExerciseRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      };

      expect(needsSync(record)).toBe(false);
    });
  });

  describe("toDbFormat", () => {
    it("should convert exercise record to database format", () => {
      const createdAt = new Date("2023-01-01T10:00:00.000Z");
      const updatedAt = new Date("2023-01-02T11:00:00.000Z");

      const record: ExerciseRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        createdAt,
        updatedAt,
        userId: "user123",
        syncStatus: "pending",
      };

      const dbFormat = toDbFormat(record);

      expect(dbFormat).toEqual({
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        created_at: "2023-01-01T10:00:00.000Z",
        updated_at: "2023-01-02T11:00:00.000Z",
        user_id: "user123",
        sync_status: "pending",
      });
    });

    it("should convert record without userId", () => {
      const record: ExerciseRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "synced",
      };

      const dbFormat = toDbFormat(record);
      expect(dbFormat.user_id).toBe(null);
    });
  });

  describe("fromDbFormat", () => {
    it("should convert database format to exercise record", () => {
      const dbRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        created_at: "2023-01-01T10:00:00.000Z",
        updated_at: "2023-01-02T11:00:00.000Z",
        user_id: "user123",
        sync_status: "pending",
      };

      const record = fromDbFormat(dbRecord);

      expect(record.id).toBe("12345678-1234-4123-8123-123456789012");
      expect(record.name).toBe("Test Exercise");
      expect(record.createdAt).toEqual(new Date("2023-01-01T10:00:00.000Z"));
      expect(record.updatedAt).toEqual(new Date("2023-01-02T11:00:00.000Z"));
      expect(record.userId).toBe("user123");
      expect(record.syncStatus).toBe("pending");
    });

    it("should convert record without user_id", () => {
      const dbRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        created_at: "2023-01-01T10:00:00.000Z",
        updated_at: "2023-01-02T11:00:00.000Z",
        user_id: null,
        sync_status: "synced",
      };

      const record = fromDbFormat(dbRecord);
      expect(record.userId).toBeUndefined();
    });

    it("should default to pending for missing sync_status", () => {
      const dbRecord = {
        id: "12345678-1234-4123-8123-123456789012",
        name: "Test Exercise",
        created_at: "2023-01-01T10:00:00.000Z",
        updated_at: "2023-01-02T11:00:00.000Z",
        user_id: null,
      };

      const record = fromDbFormat(dbRecord);
      expect(record.syncStatus).toBe("pending");
    });
  });

  describe("ExerciseSort", () => {
    let exercises: ExerciseRecord[];

    beforeEach(() => {
      exercises = [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Zebra Exercise",
          createdAt: new Date("2023-01-03"),
          updatedAt: new Date("2023-01-06"),
          syncStatus: "synced",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Alpha Exercise",
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-04"),
          syncStatus: "pending",
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Beta Exercise",
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date("2023-01-05"),
          syncStatus: "error",
        },
      ];
    });

    it("should sort by created date", () => {
      const sorted = exercises.sort(ExerciseSort.byCreatedAt);
      expect(sorted.map((e) => e.id)).toEqual([
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
        "11111111-1111-4111-8111-111111111111",
      ]);
    });

    it("should sort by updated date", () => {
      const sorted = exercises.sort(ExerciseSort.byUpdatedAt);
      expect(sorted.map((e) => e.id)).toEqual([
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
        "11111111-1111-4111-8111-111111111111",
      ]);
    });

    it("should sort by name alphabetically", () => {
      const sorted = exercises.sort(ExerciseSort.byName);
      expect(sorted.map((e) => e.name)).toEqual([
        "Alpha Exercise",
        "Beta Exercise",
        "Zebra Exercise",
      ]);
    });

    it("should sort by sync status (error, pending, synced)", () => {
      const sorted = exercises.sort(ExerciseSort.bySyncStatus);
      expect(sorted.map((e) => e.syncStatus)).toEqual([
        "error",
        "pending",
        "synced",
      ]);
    });
  });
});
