/**
 * ErrorBlockingFactory
 *
 * Factory for creating all components of the simple error blocking system.
 * Provides a single entry point for initializing the error handling replacement.
 */

import React from "react";
import {
  ErrorBlockingFactory,
  ErrorBlockingConfig,
  ErrorBlockerComponent,
  SimpleErrorLogger,
  MaestroErrorDetection,
  ReactNativeErrorHandler,
  MaestroTestHelpers,
} from "../../../specs/012-production-bug-android/contracts/simple-error-blocking";

import { ErrorBlocker } from "../../components/ErrorBlocker";
import { createSimpleErrorLogger } from "./SimpleErrorLogger";
import {
  createMaestroErrorDetection,
  createMaestroTestHelpers,
} from "../testing/MaestroErrorDetection";
import { createReactNativeErrorHandler } from "./ReactNativeErrorHandler";

/**
 * Default configuration for error blocking system
 */
const DEFAULT_CONFIG: Required<ErrorBlockingConfig> = {
  enabled: true,
  maxErrors: 10,
  showErrorDetails: false, // Don't show details in production
  overlayStyle: {
    backgroundColor: "rgba(255, 0, 0, 0.9)",
    opacity: 1,
    zIndex: 999999,
  },
  enableConsoleLogging: true,
};

/**
 * Implementation of ErrorBlockingFactory interface
 */
export class ErrorBlockingFactoryImpl implements ErrorBlockingFactory {
  private config: Required<ErrorBlockingConfig>;

  constructor(config?: ErrorBlockingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create the main ErrorBlocker component
   */
  createErrorBlocker(): ErrorBlockerComponent {
    if (!this.config.enabled) {
      // Return a pass-through component if disabled
      const PassThroughComponent = ({ children }: { children: React.ReactNode }) => {
        return React.createElement(React.Fragment, null, children);
      };
      PassThroughComponent.displayName = 'ErrorBlockerPassThrough';
      return PassThroughComponent as ErrorBlockerComponent;
    }

    return ErrorBlocker as ErrorBlockerComponent;
  }

  /**
   * Create a simple error logger
   */
  createSimpleLogger(): SimpleErrorLogger {
    return createSimpleErrorLogger();
  }

  /**
   * Create Maestro detection utilities
   */
  createMaestroDetection(): MaestroErrorDetection {
    return createMaestroErrorDetection();
  }

  /**
   * Create React Native error handler
   */
  createReactNativeHandler(): ReactNativeErrorHandler {
    return createReactNativeErrorHandler();
  }

  /**
   * Create test helpers for Maestro
   */
  createTestHelpers(): MaestroTestHelpers {
    return createMaestroTestHelpers();
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<ErrorBlockingConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorBlockingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Global factory instance
 */
let globalFactory: ErrorBlockingFactoryImpl | null = null;

/**
 * Creates or gets the global ErrorBlockingFactory instance
 */
export function createErrorBlockingFactory(
  config?: ErrorBlockingConfig,
): ErrorBlockingFactory {
  if (!globalFactory) {
    globalFactory = new ErrorBlockingFactoryImpl(config);
  }
  return globalFactory;
}

/**
 * Initializes the complete error blocking system
 */
export function initializeErrorBlocking(config?: ErrorBlockingConfig): {
  factory: ErrorBlockingFactory;
  errorBlocker: ErrorBlockerComponent;
  logger: SimpleErrorLogger;
  maestroDetection: MaestroErrorDetection;
  reactNativeHandler: ReactNativeErrorHandler;
  testHelpers: MaestroTestHelpers;
} {
  const factory = createErrorBlockingFactory(config);

  const errorBlocker = factory.createErrorBlocker();
  const logger = factory.createSimpleLogger();
  const maestroDetection = factory.createMaestroDetection();
  const reactNativeHandler = factory.createReactNativeHandler();
  const testHelpers = factory.createTestHelpers();

  // Setup React Native error handling
  reactNativeHandler.setupGlobalErrorHandling();

  return {
    factory,
    errorBlocker,
    logger,
    maestroDetection,
    reactNativeHandler,
    testHelpers,
  };
}

/**
 * Cleanup the error blocking system (for testing)
 */
export function cleanupErrorBlocking(): void {
  if (globalFactory) {
    const reactNativeHandler = globalFactory.createReactNativeHandler();
    reactNativeHandler.cleanup();
    globalFactory = null;
  }
}
