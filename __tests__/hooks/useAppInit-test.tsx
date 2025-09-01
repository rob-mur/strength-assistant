// Simple test for useAppInit that verifies the hook exists and is callable
describe("useAppInit", () => {
  test("hook exists and can be imported", () => {
    expect(typeof require("@/lib/hooks/useAppInit").useAppInit).toBe("function");
  });
});