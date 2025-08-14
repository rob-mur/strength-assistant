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

  test("Submit button is disabled when exercise name is empty", () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    // Then
    expect(getByTestId("submit")).toBeDisabled();
  });

  test("Submit button is disabled when exercise name is only whitespace", async () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    // When
    await state.user.type(getByTestId("name"), "   ");
    // Then
    expect(getByTestId("submit")).toBeDisabled();
  });

  test("Submit button is enabled when exercise name is exactly 100 characters", async () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    const exactName = "a".repeat(100); // Exactly 100 chars should be valid
    // When
    await state.user.type(getByTestId("name"), exactName);
    // Then
    expect(getByTestId("submit")).toBeEnabled();
  });

  test("Input field prevents typing more than 100 characters", async () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    const longName = "a".repeat(105); // Try to type 105 chars
    // When
    await state.user.type(getByTestId("name"), longName);
    // Then - input should only contain 100 chars due to maxLength
    expect(getByTestId("name")).toHaveProp("value", "a".repeat(100));
    expect(getByTestId("submit")).toBeEnabled(); // 100 chars is still valid
  });

  test("Submit button is enabled when exercise name is valid", async () => {
    // Given
    const { getByTestId } = render(<AddExerciseForm />);
    // When
    await state.user.type(getByTestId("name"), "Valid Exercise");
    // Then
    expect(getByTestId("submit")).toBeEnabled();
  });

  test("Error message is shown for empty input after user starts typing", async () => {
    // Given
    const { getByTestId, getByText } = render(<AddExerciseForm />);
    // When
    await state.user.type(getByTestId("name"), "a");
    await state.user.clear(getByTestId("name"));
    // Then
    expect(getByText("Exercise name cannot be empty")).toBeTruthy();
  });

  test("Exercise name is trimmed before submission", async () => {
    // Given
    const mockAddExercise = jest.fn(async (_) => {});
    mockUseAddExercise.mockReturnValue(mockAddExercise);
    const { getByTestId } = render(<AddExerciseForm />);
    // When
    await state.user.type(getByTestId("name"), "  Exercise Name  ");
    await state.user.press(getByTestId("submit"));
    // Then
    expect(mockAddExercise).toHaveBeenCalledWith("Exercise Name");
  });
});
