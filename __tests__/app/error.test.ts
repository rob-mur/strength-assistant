import { setJSExceptionHandler } from "react-native-exception-handler";
import handleErrors from "@/app/error";
// Firebase logger removed

jest.mock("react-native-exception-handler", () => ({
  setJSExceptionHandler: jest.fn(),
}));

// Firebase logger mock removed

const mockSetJSExceptionHandler = setJSExceptionHandler as jest.MockedFunction<
  typeof setJSExceptionHandler
>;

describe("handleErrors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset __DEV__ to false by default
    (global as any).__DEV__ = false;
  });

  it("should set up JS exception handler", () => {
    handleErrors();
    expect(mockSetJSExceptionHandler).toHaveBeenCalledWith(
      expect.any(Function),
      true,
    );
  });

  describe("errorHandler", () => {
    let errorHandler: (error: Error, isFatal: boolean) => void;

    beforeEach(() => {
      handleErrors();
      const callArgs = mockSetJSExceptionHandler.mock.calls[0];
      errorHandler = callArgs[0];
    });

    it("should log debug message and throw error in development mode", () => {
      (global as any).__DEV__ = true;
      const testError = new Error("Test error");

      expect(() => errorHandler(testError, true)).toThrow("Test error");
      // Logger expectation removed - Firebase no longer used
    });

    it("should not throw error in production mode", () => {
      (global as any).__DEV__ = false;
      const testError = new Error("Test error");

      expect(() => errorHandler(testError, true)).not.toThrow();
      // Logger expectation removed - Firebase no longer used
    });

    it("should handle different error types", () => {
      (global as any).__DEV__ = true;
      const networkError = new Error("Network connection failed");

      expect(() => errorHandler(networkError, false)).toThrow(
        "Network connection failed",
      );
      // Logger expectation removed - Firebase no longer used
    });
  });
});
