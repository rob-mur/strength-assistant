/**
 * Test Suite Caching Implementation
 * 
 * Implements comprehensive caching for Constitutional Amendment v2.6.0 compliance.
 * Caches TypeScript compilation, test results, performance metrics, and constitutional status.
 * 
 * Optimizes test execution to meet 60-second constitutional requirement.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface TestSuiteCacheEntry {
  hash: string;
  timestamp: Date;
  data: any;
  ttl: number; // Time to live in milliseconds
}

export interface TypeScriptCompilationCache {
  sourceHash: string;
  compilationResult: {
    success: boolean;
    errors: string[];
    warnings: string[];
    executionTime: number;
  };
  cachedAt: Date;
}

export interface TestResultCache {
  testFileHash: string;
  testResults: {
    passed: boolean;
    testCount: number;
    passCount: number;
    failCount: number;
    skipCount: number;
    executionTime: number;
    memoryUsage: number;
  };
  dependencies: string[]; // Files this test depends on
  cachedAt: Date;
}

export interface PerformanceMetricsCache {
  metricsHash: string;
  metrics: {
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    testCount: number;
    constitutionalCompliant: boolean;
  };
  cachedAt: Date;
}

export interface ConstitutionalComplianceCache {
  complianceHash: string;
  compliance: {
    amendmentV260: boolean;
    amendmentV250: boolean;
    amendmentV240: boolean;
    overallCompliant: boolean;
    violations: string[];
    lastValidated: Date;
  };
  cachedAt: Date;
}

export class TestSuiteCachingImpl {
  private readonly cacheDir: string;
  private readonly defaultTTL = 3600000; // 1 hour
  private readonly performanceTTL = 1800000; // 30 minutes for performance data
  private readonly complianceTTL = 900000; // 15 minutes for compliance status

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.jest-cache', 'constitutional');
    this.ensureCacheDirectory();
  }

  /**
   * Caches TypeScript compilation results
   */
  async cacheTypeScriptCompilation(sourceFiles: string[], result: any): Promise<void> {
    const sourceHash = this.generateSourceHash(sourceFiles);
    
    const cacheEntry: TypeScriptCompilationCache = {
      sourceHash,
      compilationResult: {
        success: result.success || false,
        errors: result.errors || [],
        warnings: result.warnings || [],
        executionTime: result.executionTime || 0
      },
      cachedAt: new Date()
    };

    await this.writeCacheEntry('typescript-compilation', sourceHash, cacheEntry);
  }

  /**
   * Retrieves cached TypeScript compilation results
   */
  async getCachedTypeScriptCompilation(sourceFiles: string[]): Promise<TypeScriptCompilationCache | null> {
    const sourceHash = this.generateSourceHash(sourceFiles);
    const cached = await this.readCacheEntry('typescript-compilation', sourceHash);
    
    if (!cached || this.isCacheExpired(cached, this.defaultTTL)) {
      return null;
    }

    return cached.data as TypeScriptCompilationCache;
  }

  /**
   * Caches test results for specific test files
   */
  async cacheTestResults(testFile: string, results: any, dependencies: string[] = []): Promise<void> {
    const testFileHash = this.generateFileHash(testFile);
    
    const cacheEntry: TestResultCache = {
      testFileHash,
      testResults: {
        passed: results.passed || false,
        testCount: results.testCount || 0,
        passCount: results.passCount || 0,
        failCount: results.failCount || 0,
        skipCount: results.skipCount || 0,
        executionTime: results.executionTime || 0,
        memoryUsage: results.memoryUsage || 0
      },
      dependencies,
      cachedAt: new Date()
    };

    await this.writeCacheEntry('test-results', testFileHash, cacheEntry);
  }

  /**
   * Retrieves cached test results
   */
  async getCachedTestResults(testFile: string): Promise<TestResultCache | null> {
    const testFileHash = this.generateFileHash(testFile);
    const cached = await this.readCacheEntry('test-results', testFileHash);
    
    if (!cached || this.isCacheExpired(cached, this.defaultTTL)) {
      return null;
    }

    const testCache = cached.data as TestResultCache;
    
    // Check if dependencies have changed
    if (await this.haveDependenciesChanged(testCache.dependencies, testCache.cachedAt)) {
      return null;
    }

    return testCache;
  }

  /**
   * Caches performance metrics
   */
  async cachePerformanceMetrics(metrics: any): Promise<void> {
    const metricsData = {
      executionTime: metrics.executionTime,
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
      testCount: metrics.testCount,
      constitutionalCompliant: metrics.constitutionalCompliant
    };

    const metricsHash = this.generateDataHash(metricsData);
    
    const cacheEntry: PerformanceMetricsCache = {
      metricsHash,
      metrics: metricsData,
      cachedAt: new Date()
    };

    await this.writeCacheEntry('performance-metrics', metricsHash, cacheEntry);
  }

  /**
   * Retrieves cached performance metrics
   */
  async getCachedPerformanceMetrics(): Promise<PerformanceMetricsCache | null> {
    // Get the latest performance metrics entry
    const entries = await this.getAllCacheEntries('performance-metrics');
    
    if (entries.length === 0) {
      return null;
    }

    // Sort by timestamp and get the most recent
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.data.cachedAt).getTime() - new Date(a.data.cachedAt).getTime()
    );

    const latest = sortedEntries[0];
    
    if (this.isCacheExpired(latest, this.performanceTTL)) {
      return null;
    }

    return latest.data as PerformanceMetricsCache;
  }

  /**
   * Caches constitutional compliance status
   */
  async cacheConstitutionalCompliance(compliance: any): Promise<void> {
    const complianceData = {
      amendmentV260: compliance.amendmentV260 || false,
      amendmentV250: compliance.amendmentV250 || false,
      amendmentV240: compliance.amendmentV240 || false,
      overallCompliant: compliance.overallCompliant || false,
      violations: compliance.violations || [],
      lastValidated: new Date()
    };

    const complianceHash = this.generateDataHash(complianceData);
    
    const cacheEntry: ConstitutionalComplianceCache = {
      complianceHash,
      compliance: complianceData,
      cachedAt: new Date()
    };

    await this.writeCacheEntry('constitutional-compliance', complianceHash, cacheEntry);
  }

  /**
   * Retrieves cached constitutional compliance status
   */
  async getCachedConstitutionalCompliance(): Promise<ConstitutionalComplianceCache | null> {
    const entries = await this.getAllCacheEntries('constitutional-compliance');
    
    if (entries.length === 0) {
      return null;
    }

    // Get the most recent compliance entry
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.data.cachedAt).getTime() - new Date(a.data.cachedAt).getTime()
    );

    const latest = sortedEntries[0];
    
    if (this.isCacheExpired(latest, this.complianceTTL)) {
      return null;
    }

    return latest.data as ConstitutionalComplianceCache;
  }

  /**
   * Invalidates cache for specific test files
   */
  async invalidateTestCache(testFile: string): Promise<void> {
    const testFileHash = this.generateFileHash(testFile);
    await this.deleteCacheEntry('test-results', testFileHash);
  }

  /**
   * Invalidates all TypeScript compilation caches
   */
  async invalidateTypeScriptCache(): Promise<void> {
    await this.clearCacheCategory('typescript-compilation');
  }

  /**
   * Invalidates all performance metrics caches
   */
  async invalidatePerformanceCache(): Promise<void> {
    await this.clearCacheCategory('performance-metrics');
  }

  /**
   * Invalidates all constitutional compliance caches
   */
  async invalidateComplianceCache(): Promise<void> {
    await this.clearCacheCategory('constitutional-compliance');
  }

  /**
   * Clears all cache entries
   */
  async clearAllCache(): Promise<void> {
    if (fs.existsSync(this.cacheDir)) {
      await fs.promises.rmdir(this.cacheDir, { recursive: true });
      this.ensureCacheDirectory();
    }
  }

  /**
   * Gets cache statistics for constitutional monitoring
   */
  async getCacheStatistics(): Promise<{
    totalEntries: number;
    sizeOnDisk: number;
    hitRate: number;
    categories: Record<string, number>;
  }> {
    const stats = {
      totalEntries: 0,
      sizeOnDisk: 0,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      categories: {} as Record<string, number>
    };

    try {
      const categories = ['typescript-compilation', 'test-results', 'performance-metrics', 'constitutional-compliance'];
      
      for (const category of categories) {
        const categoryPath = path.join(this.cacheDir, category);
        if (fs.existsSync(categoryPath)) {
          const files = await fs.promises.readdir(categoryPath);
          stats.categories[category] = files.length;
          stats.totalEntries += files.length;
          
          // Calculate size on disk
          for (const file of files) {
            const filePath = path.join(categoryPath, file);
            const fileStat = await fs.promises.stat(filePath);
            stats.sizeOnDisk += fileStat.size;
          }
        } else {
          stats.categories[category] = 0;
        }
      }
    } catch (error) {
      console.warn('Failed to get cache statistics:', error);
    }

    return stats;
  }

  /**
   * Optimizes cache for constitutional performance requirements
   */
  async optimizeCache(): Promise<{
    cleaned: number;
    totalSize: number;
    optimizationTime: number;
  }> {
    const startTime = Date.now();
    let cleanedEntries = 0;
    let totalSize = 0;

    try {
      const categories = ['typescript-compilation', 'test-results', 'performance-metrics', 'constitutional-compliance'];
      
      for (const category of categories) {
        const categoryPath = path.join(this.cacheDir, category);
        if (!fs.existsSync(categoryPath)) continue;
        
        const files = await fs.promises.readdir(categoryPath);
        
        for (const file of files) {
          const filePath = path.join(categoryPath, file);
          
          try {
            const cached = await this.readCacheEntryByPath(filePath);
            const ttl = this.getTTLForCategory(category);
            
            if (cached && this.isCacheExpired(cached, ttl)) {
              await fs.promises.unlink(filePath);
              cleanedEntries++;
            } else if (cached) {
              const fileStat = await fs.promises.stat(filePath);
              totalSize += fileStat.size;
            }
          } catch (error) {
            // If we can't read the cache entry, delete it
            await fs.promises.unlink(filePath);
            cleanedEntries++;
          }
        }
      }
    } catch (error) {
      console.warn('Cache optimization failed:', error);
    }

    const optimizationTime = Date.now() - startTime;

    return {
      cleaned: cleanedEntries,
      totalSize,
      optimizationTime
    };
  }

  // Private helper methods

  private ensureCacheDirectory(): void {
    const categories = ['typescript-compilation', 'test-results', 'performance-metrics', 'constitutional-compliance'];
    
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    for (const category of categories) {
      const categoryPath = path.join(this.cacheDir, category);
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }
    }
  }

  private generateSourceHash(sourceFiles: string[]): string {
    const combinedContent = sourceFiles
      .filter(file => fs.existsSync(file))
      .map(file => {
        const stat = fs.statSync(file);
        return `${file}:${stat.mtime.getTime()}:${stat.size}`;
      })
      .sort()
      .join('|');

    return crypto.createHash('sha256').update(combinedContent).digest('hex');
  }

  private generateFileHash(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return crypto.createHash('sha256').update(filePath).digest('hex');
    }

    const stat = fs.statSync(filePath);
    const content = `${filePath}:${stat.mtime.getTime()}:${stat.size}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private generateDataHash(data: any): string {
    const content = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async writeCacheEntry(category: string, key: string, data: any): Promise<void> {
    const cacheEntry: TestSuiteCacheEntry = {
      hash: key,
      timestamp: new Date(),
      data,
      ttl: this.getTTLForCategory(category)
    };

    const filePath = path.join(this.cacheDir, category, `${key}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
  }

  private async readCacheEntry(category: string, key: string): Promise<TestSuiteCacheEntry | null> {
    const filePath = path.join(this.cacheDir, category, `${key}.json`);
    return this.readCacheEntryByPath(filePath);
  }

  private async readCacheEntryByPath(filePath: string): Promise<TestSuiteCacheEntry | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(content) as TestSuiteCacheEntry;
    } catch (error) {
      return null;
    }
  }

  private async getAllCacheEntries(category: string): Promise<TestSuiteCacheEntry[]> {
    const categoryPath = path.join(this.cacheDir, category);
    
    if (!fs.existsSync(categoryPath)) {
      return [];
    }

    const files = await fs.promises.readdir(categoryPath);
    const entries: TestSuiteCacheEntry[] = [];

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const entry = await this.readCacheEntryByPath(filePath);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  private async deleteCacheEntry(category: string, key: string): Promise<void> {
    const filePath = path.join(this.cacheDir, category, `${key}.json`);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  private async clearCacheCategory(category: string): Promise<void> {
    const categoryPath = path.join(this.cacheDir, category);
    
    if (fs.existsSync(categoryPath)) {
      const files = await fs.promises.readdir(categoryPath);
      
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        await fs.promises.unlink(filePath);
      }
    }
  }

  private isCacheExpired(cacheEntry: TestSuiteCacheEntry, ttl: number): boolean {
    const now = Date.now();
    const cacheTime = new Date(cacheEntry.timestamp).getTime();
    return (now - cacheTime) > ttl;
  }

  private async haveDependenciesChanged(dependencies: string[], cacheTime: Date): Promise<boolean> {
    for (const dep of dependencies) {
      if (!fs.existsSync(dep)) {
        return true; // Dependency file was deleted
      }

      const stat = fs.statSync(dep);
      if (stat.mtime > cacheTime) {
        return true; // Dependency was modified after cache
      }
    }

    return false;
  }

  private getTTLForCategory(category: string): number {
    switch (category) {
      case 'performance-metrics':
        return this.performanceTTL;
      case 'constitutional-compliance':
        return this.complianceTTL;
      default:
        return this.defaultTTL;
    }
  }
}