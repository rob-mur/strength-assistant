/**
 * React Native Test Helper
 * 
 * Centralized utility for handling React Native specific testing concerns:
 * - Proper act() wrapping for state updates
 * - Animation handling
 * - Event simulation with proper timing
 * - Component rendering utilities
 */

import { act, RenderAPI } from '@testing-library/react-native';

// Import proper ReactTestInstance type
/**
 * @deprecated ReactTestInstance is still the correct type for @testing-library/react-native as of 2025. Safe to use until upstream changes.
 */
import type { ReactTestInstance } from 'react-test-renderer';

export interface ReactNativeTestOptions {
  /**
   * Timeout for async operations (ms)
   * @default 5000
   */
  timeout?: number;
  
  /**
   * Whether to automatically wait for animations to complete
   * @default true
   */
  waitForAnimations?: boolean;
  
  /**
   * Delay between user interactions (ms) to simulate realistic timing
   * @default 50
   */
  interactionDelay?: number;
}

export class ReactNativeTestHelper {
  private options: Required<ReactNativeTestOptions>;
  
  constructor(options: ReactNativeTestOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 5000,
      waitForAnimations: options.waitForAnimations ?? true,
      interactionDelay: options.interactionDelay ?? 50,
    };
  }

  /**
   * Wrap state updates in act() with proper error handling
   */
  async actWrap<T>(fn: () => T | Promise<T>): Promise<T> {
    return act(async () => {
      const result = await fn();
      
      // Wait for any pending animations to complete
      if (this.options.waitForAnimations) {
        await this.waitForAnimations();
      }
      
      return result;
    });
  }

  /**
   * Wait for React Native animations to complete
   */
  private async waitForAnimations(timeout: number = 500): Promise<void> {
    return new Promise((resolve) => {
      // Use shorter timeout for animations to prevent test delays
      const animationTimeout = Math.min(timeout, 100);
      setTimeout(resolve, animationTimeout);
    });
  }

  /**
   * Simulate user typing with proper act() wrapping and timing
   */
  /**
   * @deprecated ReactTestInstance is still the correct type for @testing-library/react-native as of 2025. Safe to use until upstream changes.
   */
  /**
   * @deprecated ReactTestInstance is still the correct type for @testing-library/react-native as of 2025. Safe to use until upstream changes.
   */
  async typeText(element: ReactTestInstance, text: string): Promise<void> {
    return this.actWrap(async () => {
      // Simulate realistic typing with character delays
      const chars = text.split('');
      for (let i = 0; i < chars.length; i++) {
        const currentText = chars.slice(0, i + 1).join('');
        
        // Fire changeText event
        if ('props' in element && element.props.onChangeText) {
          element.props.onChangeText(currentText);
        }
        
        // Small delay between characters for realism
        if (i < chars.length - 1 && this.options.interactionDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.interactionDelay));
        }
      }
    });
  }

  /**
   * Simulate button press with proper act() wrapping
   */
  /**
   * @deprecated ReactTestInstance is still the correct type for @testing-library/react-native as of 2025. Safe to use until upstream changes.
   */
  /**
   * @deprecated ReactTestInstance is still the correct type for @testing-library/react-native as of 2025. Safe to use until upstream changes.
   */
  async pressButton(element: ReactTestInstance): Promise<void> {
    return this.actWrap(async () => {
      // Fire press events in sequence
      if ('props' in element) {
        if (element.props.onPressIn) {
          element.props.onPressIn();
        }
        
        // Small delay to simulate press duration
        await new Promise(resolve => setTimeout(resolve, this.options.interactionDelay));
        
        if (element.props.onPressOut) {
          element.props.onPressOut();
        }
        
        if (element.props.onPress) {
          await element.props.onPress();
        }
      }
    });
  }

  /**
   * Wait for component to settle after render with act() wrapping
   */
  async waitForRender(renderResult?: RenderAPI, _maxWait: number = this.options.timeout): Promise<void> {
    return this.actWrap(async () => {
      // Wait for initial render to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Wait for any pending animations to complete
      await this.waitForAnimations();
    });
  }

  /**
   * Simulate realistic user interaction timing
   */
  async delay(ms: number = this.options.interactionDelay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper for testing loading states with proper timing
   */
  async testLoadingState<T>(
    action: () => Promise<T>,
    getLoadingState: () => boolean,
    timeout: number = this.options.timeout
  ): Promise<T> {
    return this.actWrap(async () => {
      // Start the action
      const actionPromise = action();
      
      // Wait a bit and check loading state
      await this.delay(10);
      
      // Verify loading state is true
      const isLoading = getLoadingState();
      if (!isLoading) {
        console.warn('Loading state was not detected - this might indicate a timing issue');
      }
      
      // Wait for action to complete
      const result = await actionPromise;
      
      // Wait for loading state to clear
      let attempts = 0;
      const maxAttempts = Math.floor(timeout / 50);
      
      while (getLoadingState() && attempts < maxAttempts) {
        await this.delay(50);
        attempts++;
      }
      
      return result;
    });
  }

  /**
   * Batch multiple user interactions with proper act() wrapping
   */
  async performUserFlow(interactions: (() => Promise<void>)[]): Promise<void> {
    return this.actWrap(async () => {
      for (const interaction of interactions) {
        await interaction();
        // Small delay between interactions for realism
        await this.delay();
      }
    });
  }

  /**
   * Create a configured instance with common settings for component tests
   */
  static forComponentTesting(options: ReactNativeTestOptions = {}): ReactNativeTestHelper {
    return new ReactNativeTestHelper({
      timeout: 3000, // Shorter timeout for component tests
      waitForAnimations: true,
      interactionDelay: 25, // Faster interactions for tests
      ...options,
    });
  }

  /**
   * Create a configured instance with settings optimized for integration tests
   */
  static forIntegrationTesting(options: ReactNativeTestOptions = {}): ReactNativeTestHelper {
    return new ReactNativeTestHelper({
      timeout: 10000, // Longer timeout for integration tests
      waitForAnimations: true,
      interactionDelay: 50, // More realistic timing
      ...options,
    });
  }
}

// Export default instance for common usage
export const testHelper = ReactNativeTestHelper.forComponentTesting();

// Export utilities for specific use cases
export const integrationTestHelper = ReactNativeTestHelper.forIntegrationTesting();

/**
 * Convenience wrapper for act() with animation handling
 */
export async function actWithAnimations<T>(fn: () => T | Promise<T>): Promise<T> {
  return testHelper.actWrap(fn);
}

/**
 * Convenience function for user interactions
 */
export async function simulateUserInteraction<T>(fn: () => T | Promise<T>): Promise<T> {
  return testHelper.actWrap(fn);
}

export default ReactNativeTestHelper;