import { userEvent } from "@testing-library/react-native";
import { UserEventInstance } from "@testing-library/react-native/build/user-event/setup";
import { useRouter } from "expo-router";

jest.mock("expo-router");

export class CommonTestState {
  user: UserEventInstance;
  mockRouter: any;

  constructor() {
    this.user = userEvent.setup();
    // Get the mock router from the mocked useRouter
    const mockUseRouter = useRouter as jest.Mock;
    this.mockRouter = mockUseRouter();

    // Reset the calls for this test
    jest.clearAllMocks();
  }
}
