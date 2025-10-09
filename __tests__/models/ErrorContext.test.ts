/**
 * Unit Test: ErrorContext Model
 *
 * This test verifies that the ErrorContext model functions correctly,
 * including validation, auto-collection of context, and utility methods.
 */

import { ErrorContext } from "../../lib/models/ErrorContext";

beforeAll(() => {
  global.document = {
    referrer: "http://localhost/previous-page",
  } as any;
  global.navigator = {
    onLine: true,
  } as any;
  global.window = {
    location: {
      pathname: "/current-page",
    },
  } as any;
});

describe("ErrorContext Model", () => {
  describe("Constructor and Validation", () => {
    it("should create a valid ErrorContext", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
      });
      expect(context).toBeDefined();
    });

    it("should throw an error for invalid data", () => {
      expect(() => {
        new ErrorContext({} as any);
      }).toThrow();
    });

    it("should auto-collect context", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
      });
      expect(context.networkState).toBeDefined();
      expect(context.navigationState).toBeDefined();
      // performanceMetrics may not be defined in all environments
    });
  });

  describe("Static Factory Methods", () => {
    it("should create an ErrorContext for an error event", () => {
      const context = ErrorContext.forErrorEvent("test-event-id");
      expect(context.errorEventId).toBe("test-event-id");
    });

    it("should create an ErrorContext with user action", () => {
      const context = ErrorContext.withUserAction(
        "test-event-id",
        "button-click",
      );
      expect(context.userAction).toBe("button-click");
    });

    it("should create an ErrorContext with navigation state", () => {
      const context = ErrorContext.withNavigation(
        "test-event-id",
        "/home",
        "/login",
      );
      expect(context.navigationState?.currentRoute).toBe("/home");
      expect(context.navigationState?.previousRoute).toBe("/login");
    });
  });

  describe("Utility Methods", () => {
    it("should check for user interaction", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
        userAction: "test-action",
      });
      expect(context.isDuringUserInteraction()).toBe(true);

      const noUserActionContext = new ErrorContext({
        errorEventId: "test-event-id",
      });
      expect(noUserActionContext.isDuringUserInteraction()).toBe(false);
    });

    it("should check for network issues", () => {
      const networkIssueContext = new ErrorContext({
        errorEventId: "test-event-id",
        networkState: "disconnected",
      });
      expect(networkIssueContext.hasNetworkIssues()).toBe(true);

      const noNetworkIssueContext = new ErrorContext({
        errorEventId: "test-event-id",
        networkState: "connected",
      });
      expect(noNetworkIssueContext.hasNetworkIssues()).toBe(false);
    });

    it("should check for performance issues", () => {
      const performanceIssueContext = new ErrorContext({
        errorEventId: "test-event-id",
        performanceMetrics: {
          memoryUsage: 200 * 1024 * 1024,
          cpuUsage: 90,
        },
      });
      expect(performanceIssueContext.hasPerformanceIssues()).toBe(true);

      const noPerformanceIssueContext = new ErrorContext({
        errorEventId: "test-event-id",
        performanceMetrics: {
          memoryUsage: 50 * 1024 * 1024,
          cpuUsage: 50,
        },
      });
      expect(noPerformanceIssueContext.hasPerformanceIssues()).toBe(false);
    });

    it("should return a summary", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
        userAction: "click",
        navigationState: { currentRoute: "/home" },
        networkState: "disconnected",
      });
      const summary = context.getSummary();
      expect(summary).toContain("Action: click");
      expect(summary).toContain("Route: /home");
      expect(summary).toContain("Network: disconnected");
    });

    it("should warn about sensitive data in context", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      new ErrorContext({
        errorEventId: "test-event-id",
        dataState: {
          userName: "john",
          password: "secret123",
          userToken: "abc123",
          creditCardNumber: "4111-1111-1111-1111",
        },
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Potentially sensitive data in error context at password")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Potentially sensitive data in error context at userToken")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Potentially sensitive data in error context at creditCardNumber")
      );
      
      consoleSpy.mockRestore();
    });

    it("should handle nested objects in sensitive data check", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      new ErrorContext({
        errorEventId: "test-event-id",
        dataState: {
          user: {
            profile: {
              authToken: "secret-token",
            },
          },
          config: {
            apiKey: "api-secret",
          },
        },
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Potentially sensitive data in error context at user.profile.authToken")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Potentially sensitive data in error context at config.apiKey")
      );
      
      consoleSpy.mockRestore();
    });

    it("should limit depth when checking for sensitive data", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      new ErrorContext({
        errorEventId: "test-event-id",
        dataState: {
          level1: {
            level2: {
              level3: {
                level4: {
                  password: "should-not-warn-too-deep",
                },
              },
            },
          },
        },
      });
      
      // Should not warn about deeply nested sensitive data (maxDepth = 3)
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("level1.level2.level3.level4.password")
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("State Management", () => {
    it("should update user action", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
      });
      
      context.setUserAction("form-submit");
      expect(context.userAction).toBe("form-submit");
    });

    it("should update navigation state", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
      });
      
      context.setNavigationState("/profile", "/home");
      expect(context.navigationState).toEqual({
        currentRoute: "/profile",
        previousRoute: "/home",
      });
    });

    it("should add data to state", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
      });
      
      context.addDataState("formData", { name: "test" });
      context.addDataState("timestamp", Date.now());
      
      expect(context.dataState).toEqual({
        formData: { name: "test" },
        timestamp: expect.any(Number),
      });
    });

    it("should sanitize data state by redacting sensitive keys", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
        dataState: {
          userName: "john",
          password: "secret123",
          apiToken: "abc123",
          normalData: "safe",
        },
      });
      
      context.sanitizeDataState();
      
      expect(context.dataState).toEqual({
        userName: "john",
        password: "[REDACTED]",
        apiToken: "[REDACTED]",
        normalData: "safe",
      });
    });

    it("should handle sanitization when dataState is null", () => {
      const context = new ErrorContext({
        errorEventId: "test-event-id",
      });
      
      expect(() => context.sanitizeDataState()).not.toThrow();
      expect(context.dataState).toBeUndefined();
    });
  });
});
