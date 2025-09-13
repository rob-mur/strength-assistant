/**
 * Memory Optimization Implementation
 * 
 * Implements comprehensive memory management for Constitutional Amendment v2.6.0 compliance.
 * Enforces <8GB memory constraint, implements garbage collection strategies, and prevents memory leaks.
 * 
 * Ensures test execution remains within constitutional memory limits while maintaining reliability.
 */

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number; // Resident Set Size
}

export interface MemoryLeak {
  testName: string;
  leakSize: number; // MB
  leakType: 'HEAP' | 'EXTERNAL' | 'ARRAY_BUFFERS';
  detectionTimestamp: Date;
  stackTrace?: string;
}

export interface GarbageCollectionEvent {
  timestamp: Date;
  type: 'minor' | 'major' | 'full';
  duration: number; // milliseconds
  memoryFreed: number; // MB
  beforeMemory: MemorySnapshot;
  afterMemory: MemorySnapshot;
}

export interface MemoryOptimizationConfig {
  maxMemoryMB: number;
  garbageCollectionThresholdMB: number;
  leakDetectionThresholdMB: number;
  cleanupInterval: number; // milliseconds
  constitutionalLimitMB: number; // 8GB = 8192MB
}

export interface MemoryConstraintViolation {
  timestamp: Date;
  currentMemory: number;
  limit: number;
  testContext: string;
  actionTaken: 'GC' | 'CLEANUP' | 'ABORT';
  recoveryTime: number;
}

export class MemoryOptimizationImpl {
  private readonly config: MemoryOptimizationConfig = {
    maxMemoryMB: 6144, // 6GB working limit, 2GB buffer for constitutional compliance
    garbageCollectionThresholdMB: 4096, // 4GB trigger for proactive GC
    leakDetectionThresholdMB: 512, // 512MB leak detection threshold
    cleanupInterval: 30000, // 30 seconds
    constitutionalLimitMB: 8192 // 8GB constitutional limit
  };

  private memorySnapshots: MemorySnapshot[] = [];
  private memoryLeaks: MemoryLeak[] = [];
  private gcEvents: GarbageCollectionEvent[] = [];
  private violations: MemoryConstraintViolation[] = [];
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private testCleanupRegistry: Map<string, (() => void)[]> = new Map();

  /**
   * Initializes memory optimization and monitoring
   */
  async initialize(): Promise<void> {
    this.startMemoryMonitoring();
    this.startProactiveGarbageCollection();
    this.setupProcessMemoryWarnings();
    
    console.log('🧠 Constitutional Amendment v2.6.0: Memory optimization active');
    console.log(`📊 Memory limit: ${this.config.constitutionalLimitMB}MB (${this.config.constitutionalLimitMB / 1024}GB)`);
    console.log(`⚠️  Working limit: ${this.config.maxMemoryMB}MB for safety buffer`);
  }

  /**
   * Shuts down memory optimization
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Final cleanup
    await this.performFullCleanup();
    
    console.log('🧠 Memory optimization shutdown complete');
  }

  /**
   * Takes a memory snapshot for monitoring
   */
  takeMemorySnapshot(): MemorySnapshot {
    const memoryUsage = process.memoryUsage();
    
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    };

    this.memorySnapshots.push(snapshot);
    
