/**
 * Component Test Utilities - Evidence-Based Patterns
 * 
 * Research-backed utilities for testing React Native components with animations,
 * timers, and complex state interactions. Based on 2025 best practices from:
 * - React Native Testing Library official docs
 * - Testing Library fake timers patterns
 * - React Native animation testing experts
 */

import { RenderAPI } from '@testing-library/react-native';

export interface AnimatedTestOptions {
  /**
   * Time step for animation testing (ms)
   * @default 10 - Research shows 10ms steps provide smooth animation testing
   */
  timeStep?: number;
  
  /**
   * Maximum time to wait for animated state changes (ms)
   * @default 5000
   */
  maxWaitTime?: number;
  
  /**
   * Whether to automatically setup/cleanup fake timers
   * @default true
   */
  manageFakeTimers?: boolean;
  
  /**
   * Timeout for findBy queries (ms)
   * @default 1000
   */
  queryTimeout?: number;
}

export class ComponentTestUtils {
  private options: Required<AnimatedTestOptions>;
  private fakeTimersActive = false;
  
  constructor(options: AnimatedTestOptions = {}) {
    this.options = {
      timeStep: options.timeStep ?? 10,
      maxWaitTime: options.maxWaitTime ?? 5000,
      manageFakeTimers: options.manageFakeTimers ?? true,
      queryTimeout: options.queryTimeout ?? 1000,
    };
  }

  /**
   * Setup fake timers with proper lifecycle management
   * Based on Testing Library official patterns
   */
  setupFakeTimers(): void {
    if (this.options.manageFakeTimers && !this.fakeTimersActive) {
      jest.useFakeTimers();
      this.fakeTimersActive = true;
    }
  }

  /**
   * Cleanup fake timers with pending timer handling
   * Research shows runOnlyPendingTimers prevents memory leaks
   */
  cleanupFakeTimers(): void {
    if (this.options.manageFakeTimers && this.fakeTimersActive) {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      this.fakeTimersActive = false;
    }
  }

