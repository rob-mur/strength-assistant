/**
 * Unit Test: SyncStateRecord Model
 *
 * This test verifies that the SyncStateRecord model functions correctly,
 * including validation, state management, and utility methods.
 */

import {
  SyncStateRecord,
  SyncStateInput,
  createSyncState,
  recordSyncFailure,
  isReadyForRetry,
  hasFailedPermanently,
  resetForRetry,
  validateSyncStateInput,
  validateSyncStateRecord,
  getSyncPriority,
  getTimeUntilRetry,
  toDbFormat,
  fromDbFormat,
  SyncStateUtils,
  SYNC_CONFIG,
} from "../../lib/models/SyncStateRecord";

describe("SyncStateRecord Model", () => {
  describe("createSyncState", () => {
    it("should create a valid SyncStateRecord", () => {
      const input: SyncStateInput = {
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      };
      const record = createSyncState(input);
      expect(record).toBeDefined();
      expect(record.attempts).toBe(0);
    });

    it("should throw an error for invalid input", () => {
      expect(() => {
        createSyncState({} as any);
      }).toThrow();
    });
  });

  describe("recordSyncFailure", () => {
    it("should increment attempts and set retry time", () => {
      const initialState = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      const failedState = recordSyncFailure(initialState, "Test error");
      expect(failedState.attempts).toBe(1);
      expect(failedState.lastError).toBe("Test error");
      expect(failedState.nextRetryAt).toBeDefined();
    });

    it("should throw an error if max attempts exceeded", () => {
      let state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      for (let i = 0; i < SYNC_CONFIG.MAX_ATTEMPTS; i++) {
        state = recordSyncFailure(state, "Test error");
      }
      expect(() => {
        recordSyncFailure(state, "Test error");
      }).toThrow();
    });
  });

  describe("isReadyForRetry", () => {
    it("should be true for a new record", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      expect(isReadyForRetry(state)).toBe(true);
    });

    it("should be false if nextRetryAt is in the future", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      const failedState = recordSyncFailure(state, "Test error");
      expect(isReadyForRetry(failedState)).toBe(false);
    });

    it("should be true if nextRetryAt is in the past", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      let failedState = recordSyncFailure(state, "Test error");
      failedState.nextRetryAt = new Date(Date.now() - 1000);
      expect(isReadyForRetry(failedState)).toBe(true);
    });
  });

  describe("hasFailedPermanently", () => {
    it("should be false if attempts are less than max", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      expect(hasFailedPermanently(state)).toBe(false);
    });

    it("should be true if attempts are equal to max", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      state.attempts = SYNC_CONFIG.MAX_ATTEMPTS;
      expect(hasFailedPermanently(state)).toBe(true);
    });
  });

  describe("resetForRetry", () => {
    it("should reset the state for retry", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      let failedState = recordSyncFailure(state, "Test error");
      const resetState = resetForRetry(failedState);
      expect(resetState.attempts).toBe(0);
      expect(resetState.lastError).toBeUndefined();
      expect(resetState.nextRetryAt).toBeUndefined();
    });
  });

  describe("validateSyncStateInput", () => {
    it("should not throw for valid input", () => {
      const input: SyncStateInput = {
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      };
      expect(() => validateSyncStateInput(input)).not.toThrow();
    });

    it("should throw for missing recordId", () => {
      const input: SyncStateInput = {
        recordId: "",
        recordType: "exercise",
        operation: "create",
      };
      expect(() => validateSyncStateInput(input)).toThrow();
    });

    it("should throw for missing recordType", () => {
      const input: SyncStateInput = {
        recordId: "test-record-id",
        recordType: "",
        operation: "create",
      };
      expect(() => validateSyncStateInput(input)).toThrow();
    });

    it("should throw for invalid operation", () => {
      const input: SyncStateInput = {
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "invalid" as any,
      };
      expect(() => validateSyncStateInput(input)).toThrow();
    });
  });

  describe("validateSyncStateRecord", () => {
    it("should not throw for valid record", () => {
      const record = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      expect(() => validateSyncStateRecord(record)).not.toThrow();
    });

    it("should throw for invalid pendingSince", () => {
      const record = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      record.pendingSince = new Date("invalid");
      expect(() => validateSyncStateRecord(record)).toThrow();
    });

    it("should throw for invalid attempts", () => {
      const record = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      record.attempts = -1;
      expect(() => validateSyncStateRecord(record)).toThrow();
    });
  });

  describe("toDbFormat and fromDbFormat", () => {
    it("should convert to and from db format", () => {
      const record = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
        payload: { name: "test" },
      });
      const dbFormat = toDbFormat(record);
      const fromFormat = fromDbFormat(dbFormat);
      expect(fromFormat).toEqual(record);
    });

    it("should handle null payload", () => {
      const record = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      const dbFormat = toDbFormat(record);
      const fromFormat = fromDbFormat(dbFormat);
      expect(fromFormat.payload).toBeUndefined();
    });

    it("should handle invalid payload JSON", () => {
      const record = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      const dbFormat = toDbFormat(record);
      dbFormat.payload = "{invalid json}";
      const fromFormat = fromDbFormat(dbFormat);
      expect(fromFormat.payload).toBeUndefined();
    });
  });

  describe("getSyncPriority", () => {
    it("should return high priority for new records", () => {
      const state = createSyncState({
        recordId: "1",
        recordType: "A",
        operation: "create",
      });
      expect(getSyncPriority(state)).toBe(100);
    });

    it("should return medium priority for records with few attempts", () => {
      let state = createSyncState({
        recordId: "1",
        recordType: "A",
        operation: "create",
      });
      state = recordSyncFailure(state, "error");
      expect(getSyncPriority(state)).toBe(50);
    });

    it("should return low priority for records with many attempts", () => {
      let state = createSyncState({
        recordId: "1",
        recordType: "A",
        operation: "create",
      });
      for (let i = 0; i < 3; i++) {
        state = recordSyncFailure(state, "error");
      }
      expect(getSyncPriority(state)).toBe(10);
    });
  });

  describe("getTimeUntilRetry", () => {
    it("should return 0 for new records", () => {
      const state = createSyncState({
        recordId: "1",
        recordType: "A",
        operation: "create",
      });
      expect(getTimeUntilRetry(state)).toBe(0);
    });

    it("should return time until next retry", () => {
      let state = createSyncState({
        recordId: "1",
        recordType: "A",
        operation: "create",
      });
      state = recordSyncFailure(state, "error");
      expect(getTimeUntilRetry(state)).toBeGreaterThan(0);
    });
  });

  describe("SyncStateUtils", () => {
    it("should get ready to sync items", () => {
      const states = [
        createSyncState({
          recordId: "1",
          recordType: "exercise",
          operation: "create",
        }),
        recordSyncFailure(
          createSyncState({
            recordId: "2",
            recordType: "exercise",
            operation: "update",
          }),
          "error",
        ),
      ];
      const ready = SyncStateUtils.getReadyForSync(states);
      expect(ready.length).toBe(1);
      expect(ready[0].recordId).toBe("1");
    });

    it("should get permanently failed items", () => {
      const state = createSyncState({
        recordId: "test-record-id",
        recordType: "exercise",
        operation: "create",
      });
      for (let i = 0; i < SYNC_CONFIG.MAX_ATTEMPTS; i++) {
        state.attempts++;
      }
      const failed = SyncStateUtils.getPermanentlyFailed([state]);
      expect(failed.length).toBe(1);
    });

    it("should group by record type", () => {
      const states = [
        createSyncState({
          recordId: "1",
          recordType: "A",
          operation: "create",
        }),
        createSyncState({
          recordId: "2",
          recordType: "B",
          operation: "create",
        }),
        createSyncState({
          recordId: "3",
          recordType: "A",
          operation: "create",
        }),
      ];
      const grouped = SyncStateUtils.groupByRecordType(states);
      expect(grouped["A"].length).toBe(2);
      expect(grouped["B"].length).toBe(1);
    });

    it("should group by operation", () => {
      const states = [
        createSyncState({
          recordId: "1",
          recordType: "A",
          operation: "create",
        }),
        createSyncState({
          recordId: "2",
          recordType: "B",
          operation: "update",
        }),
        createSyncState({
          recordId: "3",
          recordType: "A",
          operation: "create",
        }),
      ];
      const grouped = SyncStateUtils.groupByOperation(states);
      expect(grouped["create"].length).toBe(2);
      expect(grouped["update"].length).toBe(1);
    });

    it("should get statistics", () => {
      const states = [
        createSyncState({
          recordId: "1",
          recordType: "A",
          operation: "create",
        }),
        recordSyncFailure(
          createSyncState({
            recordId: "2",
            recordType: "B",
            operation: "update",
          }),
          "error",
        ),
      ];
      const stats = SyncStateUtils.getStatistics(states);
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.retrying).toBe(1);
    });

    it("should get next retry time", () => {
      const states = [
        recordSyncFailure(
          createSyncState({
            recordId: "1",
            recordType: "A",
            operation: "create",
          }),
          "error",
        ),
        recordSyncFailure(
          createSyncState({
            recordId: "2",
            recordType: "B",
            operation: "update",
          }),
          "error",
        ),
      ];
      const nextRetry = SyncStateUtils.getNextRetryTime(states);
      expect(nextRetry).toBeDefined();
    });

    it("should estimate completion time", () => {
      const states = [
        createSyncState({
          recordId: "1",
          recordType: "A",
          operation: "create",
        }),
        recordSyncFailure(
          createSyncState({
            recordId: "2",
            recordType: "B",
            operation: "update",
          }),
          "error",
        ),
      ];
      const completionTime = SyncStateUtils.estimateCompletionTime(states);
      expect(completionTime).toBeDefined();
    });
  });
});
