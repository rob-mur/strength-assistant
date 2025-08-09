// import { CommonTestState } from "../../__test_utils__/utils";
// import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";
// import WorkoutScreen from "@/app/(tabs)/workout";
// import ExerciseScreen from "@/app/(tabs)/exercises";
// import { renderRouter, screen } from "expo-router/testing-library";
//
// describe("navigation", () => {
//   let state: CommonTestState;
//   beforeEach(() => {
//     state = new CommonTestState();
//   });
//   test("When the user adds an exercise they are returned to the workout screen", async () => {
//     // Given
//     renderRouter(
//       {
//         "(tabs)/exercises": () => <ExerciseScreen />,
//
//         "(tabs)/exercises/add": () => <AddExerciseForm />,
//         "(tabs)/workout": () => <WorkoutScreen />,
//       },
//       { initialUrl: "/(tabs)/exercises/add" },
//     );
//
//     // When
//     await state.user.type(screen.getByTestId("name"), "Exercise Name");
//     await state.user.press(screen.getByTestId("submit"));
//     await state.user.press(screen.getByTestId("exercisesTab"));
//
//     // Then
//     expect(screen).toHavePathname("/(tabs)/exercises");
//   });
// });
import { renderRouter, screen } from "expo-router/testing-library";
import { View } from "react-native";

it("my-test", async () => {
  const MockComponent = jest.fn(() => <View />);

  renderRouter(
    {
      index: MockComponent,
      "directory/a": MockComponent,
      "(group)/b": MockComponent,
    },
    {
      initialUrl: "/directory/a",
    },
  );

  expect(screen).toHavePathname("/directory/a");
});
