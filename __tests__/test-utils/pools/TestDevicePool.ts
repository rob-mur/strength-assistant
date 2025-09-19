/**
 * Memory-Optimized TestDevicePool
 *
 * Implements device pooling to reduce memory usage during test execution.
 * Critical for preventing memory crashes in `devbox run test` single-threaded execution.
 */

import { TestDevice } from "../TestDevice";
import type { TestDeviceConfig } from "../../../specs/001-we-are-actually/contracts/jest-validation";

interface PooledDevice {
  device: TestDevice;
  lastUsed: Date;
  inUse: boolean;
  usageCount: number;
}

/**
 * Memory-optimized device pool for test execution
 *
 * Addresses the memory crash issues in `devbox run test` by:
 * - Reusing TestDevice instances across tests
 * - Limiting maximum pool size to prevent memory accumulation
 * - Aggressive cleanup of unused devices
 * - Memory monitoring and automatic garbage collection
 */
export class TestDevicePool {
  private static instance: TestDevicePool;
  // This map must remain mutable for set/clear/delete operations in the pool logic
  private readonly pool: Map<string, PooledDevice> = new Map();
  private readonly maxPoolSize: number;
  private readonly maxIdleTime: number; // milliseconds
  private readonly memoryThresholdMB: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Conservative memory limits for single-threaded execution
    this.maxPoolSize = 3; // Reduced from 5 to prevent memory issues
    this.maxIdleTime = 30000; // 30 seconds
    this.memoryThresholdMB = 100; // 100MB heap usage threshold

