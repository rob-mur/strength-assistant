/**
 * Store Test
 *
 * Simple test to provide coverage for store.ts observables
 */

import { store$, exercises$, user$, isOnline$ } from "../../lib/data/store";

describe("Store", () => {
  it("should export store$ observable with default values", () => {
    expect(store$).toBeDefined();
    expect(store$.get()).toBeDefined();
  });

  it("should export individual observables", () => {
    expect(exercises$).toBeDefined();
    expect(user$).toBeDefined();
    expect(isOnline$).toBeDefined();

    expect(exercises$.get()).toEqual([]);
    expect(user$.get()).toEqual({
      id: "test-user-123",
      email: "test@example.com",
    });
    expect(isOnline$.get()).toBe(true);
  });

  it("should allow updating store values", () => {
    // Test that the observables can be updated via exerciseUtils
    const { exerciseUtils } = require("../../lib/data/store");
    const initialCount = exercises$.get().length;

    exerciseUtils.addExercise({ name: "Test Exercise" });
    expect(exercises$.get()).toHaveLength(initialCount + 1);

    // The test demonstrates that exercises$ is reactive
  });
});
