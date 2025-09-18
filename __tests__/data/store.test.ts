/**
 * Store Test
 *
 * Simple test to provide coverage for store.ts observables
 */

import { store$, exercises$, user$, isOnline$ } from "../../lib/data/store";

describe("Store", () => {
  it("should export store$ observable with default values", () => {
    expect(store$).toBeDefined();
    expect(store$.exercises.get()).toEqual([]);
    expect(store$.user.get()).toBeNull();
    expect(store$.isOnline.get()).toBe(true);
  });

  it("should export individual observables", () => {
    expect(exercises$).toBeDefined();
    expect(user$).toBeDefined();
    expect(isOnline$).toBeDefined();

    expect(exercises$.get()).toEqual([]);
    expect(user$.get()).toBeNull();
    expect(isOnline$.get()).toBe(true);
  });

  it("should allow updating store values", () => {
    // Test that the observables can be updated
    exercises$.set([{ id: "test", name: "Test Exercise" } as any]);
    expect(exercises$.get()).toHaveLength(1);

    // Reset for other tests
    exercises$.set([]);
  });
});
