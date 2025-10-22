/**
 * @jest-environment node
 */

import {
  MaestroErrorIndicator,
  MAESTRO_TEST_IDS,
  createMaestroErrorIndicator,
  createMaestroErrorIndicatorFromState,
  getMaestroErrorBlockerCheck,
  getMaestroErrorDetectionScript,
  getMaestroTestData,
} from "@/lib/models/MaestroErrorIndicator";

describe("MaestroErrorIndicator", () => {
  it("creates indicator with correct default values", () => {
    const indicator = createMaestroErrorIndicator();

    expect(indicator.isVisible).toBe(false);
    expect(indicator.errorCount).toBe(0);
    expect(indicator.lastErrorMessage).toBe("");
    expect(indicator.lastErrorTimestamp).toBe("");
  });

  it("creates indicator with error state", () => {
    const errorMessage = "Test error occurred";
    const timestamp = new Date().toISOString();
    const indicator = createMaestroErrorIndicatorFromState(
      true,
      1,
      errorMessage,
      timestamp,
    );

    expect(indicator.isVisible).toBe(true);
    expect(indicator.errorCount).toBe(1);
    expect(indicator.lastErrorMessage).toBe(errorMessage);
    expect(indicator.lastErrorTimestamp).toBe(timestamp);
  });

  it("creates indicator from state correctly", () => {
    const hasError = true;
    const errorCount = 2;
    const lastError = "Second error";
    const timestamp = new Date().toISOString();

    const indicator = createMaestroErrorIndicatorFromState(
      hasError,
      errorCount,
      lastError,
      timestamp,
    );

    expect(indicator.isVisible).toBe(true);
    expect(indicator.errorCount).toBe(2);
    expect(indicator.lastErrorMessage).toBe("Second error");
    expect(indicator.lastErrorTimestamp).toBe(timestamp);
  });

  it("generates maestro error blocker check", () => {
    const check = getMaestroErrorBlockerCheck();

    expect(check).toContain("assertNotVisible");
    expect(check).toContain(MAESTRO_TEST_IDS.ERROR_BLOCKER);
  });

  it("generates maestro error detection script", () => {
    const script = getMaestroErrorDetectionScript();

    expect(script).toContain("findElement");
    expect(script).toContain(MAESTRO_TEST_IDS.ERROR_BLOCKER);
    expect(script).toContain(MAESTRO_TEST_IDS.ERROR_COUNT);
    expect(script).toContain(MAESTRO_TEST_IDS.ERROR_MESSAGE);
  });

  it("gets maestro test data", () => {
    const testData = getMaestroTestData();

    expect(testData.noErrorState.isVisible).toBe(false);
    expect(testData.singleErrorState.isVisible).toBe(true);
    expect(testData.singleErrorState.errorCount).toBe(1);
    expect(testData.multipleErrorsState.errorCount).toBe(3);
  });
});

describe("MAESTRO_TEST_IDS", () => {
  it("contains required test ID constants", () => {
    expect(MAESTRO_TEST_IDS.ERROR_BLOCKER).toBe("maestro-error-blocker");
    expect(MAESTRO_TEST_IDS.ERROR_COUNT).toBe("maestro-error-count");
    expect(MAESTRO_TEST_IDS.ERROR_MESSAGE).toBe("maestro-error-message");
  });
});

describe("createMaestroErrorIndicator", () => {
  it("creates indicator using factory function", () => {
    const indicator = createMaestroErrorIndicator();

    expect(indicator.isVisible).toBe(false);
    expect(indicator.errorCount).toBe(0);
    expect(indicator.lastErrorMessage).toBe("");
    expect(indicator.lastErrorTimestamp).toBe("");
  });

  it("creates indicator from state using factory function", () => {
    const hasError = true;
    const errorCount = 1;
    const errorMessage = "Factory error";
    const timestamp = new Date().toISOString();

    const indicator = createMaestroErrorIndicatorFromState(
      hasError,
      errorCount,
      errorMessage,
      timestamp,
    );

    expect(indicator.isVisible).toBe(true);
    expect(indicator.errorCount).toBe(1);
    expect(indicator.lastErrorMessage).toBe(errorMessage);
    expect(indicator.lastErrorTimestamp).toBe(timestamp);
  });
});
