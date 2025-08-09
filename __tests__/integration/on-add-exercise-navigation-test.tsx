jest.mock("@/app/initialise_firebase", () => ({
  // Mock the functions or exports from initialise_firebase.ts here.
  // For example, if it exports a function named `initialize`, you can mock it like this:
  initFirebase: jest.fn(),
}));

import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
import WorkoutScreen from "@/app/(tabs)/workout";
import ExerciseScreen from "@/app/(tabs)/exercises";
import { renderRouter, screen } from "expo-router/testing-library";
import RootLayout from "@/app/_layout";
import { preventAutoHideAsync } from "expo-router/build/utils/splash";
import { initFirebase } from "@/app/initialise_firebase";

jest.mock("expo-router", () => {
  const originalModule = jest.requireActual("expo-router");
  return {
    ...originalModule,
    SplashScreen: {
      preventAutoHideAsync: jest.fn(),
    },
  };
});

describe("navigation", () => {
  let state: CommonTestState;
  beforeEach(() => {
    state = new CommonTestState();
  });
  test("When the user adds an exercise they are returned to the workout screen", async () => {
    // Given
    renderRouter(
      {
        index: RootLayout,
        "(tabs)/exercises": () => <ExerciseScreen />,
        "(tabs)/exercises/add": () => <AddExerciseForm />,
        "(tabs)/workout": () => <WorkoutScreen />,
      },
      { initialUrl: "/(tabs)/exercises/add" },
    );

    // When
    await state.user.type(screen.getByTestId("name"), "Exercise Name");
    await state.user.press(screen.getByTestId("submit"));
    await state.user.press(screen.getByTestId("exercisesTab"));

    // Then
    expect(screen).toHavePathname("/(tabs)/exercises");
  });
});