  /**
   * Time-stepping pattern for smooth animation testing
   * Based on React Native animation testing research showing 10ms steps work best
   */
  async advanceAnimationBySteps(totalTime: number, callback?: (currentTime: number) => void): Promise<void> {
    const steps = Math.ceil(totalTime / this.options.timeStep);
    
    for (let i = 0; i <= steps; i++) {
      const currentTime = Math.min(i * this.options.timeStep, totalTime);
      
      // Advance timers by step
      jest.advanceTimersByTime(this.options.timeStep);
      
      // Optional callback for mid-animation checks
      if (callback) {
        callback(currentTime);
      }
      
      // Small delay to allow React Native to process animation callbacks
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  /**
   * Wait for element using findBy pattern (automatically wrapped in act)
   * Research shows findBy queries handle act() automatically and are more reliable
   */
  async waitForElement(
    renderResult: RenderAPI, 
    testId: string,
    options?: { timeout?: number }
  ): Promise<any> {
    const timeout = options?.timeout ?? this.options.queryTimeout;
    
    try {
      return await renderResult.findByTestId(testId, { timeout });
    } catch {
      throw new Error(`Element with testId "${testId}" not found within ${timeout}ms`);
    }
  }

  /**
   * Wait for text content using findBy pattern
   */
  async waitForText(
    renderResult: RenderAPI, 
    text: string | RegExp,
    options?: { timeout?: number }
  ): Promise<any> {
    const timeout = options?.timeout ?? this.options.queryTimeout;
    
    try {
      return await renderResult.findByText(text, { timeout });
    } catch {
      throw new Error(`Text "${text}" not found within ${timeout}ms`);
    }
  }

  /**
   * Advanced animation state testing with automatic timer management
   * Handles complex animations with state transitions
   */
  async testAnimationTransition<T>(
    animationDuration: number,
    stateChecker: (currentTime: number) => T,
    expectedStates: { time: number; expectedValue: T }[]
  ): Promise<void> {
    this.setupFakeTimers();
    
    try {
      await this.advanceAnimationBySteps(animationDuration, (currentTime) => {
        // Check expected states at specific times
        const expectedState = expectedStates.find(state => 
          Math.abs(state.time - currentTime) < this.options.timeStep
        );
        
        if (expectedState) {
          const actualState = stateChecker(currentTime);
          expect(actualState).toEqual(expectedState.expectedValue);
        }
      });
    } finally {
      this.cleanupFakeTimers();
    }
  }

  /**
   * Test timeout behavior with proper cleanup
   * Specifically designed for components with timeout logic like AuthAwareLayout
   */
  async testTimeoutBehavior(
    timeoutDuration: number,
    beforeTimeoutCheck: () => void,
    afterTimeoutCheck: () => void,
    options?: { 
      checkBeforeTimeout?: number;
      forceStateUpdate?: () => void;
    }
  ): Promise<void> {
    this.setupFakeTimers();
    
    try {
      // Check state before timeout
      if (options?.checkBeforeTimeout) {
        jest.advanceTimersByTime(options.checkBeforeTimeout);
        beforeTimeoutCheck();
      }
      
      // Advance past timeout
      jest.advanceTimersByTime(timeoutDuration - (options?.checkBeforeTimeout || 0) + 10);
      
      // Force state update if needed (for components that need external triggers)
      if (options?.forceStateUpdate) {
        options.forceStateUpdate();
      }
      
      // Wait for React to process the timeout
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check state after timeout
      afterTimeoutCheck();
      
    } finally {
      this.cleanupFakeTimers();
    }
  }

  /**
   * Comprehensive component lifecycle test with animations
   * Handles render -> animate -> update -> cleanup cycle
   */
  async testComponentLifecycle<Props>(
    renderComponent: (props: Props) => any,
    initialProps: Props,
    lifecycle: {
      afterRender?: (renderResult: any) => void | Promise<void>;
      duringAnimation?: (renderResult: any, time: number) => void;
      afterAnimation?: (renderResult: any) => void | Promise<void>;
      propsUpdate?: Props;
      afterUpdate?: (renderResult: any) => void | Promise<void>;
    },
    animationDuration = 1000
  ): Promise<any> {
    this.setupFakeTimers();
    
    try {
      // Initial render
      const renderResult = renderComponent(initialProps);
      
      if (lifecycle.afterRender) {
        await lifecycle.afterRender(renderResult);
      }
      
      // Animation phase
      if (lifecycle.duringAnimation) {
        await this.advanceAnimationBySteps(animationDuration, (time) => {
          lifecycle.duringAnimation!(renderResult, time);
        });
      } else {
        // Simple animation advancement without callbacks
        await this.advanceAnimationBySteps(animationDuration);
      }
      
      if (lifecycle.afterAnimation) {
        await lifecycle.afterAnimation(renderResult);
      }
      
      // Props update phase
      if (lifecycle.propsUpdate) {
        renderResult.rerender(renderComponent(lifecycle.propsUpdate));
        
        if (lifecycle.afterUpdate) {
          await lifecycle.afterUpdate(renderResult);
        }
      }
      
      return renderResult;
      
    } finally {
      this.cleanupFakeTimers();
    }
  }

  /**
   * Create test hooks for consistent setup/cleanup
   * Provides jest beforeEach/afterEach integration
   */
  createTestHooks() {
    return {
      beforeEach: () => {
        this.setupFakeTimers();
      },
      afterEach: () => {
        this.cleanupFakeTimers();
      }
    };
  }

  /**
   * Debug utility for checking timer state
   */
  getTimerInfo(): { 
    active: boolean; 
    pendingTimers: number;
    options: Required<AnimatedTestOptions>;
  } {
    return {
      active: this.fakeTimersActive,
      pendingTimers: this.fakeTimersActive ? jest.getTimerCount() : 0,
      options: this.options,
    };
  }
}

/**
 * Pre-configured instances for common use cases
 */

// Fast testing - for components with simple animations
export const fastAnimationTester = new ComponentTestUtils({
  timeStep: 5,
  maxWaitTime: 2000,
  queryTimeout: 500,
});

// Standard testing - for most components
export const standardComponentTester = new ComponentTestUtils({
  timeStep: 10,
  maxWaitTime: 5000,
  queryTimeout: 1000,
});

// Complex animation testing - for components like AuthAwareLayout
export const complexAnimationTester = new ComponentTestUtils({
  timeStep: 10,
  maxWaitTime: 10000,
  queryTimeout: 2000,
});

/**
 * Utility functions for common testing patterns
 */

/**
 * Create a test wrapper that automatically handles fake timers
 * Usage: testWithFakeTimers('test description', async () => { ... });
 */
export function testWithFakeTimers(
  testName: string, 
  testFn: () => Promise<void>,
  tester: ComponentTestUtils = standardComponentTester
) {
  return test(testName, async () => {
    tester.setupFakeTimers();
    try {
      await testFn();
    } finally {
      tester.cleanupFakeTimers();
    }
  });
}

/**
 * Describe block with automatic fake timer setup/cleanup
 */
export function describeWithFakeTimers(
  description: string,
  testSuite: () => void,
  tester: ComponentTestUtils = standardComponentTester
) {
  return describe(description, () => {
    const hooks = tester.createTestHooks();
    
    beforeEach(hooks.beforeEach);
    afterEach(hooks.afterEach);
    
    testSuite();
  });
}

export default ComponentTestUtils;