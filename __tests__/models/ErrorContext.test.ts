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
  });
});
