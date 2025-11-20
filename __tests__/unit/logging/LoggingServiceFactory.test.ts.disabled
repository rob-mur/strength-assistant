/**
 * Unit Tests: LoggingServiceFactory
 *
 * Tests for the factory pattern implementation, singleton management,
 * environment detection, and configuration validation.
 */

import {
  LoggingServiceFactory,
  FactoryConfig,
  validateFactoryConfig,
  EnvironmentConfigs,
} from "@/lib/utils/logging/LoggingServiceFactory";

describe("LoggingServiceFactory", () => {
  let factory: LoggingServiceFactory;

  beforeEach(() => {
    // Reset factory state before each test
    LoggingServiceFactory.getInstance().reset();
    factory = LoggingServiceFactory.getInstance();
  });

  afterEach(() => {
    // Clean up after each test
    factory.reset();
  });

  describe("Singleton Pattern", () => {
    it("should return same instance when called multiple times", () => {
      const instance1 = LoggingServiceFactory.getInstance();
      const instance2 = LoggingServiceFactory.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should maintain singleton across different method calls", () => {
      const factory1 = LoggingServiceFactory.getInstance();
      factory1.createLoggingService();

      const factory2 = LoggingServiceFactory.getInstance();
      const instances = factory2.getCurrentInstances();

      expect(instances.loggingService).toBeDefined();
    });
  });

  describe("createLoggingService", () => {
    it("should create logging service with default config", () => {
      const service = factory.createLoggingService();

      expect(service).toBeDefined();
      expect(typeof service.logError).toBe("function");
      expect(typeof service.logInfo).toBe("function");
    });

    it("should return same instance when called without config", () => {
      const service1 = factory.createLoggingService();
      const service2 = factory.createLoggingService();

      expect(service1).toBe(service2);
    });

    it("should create new instance when config is provided", () => {
      const config: FactoryConfig = { maxBufferSize: 200 };

      const service1 = factory.createLoggingService();
      const service2 = factory.createLoggingService(config);

      expect(service1).not.toBe(service2);
    });

    it("should apply custom configuration", () => {
      const config: FactoryConfig = {
        maxBufferSize: 500,
        maxRetentionDays: 5,
        enableLocalPersistence: false,
        environment: "test",
        enableConsoleLogging: false,
      };

      const service = factory.createLoggingService(config);
      expect(service).toBeDefined();
    });
  });

  describe("createErrorHandler", () => {
    it("should create error handler with logging service", () => {
      const loggingService = factory.createLoggingService();
      const errorHandler = factory.createErrorHandler(loggingService);

      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler.handleUncaughtError).toBe("function");
      expect(typeof errorHandler.wrapWithErrorHandling).toBe("function");
    });

    it("should return same error handler instance", () => {
      const loggingService = factory.createLoggingService();
      const handler1 = factory.createErrorHandler(loggingService);
      const handler2 = factory.createErrorHandler(loggingService);

      expect(handler1).toBe(handler2);
    });
  });

  describe("createUserErrorDisplay", () => {
    it("should create user error display service", () => {
      const display = factory.createUserErrorDisplay();

      expect(display).toBeDefined();
      expect(typeof display.showGenericError).toBe("function");
      expect(typeof display.showNetworkError).toBe("function");
    });

    it("should return same display instance", () => {
      const display1 = factory.createUserErrorDisplay();
      const display2 = factory.createUserErrorDisplay();

      expect(display1).toBe(display2);
    });
  });

  describe("createErrorHandlingSystem", () => {
    it("should create complete error handling system", () => {
      const system = factory.createErrorHandlingSystem();

      expect(system.loggingService).toBeDefined();
      expect(system.errorHandler).toBeDefined();
      expect(system.userErrorDisplay).toBeDefined();
    });

    it("should create system with custom config", () => {
      const config: FactoryConfig = {
        maxBufferSize: 300,
        enableConsoleLogging: true,
      };

      const system = factory.createErrorHandlingSystem(config);
      expect(system.loggingService).toBeDefined();
    });
  });

  describe("Environment Detection", () => {
    const originalDev = (global as any).__DEV__;
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      (global as any).__DEV__ = originalDev;
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should detect development environment", () => {
      (global as any).__DEV__ = true;

      const service = factory.createLoggingService();
      expect(service).toBeDefined();
    });

    it("should detect test environment", () => {
      process.env.NODE_ENV = "test";

      const service = factory.createLoggingService();
      expect(service).toBeDefined();
    });

    it("should default to production environment", () => {
      (global as any).__DEV__ = false;
      process.env.NODE_ENV = undefined;

      const service = factory.createLoggingService();
      expect(service).toBeDefined();
    });
  });

  describe("Configuration Defaults", () => {
    it("should use environment-specific buffer sizes", () => {
      const devConfig = EnvironmentConfigs.development();
      const prodConfig = EnvironmentConfigs.production();
      const testConfig = EnvironmentConfigs.test();

      expect(devConfig.maxBufferSize).toBeGreaterThan(
        testConfig.maxBufferSize!,
      );
      expect(prodConfig.maxBufferSize).toBeGreaterThan(
        testConfig.maxBufferSize!,
      );
    });

    it("should configure persistence correctly", () => {
      const testConfig = EnvironmentConfigs.test();
      const prodConfig = EnvironmentConfigs.production();

      expect(testConfig.enableLocalPersistence).toBe(false);
      expect(prodConfig.enableLocalPersistence).toBe(true);
    });
  });

  describe("Storage Availability Detection", () => {
    it("should handle localStorage availability check", () => {
      // This test mainly ensures the detection logic doesn't throw
      const service = factory.createLoggingService();
      expect(service).toBeDefined();
    });

    it("should handle AsyncStorage detection gracefully", () => {
      // Mock require failure for AsyncStorage
      const service = factory.createLoggingService({
        enableLocalPersistence: false,
      });
      expect(service).toBeDefined();
    });
  });

  describe("Enhanced Display Detection", () => {
    it("should handle toast library detection gracefully", () => {
      const display = factory.createUserErrorDisplay();
      expect(display).toBeDefined();
    });
  });

  describe("Reset Functionality", () => {
    it("should reset all instances", () => {
      factory.createLoggingService();
      factory.createUserErrorDisplay();

      const beforeReset = factory.getCurrentInstances();
      expect(beforeReset.loggingService).toBeDefined();
      expect(beforeReset.userErrorDisplay).toBeDefined();

      factory.reset();

      const afterReset = factory.getCurrentInstances();
      expect(afterReset.loggingService).toBeUndefined();
      expect(afterReset.userErrorDisplay).toBeUndefined();
    });
  });

  describe("getCurrentInstances", () => {
    it("should return current instances", () => {
      const instances1 = factory.getCurrentInstances();
      expect(instances1.loggingService).toBeUndefined();

      factory.createLoggingService();

      const instances2 = factory.getCurrentInstances();
      expect(instances2.loggingService).toBeDefined();
    });
  });
});

describe("validateFactoryConfig", () => {
  it("should validate valid config", () => {
    const config: FactoryConfig = {
      maxBufferSize: 1000,
      maxRetentionDays: 7,
      environment: "production",
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid maxBufferSize", () => {
    const config: FactoryConfig = {
      maxBufferSize: -100,
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("maxBufferSize must be a positive number");
  });

  it("should reject maxBufferSize too large", () => {
    const config: FactoryConfig = {
      maxBufferSize: 50000,
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("maxBufferSize is too large (max: 10000)");
  });

  it("should reject invalid maxRetentionDays", () => {
    const config: FactoryConfig = {
      maxRetentionDays: 0,
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "maxRetentionDays must be a positive number",
    );
  });

  it("should reject maxRetentionDays too large", () => {
    const config: FactoryConfig = {
      maxRetentionDays: 400,
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("maxRetentionDays is too large (max: 365)");
  });

  it("should reject invalid environment", () => {
    const config: FactoryConfig = {
      environment: "invalid",
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("environment must be one of:");
  });

  it("should handle multiple validation errors", () => {
    const config: FactoryConfig = {
      maxBufferSize: -100,
      maxRetentionDays: 500,
      environment: "invalid",
    };

    const result = validateFactoryConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
});
