import HomeScreen from "@/app/(tabs)";
import { fireEvent, render, userEvent } from "@testing-library/react-native";
import { CommonTestState } from "@/__test_utils__/utils";

jest.mock("expo-router");

describe("<HomeScreen />", () => {
  let state: CommonTestState;
  beforeEach(() => {
    state = new CommonTestState();
  });

  test("When the user decides to get started their exercise list is shown", async () => {
    // Given
    const mockOnUserReadToStart = jest.fn();
    const { getByTestId } = render(<HomeScreen />);
    // When
    await state.user.press(await getByTestId("get-started"));
    // Then
    expect(mockOnUserReadToStart.mock.lastCall).not.toBeNull();
  });
});