    // Start periodic cleanup
    this.startCleanupProcess();
  }

  /**
   * Get singleton instance of TestDevicePool
   */
  static getInstance(): TestDevicePool {
    if (!TestDevicePool.instance) {
      TestDevicePool.instance = new TestDevicePool();
    }
    return TestDevicePool.instance;
  }

  /**
   * Get or create a test device from the pool
   * Memory-optimized to reuse devices and prevent accumulation
   */
  async getDevice(config: TestDeviceConfig): Promise<TestDevice> {
    const key = this.getConfigKey(config);

    // Check if we have an available device in the pool
    const pooledDevice = this.pool.get(key);
    if (pooledDevice && !pooledDevice.inUse) {
      pooledDevice.inUse = true;
      pooledDevice.lastUsed = new Date();
      pooledDevice.usageCount++;

      // Reset device to clean state
      await pooledDevice.device.cleanup();
      await pooledDevice.device.init();

      return pooledDevice.device;
    }

    // Check memory usage before creating new device
    await this.checkMemoryUsage();

    // Create new device if pool has space
    if (this.pool.size < this.maxPoolSize) {
      const device = new TestDevice(config.deviceName);
      await device.init();

      const pooledDevice: PooledDevice = {
        device,
        lastUsed: new Date(),
        inUse: true,
        usageCount: 1,
      };

      this.pool.set(key, pooledDevice);
      return device;
    }

    // Pool is full, wait for available device or force cleanup
    await this.forceCleanup();
    return this.getDevice(config); // Retry after cleanup
  }

  /**
   * Release device back to pool
   */
  async releaseDevice(device: TestDevice): Promise<void> {
    for (const pooledDevice of Array.from(this.pool.values())) {
      if (pooledDevice.device === device) {
        pooledDevice.inUse = false;
        pooledDevice.lastUsed = new Date();

        // Clean device state but keep in pool
        await device.cleanup();
        break;
      }
    }
  }

  /**
   * Force cleanup of all devices in pool
   * Critical for memory optimization
   */
  async cleanup(): Promise<void> {
    // Stop cleanup process
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clean up all devices
    const cleanupPromises: Promise<void>[] = [];
    for (const pooledDevice of Array.from(this.pool.values())) {
      cleanupPromises.push(pooledDevice.device.cleanup());
    }

    await Promise.all(cleanupPromises);
    this.pool.clear();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): {
    totalDevices: number;
    devicesInUse: number;
    devicesIdle: number;
    memoryUsageMB: number;
  } {
    const totalDevices = this.pool.size;
    const devicesInUse = Array.from(this.pool.values()).filter(
      (d) => d.inUse,
    ).length;
    const memoryUsage = process.memoryUsage();

    return {
      totalDevices,
      devicesInUse,
      devicesIdle: totalDevices - devicesInUse,
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    };
  }

  /**
   * Generate unique device name
   */
  private generateDeviceName(): string {
    // Use slice instead of deprecated substr
    return `PoolDevice-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Generate cache key for device configuration
   */
  private getConfigKey(config: TestDeviceConfig): string {
    return `${config.deviceName}-${config.initialNetworkStatus}`;
  }

  /**
   * Start periodic cleanup process
   * Prevents memory accumulation over time
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performPeriodicCleanup();
    }, 10000); // Every 10 seconds
  }

  /**
   * Perform periodic cleanup of idle devices
   */
  private async performPeriodicCleanup(): Promise<void> {
    const now = new Date();
    const devicesToRemove: string[] = [];

    for (const [key, pooledDevice] of Array.from(this.pool.entries())) {
      // Remove idle devices that exceed idle time
      if (
        !pooledDevice.inUse &&
        now.getTime() - pooledDevice.lastUsed.getTime() > this.maxIdleTime
      ) {
        devicesToRemove.push(key);
      }

      // Remove heavily used devices to prevent memory leaks
      if (pooledDevice.usageCount > 50) {
        devicesToRemove.push(key);
      }
    }

    // Clean up identified devices
    for (const key of devicesToRemove) {
      const pooledDevice = this.pool.get(key);
      if (pooledDevice) {
        await pooledDevice.device.cleanup();
        this.pool.delete(key);
      }
    }

    // Force garbage collection if memory usage is high
    await this.checkMemoryUsage();
  }

  /**
   * Check memory usage and perform cleanup if needed
   */
  private async checkMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage();
    const heapUsageMB = memUsage.heapUsed / 1024 / 1024;

    if (heapUsageMB > this.memoryThresholdMB) {
      console.warn(
        `TestDevicePool: High memory usage detected (${Math.round(heapUsageMB)}MB), performing cleanup`,
      );
      await this.forceCleanup();
    }
  }

  /**
   * Force aggressive cleanup when memory is critical
   */
  private async forceCleanup(): Promise<void> {
    // Remove all idle devices
    const devicesToRemove: string[] = [];
    for (const [key, pooledDevice] of Array.from(this.pool.entries())) {
      if (!pooledDevice.inUse) {
        devicesToRemove.push(key);
      }
    }

    for (const key of devicesToRemove) {
      const pooledDevice = this.pool.get(key);
      if (pooledDevice) {
        await pooledDevice.device.cleanup();
        this.pool.delete(key);
      }
    }

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Wait a moment for cleanup to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Singleton instance getter for global access
 */
export const testDevicePool = TestDevicePool.getInstance();

/**
 * Helper function for test files
 * Provides simple interface for getting test devices
 */
export async function getTestDevice(deviceName?: string): Promise<TestDevice> {
  const config: TestDeviceConfig = {
    deviceName: deviceName || "TestDevice",
    initialNetworkStatus: true,
    mockServices: {
      firebase: {
        auth: false,
        firestore: false,
        config: {},
      },
      supabase: {
        auth: false,
        database: false,
        config: {},
      },
      reactNative: {
        asyncStorage: false,
        navigation: false,
        config: {},
      },
    },
    testDataConfig: {
      deterministic: true,
      randomSeed: 12345,
    },
  };

  return testDevicePool.getDevice(config);
}

/**
 * Helper function for releasing test devices
 */
export async function releaseTestDevice(device: TestDevice): Promise<void> {
  return testDevicePool.releaseDevice(device);
}

/**
 * Global cleanup function for use in test teardown
 */
export async function cleanupTestDevicePool(): Promise<void> {
  return testDevicePool.cleanup();
}