    // Keep only last 100 snapshots for memory efficiency
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }

    return snapshot;
  }

  /**
   * Performs garbage collection with monitoring
   */
  async performGarbageCollection(type: 'minor' | 'major' | 'full' = 'major'): Promise<GarbageCollectionEvent> {
    const beforeSnapshot = this.takeMemorySnapshot();
    const startTime = Date.now();

    try {
      if (global.gc) {
        global.gc(); // Force garbage collection if available
      } else {
        // Trigger GC indirectly
        const arr = new Array(1000000).fill(0);
        arr.splice(0, arr.length);
      }
    } catch (error) {
      console.warn('Garbage collection failed:', error);
    }

    const endTime = Date.now();
    const afterSnapshot = this.takeMemorySnapshot();
    
    const gcEvent: GarbageCollectionEvent = {
      timestamp: new Date(),
      type,
      duration: endTime - startTime,
      memoryFreed: beforeSnapshot.heapUsed - afterSnapshot.heapUsed,
      beforeMemory: beforeSnapshot,
      afterMemory: afterSnapshot
    };

    this.gcEvents.push(gcEvent);
    
    // Keep only last 50 GC events
    if (this.gcEvents.length > 50) {
      this.gcEvents = this.gcEvents.slice(-50);
    }

    return gcEvent;
  }

  /**
   * Detects memory leaks between test runs
   */
  async detectMemoryLeaks(testName: string): Promise<MemoryLeak[]> {
    const currentSnapshot = this.takeMemorySnapshot();
    const leaks: MemoryLeak[] = [];

    if (this.memorySnapshots.length < 10) {
      return leaks; // Need more data points
    }

    // Compare with baseline (first 10 snapshots average)
    const baseline = this.memorySnapshots.slice(0, 10);
    const baselineAverage = {
      heapUsed: baseline.reduce((sum, s) => sum + s.heapUsed, 0) / baseline.length,
      external: baseline.reduce((sum, s) => sum + s.external, 0) / baseline.length,
      arrayBuffers: baseline.reduce((sum, s) => sum + s.arrayBuffers, 0) / baseline.length
    };

    // Detect heap leaks
    if (currentSnapshot.heapUsed > baselineAverage.heapUsed + this.config.leakDetectionThresholdMB) {
      leaks.push({
        testName,
        leakSize: currentSnapshot.heapUsed - baselineAverage.heapUsed,
        leakType: 'HEAP',
        detectionTimestamp: new Date(),
        stackTrace: this.captureStackTrace()
      });
    }

    // Detect external memory leaks
    if (currentSnapshot.external > baselineAverage.external + this.config.leakDetectionThresholdMB) {
      leaks.push({
        testName,
        leakSize: currentSnapshot.external - baselineAverage.external,
        leakType: 'EXTERNAL',
        detectionTimestamp: new Date(),
        stackTrace: this.captureStackTrace()
      });
    }

    // Detect array buffer leaks
    if (currentSnapshot.arrayBuffers > baselineAverage.arrayBuffers + this.config.leakDetectionThresholdMB) {
      leaks.push({
        testName,
        leakSize: currentSnapshot.arrayBuffers - baselineAverage.arrayBuffers,
        leakType: 'ARRAY_BUFFERS',
        detectionTimestamp: new Date(),
        stackTrace: this.captureStackTrace()
      });
    }

    this.memoryLeaks.push(...leaks);
    
    // Keep only last 100 leak records
    if (this.memoryLeaks.length > 100) {
      this.memoryLeaks = this.memoryLeaks.slice(-100);
    }

    return leaks;
  }

  /**
   * Registers cleanup functions for a test
   */
  registerTestCleanup(testName: string, cleanupFn: () => void): void {
    if (!this.testCleanupRegistry.has(testName)) {
      this.testCleanupRegistry.set(testName, []);
    }
    
    this.testCleanupRegistry.get(testName)!.push(cleanupFn);
  }

  /**
   * Performs cleanup for a specific test
   */
  async cleanupTest(testName: string): Promise<void> {
    const cleanupFunctions = this.testCleanupRegistry.get(testName);
    
    if (cleanupFunctions) {
      for (const cleanup of cleanupFunctions) {
        try {
          cleanup();
        } catch (error) {
          console.warn(`Cleanup failed for test ${testName}:`, error);
        }
      }
      
      this.testCleanupRegistry.delete(testName);
    }

    // Force garbage collection after test cleanup
    await this.performGarbageCollection('minor');
  }

  /**
   * Enforces constitutional memory constraints
   */
  async enforceMemoryConstraints(testContext: string): Promise<boolean> {
    const currentSnapshot = this.takeMemorySnapshot();
    const currentMemory = currentSnapshot.rss;

    if (currentMemory > this.config.constitutionalLimitMB) {
      const violation: MemoryConstraintViolation = {
        timestamp: new Date(),
        currentMemory,
        limit: this.config.constitutionalLimitMB,
        testContext,
        actionTaken: 'ABORT',
        recoveryTime: 0
      };

      this.violations.push(violation);
      
      console.error(`🚨 CONSTITUTIONAL VIOLATION: Memory usage ${currentMemory}MB exceeds ${this.config.constitutionalLimitMB}MB limit`);
      console.error(`📊 Test context: ${testContext}`);
      
      return false; // Violation detected
    }

    if (currentMemory > this.config.maxMemoryMB) {
      const startTime = Date.now();
      
      // Attempt recovery
      await this.performEmergencyCleanup();
      
      const recoveryTime = Date.now() - startTime;
      const afterSnapshot = this.takeMemorySnapshot();
      
      const violation: MemoryConstraintViolation = {
        timestamp: new Date(),
        currentMemory,
        limit: this.config.maxMemoryMB,
        testContext,
        actionTaken: afterSnapshot.rss < this.config.maxMemoryMB ? 'CLEANUP' : 'GC',
        recoveryTime
      };

      this.violations.push(violation);
      
      console.warn(`⚠️  Memory pressure detected: ${currentMemory}MB. Recovery ${violation.actionTaken} took ${recoveryTime}ms`);
      
      return afterSnapshot.rss < this.config.constitutionalLimitMB;
    }

    return true; // Within limits
  }

  /**
   * Gets current memory statistics
   */
  getMemoryStatistics(): {
    current: MemorySnapshot;
    peak: MemorySnapshot;
    leaks: number;
    violations: number;
    gcEvents: number;
    constitutionalCompliance: boolean;
  } {
    const current = this.takeMemorySnapshot();
    const peak = this.memorySnapshots.reduce((max, snapshot) => 
      snapshot.rss > max.rss ? snapshot : max
    , this.memorySnapshots[0] || current);

    return {
      current,
      peak,
      leaks: this.memoryLeaks.length,
      violations: this.violations.length,
      gcEvents: this.gcEvents.length,
      constitutionalCompliance: current.rss <= this.config.constitutionalLimitMB
    };
  }

  /**
   * Optimizes memory usage for test suite
   */
  async optimizeMemoryUsage(): Promise<{
    beforeMemory: number;
    afterMemory: number;
    memoryFreed: number;
    optimizationTime: number;
  }> {
    const startTime = Date.now();
    const beforeSnapshot = this.takeMemorySnapshot();

    // Perform comprehensive cleanup
    await this.performFullCleanup();
    
    // Force multiple garbage collection cycles
    await this.performGarbageCollection('full');
    await this.performGarbageCollection('major');
    
    const afterSnapshot = this.takeMemorySnapshot();
    const optimizationTime = Date.now() - startTime;

    return {
      beforeMemory: beforeSnapshot.rss,
      afterMemory: afterSnapshot.rss,
      memoryFreed: beforeSnapshot.rss - afterSnapshot.rss,
      optimizationTime
    };
  }

  // Private helper methods

  private startMemoryMonitoring(): void {
    this.cleanupInterval = setInterval(async () => {
      const snapshot = this.takeMemorySnapshot();
      
      // Check for memory pressure
      if (snapshot.rss > this.config.garbageCollectionThresholdMB) {
        await this.performGarbageCollection('major');
      }

      // Constitutional compliance check
      if (snapshot.rss > this.config.constitutionalLimitMB * 0.9) { // 90% of limit
        console.warn(`🧠 Memory approaching constitutional limit: ${snapshot.rss}MB / ${this.config.constitutionalLimitMB}MB`);
        await this.performGarbageCollection('full');
      }
    }, this.config.cleanupInterval);
  }

  private startProactiveGarbageCollection(): void {
    // Hook into test lifecycle if possible
    if (typeof afterEach === 'function') {
      afterEach(async () => {
        await this.performGarbageCollection('minor');
      });
    }
  }

  private setupProcessMemoryWarnings(): void {
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning' || 
          warning.message.includes('memory')) {
        console.warn('🧠 Node.js memory warning:', warning.message);
        this.performGarbageCollection('full');
      }
    });
  }

  private async performEmergencyCleanup(): Promise<void> {
    // Clear all test cleanup registries
    for (const [testName, cleanupFunctions] of this.testCleanupRegistry) {
      for (const cleanup of cleanupFunctions) {
        try {
          cleanup();
        } catch (error) {
          // Ignore cleanup errors during emergency
        }
      }
    }
    this.testCleanupRegistry.clear();

    // Trim internal arrays
    this.memorySnapshots = this.memorySnapshots.slice(-20);
    this.gcEvents = this.gcEvents.slice(-10);
    this.memoryLeaks = this.memoryLeaks.slice(-10);
    this.violations = this.violations.slice(-10);

    // Force aggressive garbage collection
    await this.performGarbageCollection('full');
    await this.performGarbageCollection('full'); // Double GC for stubborn references
  }

  private async performFullCleanup(): Promise<void> {
    // Execute all registered cleanup functions
    for (const [testName, cleanupFunctions] of this.testCleanupRegistry) {
      await this.cleanupTest(testName);
    }

    // Clear global references that might hold memory
    if (global.gc) {
      global.gc();
    }

    // Clear internal caches
    this.testCleanupRegistry.clear();
  }

  private captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(2, 8).join('\n') : 'No stack trace available';
  }
}

// Global memory optimization instance
let globalMemoryOptimizer: MemoryOptimizationImpl | null = null;

/**
 * Gets or creates the global memory optimizer
 */
export function getMemoryOptimizer(): MemoryOptimizationImpl {
  if (!globalMemoryOptimizer) {
    globalMemoryOptimizer = new MemoryOptimizationImpl();
  }
  return globalMemoryOptimizer;
}

/**
 * Initializes memory optimization for test suites
 */
export async function initializeMemoryOptimization(): Promise<void> {
  const optimizer = getMemoryOptimizer();
  await optimizer.initialize();
}

/**
 * Shuts down memory optimization
 */
export async function shutdownMemoryOptimization(): Promise<void> {
  if (globalMemoryOptimizer) {
    await globalMemoryOptimizer.shutdown();
    globalMemoryOptimizer = null;
  }
}