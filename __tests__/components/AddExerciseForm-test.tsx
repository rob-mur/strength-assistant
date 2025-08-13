import { useAddExercise } from "@/lib/hooks/useAddExercise";
import { render } from "@testing-library/react-native";
import { CommonTestState } from "../../__test_utils__/utils";
import AddExerciseForm from "@/lib/components/Forms/AddExerciseForm";

jest.mock("expo-router");
jest.mock("@/lib/data/firebase");
jest.mock("@/lib/hooks/useAddExercise");
const mockUseAddExercise = jest.mocked(useAddExercise);

describe("<AddExerciseForm/>", () => {
  let state: CommonTestState;

  beforeEach(() => {
    state = new CommonTestState();
    mockUseAddExercise.mockReturnValue(jest.fn(async (_) => {}));
  });

  test("When the user enters a name and pressed submit the callback is executed", async () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    // When
    await state.user.type(getByTestId("name"), "Exercise Name");
    await state.user.press(getByTestId("submit"));
    // Then
    expect(mockUseAddExercise.mock.lastCall).not.toBeNull();
  });
});
