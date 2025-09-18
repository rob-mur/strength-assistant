/**
 * SyncStateRecord Model Tests - Comprehensive Coverage
 * 
 * Essential test coverage for the SyncStateRecord model focusing on:
 * - Sync state creation and validation
 * - State transitions and error recovery
 * - Retry logic and attempt tracking
 * - Database serialization/deserialization
 * - Utility functions and statistics
 */

import {
  SyncStateRecord,
  SyncStateInput,
  SyncOperationType,
  SyncValidationError,
  SYNC_CONFIG,
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
  SyncStateUtils
} from '../../lib/models/SyncStateRecord';

describe('SyncStateRecord Model', () => {
  const originalConsole = console;
  const mockConsole = {
    warn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(console, mockConsole);
    // Mock current time for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
    jest.useRealTimers();
  });

  describe('Types and Constants', () => {
    it('should define correct sync operation types', () => {
      const operations: SyncOperationType[] = ['create', 'update', 'delete'];
      expect(operations).toEqual(['create', 'update', 'delete']);
    });

    it('should define sync configuration constants', () => {
      expect(SYNC_CONFIG.MAX_ATTEMPTS).toBe(5);
      expect(SYNC_CONFIG.RETRY_DELAYS).toEqual([1000, 5000, 30000, 120000, 600000]);
      expect(SYNC_CONFIG.BACKOFF_TYPE).toBe('exponential');
    });
  });

  describe('SyncValidationError', () => {
    it('should create validation error with message', () => {
      const error = new SyncValidationError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SyncValidationError');
      expect(error.field).toBeUndefined();
      expect(error instanceof Error).toBe(true);
    });

    it('should create validation error with field', () => {
      const error = new SyncValidationError('Test error', 'testField');
      
      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
    });
  });

  describe('createSyncState', () => {
    it('should create sync state with required fields', () => {
      const input: SyncStateInput = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create'
      };

      const syncState = createSyncState(input);

      expect(syncState).toEqual({
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 0,
        payload: undefined
      });
    });

    it('should create sync state with payload', () => {
      const input: SyncStateInput = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'update',
        payload: { name: 'Updated Exercise', reps: 10 }
      };

      const syncState = createSyncState(input);

      expect(syncState.payload).toEqual({ name: 'Updated Exercise', reps: 10 });
    });

    it('should validate input before creating sync state', () => {
      const invalidInput: SyncStateInput = {
        recordId: '',
        recordType: 'exercise',
        operation: 'create'
      };

      expect(() => createSyncState(invalidInput)).toThrow(SyncValidationError);
      expect(() => createSyncState(invalidInput)).toThrow('Record ID is required');
    });
  });

  describe('recordSyncFailure', () => {
    let baseSyncState: SyncStateRecord;

    beforeEach(() => {
      baseSyncState = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 0
      };
    });

    it('should record first failure', () => {
      const result = recordSyncFailure(baseSyncState, 'Network error');

      expect(result).toEqual({
        ...baseSyncState,
        attempts: 1,
        lastError: 'Network error',
        nextRetryAt: new Date('2024-01-01T00:00:01.000Z') // 1 second later
      });
    });

    it('should record subsequent failures with increasing delays', () => {
      const state1 = { ...baseSyncState, attempts: 1 };
      const result = recordSyncFailure(state1, 'Second error');

      expect(result.attempts).toBe(2);
      expect(result.lastError).toBe('Second error');
      expect(result.nextRetryAt).toEqual(new Date('2024-01-01T00:00:05.000Z')); // 5 seconds later
    });

    it('should use maximum delay for attempts beyond configured delays', () => {
      const state = { ...baseSyncState, attempts: 4 }; // Within max attempts (5)
      const result = recordSyncFailure(state, 'Max delay error');

      expect(result.nextRetryAt).toEqual(new Date('2024-01-01T00:10:00.000Z')); // 600 seconds (max delay)
    });

    it('should throw error when max attempts exceeded', () => {
      const state = { ...baseSyncState, attempts: SYNC_CONFIG.MAX_ATTEMPTS };

      expect(() => recordSyncFailure(state, 'Error')).toThrow(SyncValidationError);
      expect(() => recordSyncFailure(state, 'Error')).toThrow('Maximum sync attempts exceeded');
    });

    it('should preserve original state properties', () => {
      const stateWithPayload = {
        ...baseSyncState,
        payload: { test: 'data' }
      };

      const result = recordSyncFailure(stateWithPayload, 'Error');

      expect(result.recordId).toBe(baseSyncState.recordId);
      expect(result.recordType).toBe(baseSyncState.recordType);
      expect(result.operation).toBe(baseSyncState.operation);
      expect(result.pendingSince).toBe(baseSyncState.pendingSince);
      expect(result.payload).toEqual({ test: 'data' });
    });
  });

  describe('isReadyForRetry', () => {
    it('should return true for first attempt', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 0
      };

      expect(isReadyForRetry(syncState)).toBe(true);
    });

    it('should return false when max attempts exceeded', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: SYNC_CONFIG.MAX_ATTEMPTS
      };

      expect(isReadyForRetry(syncState)).toBe(false);
    });

    it('should return true when no retry time is set', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 2
      };

      expect(isReadyForRetry(syncState)).toBe(true);
    });

    it('should return false when retry time is in the future', () => {
      const futureTime = new Date('2024-01-01T00:10:00.000Z');
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 2,
        nextRetryAt: futureTime
      };

      expect(isReadyForRetry(syncState)).toBe(false);
    });

    it('should return true when retry time has passed', () => {
      jest.setSystemTime(new Date('2024-01-01T00:10:00.000Z'));
      
      const pastTime = new Date('2024-01-01T00:05:00.000Z');
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 2,
        nextRetryAt: pastTime
      };

      expect(isReadyForRetry(syncState)).toBe(true);
    });
  });

  describe('hasFailedPermanently', () => {
    it('should return false for sync state with attempts under limit', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: SYNC_CONFIG.MAX_ATTEMPTS - 1
      };

      expect(hasFailedPermanently(syncState)).toBe(false);
    });

    it('should return true for sync state with max attempts', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: SYNC_CONFIG.MAX_ATTEMPTS
      };

      expect(hasFailedPermanently(syncState)).toBe(true);
    });

    it('should return true for sync state exceeding max attempts', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: SYNC_CONFIG.MAX_ATTEMPTS + 1
      };

      expect(hasFailedPermanently(syncState)).toBe(true);
    });
  });

  describe('resetForRetry', () => {
    it('should reset sync state for manual retry', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2023-12-01T00:00:00.000Z'),
        attempts: 3,
        lastError: 'Previous error',
        nextRetryAt: new Date('2024-01-01T00:05:00.000Z'),
        payload: { test: 'data' }
      };

      const result = resetForRetry(syncState);

      expect(result).toEqual({
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'), // Current time
        attempts: 0,
        lastError: undefined,
        nextRetryAt: undefined,
        payload: { test: 'data' }
      });
    });
  });

  describe('validateSyncStateInput', () => {
    it('should validate valid input', () => {
      const validInput: SyncStateInput = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create'
      };

      expect(() => validateSyncStateInput(validInput)).not.toThrow();
    });

    it('should throw error for missing recordId', () => {
      const input: any = {
        recordType: 'exercise',
        operation: 'create'
      };

      expect(() => validateSyncStateInput(input)).toThrow(SyncValidationError);
      expect(() => validateSyncStateInput(input)).toThrow('Record ID is required');
    });

    it('should throw error for empty recordId', () => {
      const input: SyncStateInput = {
        recordId: '',
        recordType: 'exercise',
        operation: 'create'
      };

      expect(() => validateSyncStateInput(input)).toThrow('Record ID is required');
    });

    it('should throw error for non-string recordId', () => {
      const input: any = {
        recordId: 123,
        recordType: 'exercise',
        operation: 'create'
      };

      expect(() => validateSyncStateInput(input)).toThrow('Record ID is required');
    });

    it('should throw error for missing recordType', () => {
      const input: any = {
        recordId: 'test-123',
        operation: 'create'
      };

      expect(() => validateSyncStateInput(input)).toThrow('Record type is required');
    });

    it('should throw error for invalid operation', () => {
      const input: any = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'invalid'
      };

      expect(() => validateSyncStateInput(input)).toThrow('Invalid operation');
    });
  });

  describe('validateSyncStateRecord', () => {
    let validSyncState: SyncStateRecord;

    beforeEach(() => {
      validSyncState = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 2
      };
    });

    it('should validate complete sync state record', () => {
      expect(() => validateSyncStateRecord(validSyncState)).not.toThrow();
    });

    it('should throw error for invalid pendingSince', () => {
      const invalidState = {
        ...validSyncState,
        pendingSince: new Date('invalid')
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('Invalid pendingSince timestamp');
    });

    it('should throw error for non-Date pendingSince', () => {
      const invalidState: any = {
        ...validSyncState,
        pendingSince: '2024-01-01'
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('Invalid pendingSince timestamp');
    });

    it('should throw error for negative attempts', () => {
      const invalidState = {
        ...validSyncState,
        attempts: -1
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('Invalid attempts count');
    });

    it('should throw error for non-number attempts', () => {
      const invalidState: any = {
        ...validSyncState,
        attempts: '2'
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('Invalid attempts count');
    });

    it('should throw error for attempts exceeding maximum', () => {
      const invalidState = {
        ...validSyncState,
        attempts: SYNC_CONFIG.MAX_ATTEMPTS + 1
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('Attempts count exceeds maximum');
    });

    it('should throw error for invalid nextRetryAt', () => {
      const invalidState = {
        ...validSyncState,
        nextRetryAt: new Date('invalid')
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('Invalid nextRetryAt timestamp');
    });

    it('should throw error for non-string lastError', () => {
      const invalidState: any = {
        ...validSyncState,
        lastError: 123
      };

      expect(() => validateSyncStateRecord(invalidState)).toThrow('lastError must be a string');
    });

    it('should allow undefined lastError', () => {
      const stateWithUndefinedError = {
        ...validSyncState,
        lastError: undefined
      };

      expect(() => validateSyncStateRecord(stateWithUndefinedError)).not.toThrow();
    });
  });

  describe('getSyncPriority', () => {
    it('should return high priority for first attempt', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 0
      };

      expect(getSyncPriority(syncState)).toBe(100);
    });

    it('should return medium priority for few attempts', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 2
      };

      expect(getSyncPriority(syncState)).toBe(50);
    });

    it('should return low priority for many attempts', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 3
      };

      expect(getSyncPriority(syncState)).toBe(10);
    });

    it('should return low priority for max attempts', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: SYNC_CONFIG.MAX_ATTEMPTS
      };

      expect(getSyncPriority(syncState)).toBe(10);
    });
  });

  describe('getTimeUntilRetry', () => {
    it('should return 0 when no retry time is set', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 1
      };

      expect(getTimeUntilRetry(syncState)).toBe(0);
    });

    it('should return time until retry when in future', () => {
      const futureTime = new Date('2024-01-01T00:05:00.000Z'); // 5 minutes from system time
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 1,
        nextRetryAt: futureTime
      };

      expect(getTimeUntilRetry(syncState)).toBe(300000); // 5 minutes in milliseconds
    });

    it('should return 0 when retry time has passed', () => {
      const pastTime = new Date('2023-12-31T23:55:00.000Z'); // Before system time
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date(),
        attempts: 1,
        nextRetryAt: pastTime
      };

      expect(getTimeUntilRetry(syncState)).toBe(0);
    });
  });

  describe('toDbFormat', () => {
    it('should convert sync state to database format', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 2,
        lastError: 'Network error',
        nextRetryAt: new Date('2024-01-01T00:05:00.000Z'),
        payload: { name: 'Test Exercise', reps: 10 }
      };

      const dbFormat = toDbFormat(syncState);

      expect(dbFormat).toEqual({
        record_id: 'test-123',
        record_type: 'exercise',
        operation: 'create',
        pending_since: '2024-01-01T00:00:00.000Z',
        attempts: 2,
        last_error: 'Network error',
        next_retry_at: '2024-01-01T00:05:00.000Z',
        payload: '{"name":"Test Exercise","reps":10}'
      });
    });

    it('should handle optional fields as null', () => {
      const syncState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 0
      };

      const dbFormat = toDbFormat(syncState);

      expect(dbFormat.last_error).toBeNull();
      expect(dbFormat.next_retry_at).toBeNull();
      expect(dbFormat.payload).toBeNull();
    });
  });

  describe('fromDbFormat', () => {
    it('should convert database format to sync state', () => {
      const dbRecord = {
        record_id: 'test-123',
        record_type: 'exercise',
        operation: 'create',
        pending_since: '2024-01-01T00:00:00.000Z',
        attempts: 2,
        last_error: 'Network error',
        next_retry_at: '2024-01-01T00:05:00.000Z',
        payload: '{"name":"Test Exercise","reps":10}'
      };

      const syncState = fromDbFormat(dbRecord);

      expect(syncState).toEqual({
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'create',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 2,
        lastError: 'Network error',
        nextRetryAt: new Date('2024-01-01T00:05:00.000Z'),
        payload: { name: 'Test Exercise', reps: 10 }
      });
    });

    it('should handle null optional fields', () => {
      const dbRecord = {
        record_id: 'test-123',
        record_type: 'exercise',
        operation: 'create',
        pending_since: '2024-01-01T00:00:00.000Z',
        attempts: 0,
        last_error: null,
        next_retry_at: null,
        payload: null
      };

      const syncState = fromDbFormat(dbRecord);

      expect(syncState.lastError).toBeUndefined();
      expect(syncState.nextRetryAt).toBeUndefined();
      expect(syncState.payload).toBeUndefined();
    });

    it('should handle invalid JSON payload gracefully', () => {
      const dbRecord = {
        record_id: 'test-123',
        record_type: 'exercise',
        operation: 'create',
        pending_since: '2024-01-01T00:00:00.000Z',
        attempts: 0,
        payload: 'invalid json{'
      };

      const syncState = fromDbFormat(dbRecord);

      expect(syncState.payload).toBeUndefined();
      expect(mockConsole.warn).toHaveBeenCalledWith('Failed to parse sync state payload:', expect.any(Error));
    });

    it('should validate converted record', () => {
      const invalidDbRecord = {
        record_id: '',
        record_type: 'exercise',
        operation: 'create',
        pending_since: '2024-01-01T00:00:00.000Z',
        attempts: 0
      };

      expect(() => fromDbFormat(invalidDbRecord)).toThrow(SyncValidationError);
    });
  });

  describe('SyncStateUtils', () => {
    let sampleSyncStates: SyncStateRecord[];

    beforeEach(() => {
      sampleSyncStates = [
        {
          recordId: 'state-1',
          recordType: 'exercise',
          operation: 'create',
          pendingSince: new Date('2024-01-01T00:00:00.000Z'),
          attempts: 0
        },
        {
          recordId: 'state-2',
          recordType: 'exercise',
          operation: 'update',
          pendingSince: new Date('2024-01-01T00:00:00.000Z'),
          attempts: 2,
          nextRetryAt: new Date('2024-01-01T00:10:00.000Z') // Future
        },
        {
          recordId: 'state-3',
          recordType: 'user',
          operation: 'delete',
          pendingSince: new Date('2024-01-01T00:00:00.000Z'),
          attempts: SYNC_CONFIG.MAX_ATTEMPTS // Failed permanently
        },
        {
          recordId: 'state-4',
          recordType: 'exercise',
          operation: 'update',
          pendingSince: new Date('2024-01-01T00:00:00.000Z'),
          attempts: 1
        }
      ];
    });

    describe('getReadyForSync', () => {
      it('should return states ready for sync sorted by priority', () => {
        const readyStates = SyncStateUtils.getReadyForSync(sampleSyncStates);

        expect(readyStates).toHaveLength(2); // state-1 (0 attempts) and state-4 (1 attempt)
        expect(readyStates[0].recordId).toBe('state-1'); // Higher priority (0 attempts)
        expect(readyStates[1].recordId).toBe('state-4'); // Lower priority (1 attempt)
      });

      it('should exclude permanently failed states', () => {
        const readyStates = SyncStateUtils.getReadyForSync(sampleSyncStates);

        expect(readyStates.find(s => s.recordId === 'state-3')).toBeUndefined();
      });

      it('should exclude states not ready for retry', () => {
        const readyStates = SyncStateUtils.getReadyForSync(sampleSyncStates);

        expect(readyStates.find(s => s.recordId === 'state-2')).toBeUndefined();
      });
    });

    describe('getPermanentlyFailed', () => {
      it('should return permanently failed states', () => {
        const failedStates = SyncStateUtils.getPermanentlyFailed(sampleSyncStates);

        expect(failedStates).toHaveLength(1);
        expect(failedStates[0].recordId).toBe('state-3');
      });
    });

    describe('getStatistics', () => {
      it('should calculate correct statistics', () => {
        const stats = SyncStateUtils.getStatistics(sampleSyncStates);

        expect(stats).toEqual({
          total: 4,
          pending: 1,      // state-1 (0 attempts)
          retrying: 2,     // state-2, state-4 (>0 attempts, not failed)
          failed: 1,       // state-3 (max attempts)
          readyToSync: 2   // state-1, state-4 (ready for retry)
        });
      });

      it('should handle empty array', () => {
        const stats = SyncStateUtils.getStatistics([]);

        expect(stats).toEqual({
          total: 0,
          pending: 0,
          retrying: 0,
          failed: 0,
          readyToSync: 0
        });
      });
    });

    describe('groupByRecordType', () => {
      it('should group sync states by record type', () => {
        const groups = SyncStateUtils.groupByRecordType(sampleSyncStates);

        expect(groups).toEqual({
          exercise: [sampleSyncStates[0], sampleSyncStates[1], sampleSyncStates[3]],
          user: [sampleSyncStates[2]]
        });
      });
    });

    describe('groupByOperation', () => {
      it('should group sync states by operation', () => {
        const groups = SyncStateUtils.groupByOperation(sampleSyncStates);

        expect(groups).toEqual({
          create: [sampleSyncStates[0]],
          update: [sampleSyncStates[1], sampleSyncStates[3]],
          delete: [sampleSyncStates[2]]
        });
      });
    });

    describe('getNextRetryTime', () => {
      it('should return earliest retry time', () => {
        const nextTime = SyncStateUtils.getNextRetryTime(sampleSyncStates);

        expect(nextTime).toEqual(new Date('2024-01-01T00:10:00.000Z'));
      });

      it('should return null when no pending retries', () => {
        const readyStates = sampleSyncStates.filter(s => s.attempts === 0 || !s.nextRetryAt);
        const nextTime = SyncStateUtils.getNextRetryTime(readyStates);

        expect(nextTime).toBeNull();
      });
    });

    describe('estimateCompletionTime', () => {
      it('should estimate completion time based on ready states', () => {
        const completion = SyncStateUtils.estimateCompletionTime(sampleSyncStates);

        // Should return next retry time (10:00) since it's later than estimate (00:02)
        expect(completion).toEqual(new Date('2024-01-01T00:10:00.000Z'));
      });

      it('should use next retry time if later than estimate', () => {
        // Make all states not ready except one with future retry
        const states = [sampleSyncStates[1]]; // Has future retry time
        const completion = SyncStateUtils.estimateCompletionTime(states);

        expect(completion).toEqual(new Date('2024-01-01T00:10:00.000Z'));
      });

      it('should return null when nothing to sync', () => {
        const failedStates = [sampleSyncStates[2]]; // Only permanently failed
        const completion = SyncStateUtils.estimateCompletionTime(failedStates);

        expect(completion).toBeNull();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete sync lifecycle', () => {
      // Create initial sync state
      const input: SyncStateInput = {
        recordId: 'exercise-123',
        recordType: 'exercise',
        operation: 'create',
        payload: { name: 'Push Ups', reps: 10 }
      };

      let syncState = createSyncState(input);
      expect(syncState.attempts).toBe(0);
      expect(isReadyForRetry(syncState)).toBe(true);

      // Record first failure
      syncState = recordSyncFailure(syncState, 'Network timeout');
      expect(syncState.attempts).toBe(1);
      expect(syncState.lastError).toBe('Network timeout');
      expect(syncState.nextRetryAt).toBeDefined();

      // Check not ready for retry immediately
      expect(isReadyForRetry(syncState)).toBe(false);

      // Advance time past retry delay
      jest.setSystemTime(new Date('2024-01-01T00:00:02.000Z'));
      expect(isReadyForRetry(syncState)).toBe(true);

      // Record more failures until max attempts
      for (let i = 1; i < SYNC_CONFIG.MAX_ATTEMPTS; i++) {
        syncState = recordSyncFailure(syncState, `Error attempt ${i + 1}`);
      }

      expect(hasFailedPermanently(syncState)).toBe(true);
      expect(isReadyForRetry(syncState)).toBe(false);

      // Reset for manual retry
      syncState = resetForRetry(syncState);
      expect(syncState.attempts).toBe(0);
      expect(syncState.lastError).toBeUndefined();
      expect(isReadyForRetry(syncState)).toBe(true);
    });

    it('should handle database serialization round trip', () => {
      const originalState: SyncStateRecord = {
        recordId: 'test-123',
        recordType: 'exercise',
        operation: 'update',
        pendingSince: new Date('2024-01-01T00:00:00.000Z'),
        attempts: 3,
        lastError: 'Sync failed',
        nextRetryAt: new Date('2024-01-01T00:05:00.000Z'),
        payload: { name: 'Updated Exercise', reps: 15 }
      };

      const dbFormat = toDbFormat(originalState);
      const restoredState = fromDbFormat(dbFormat);

      expect(restoredState).toEqual(originalState);
    });
  });
});