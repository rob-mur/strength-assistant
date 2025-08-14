import { userEvent } from "@testing-library/react-native";
import { UserEventInstance } from "@testing-library/react-native/build/user-event/setup";
import { useRouter } from "expo-router";

export class CommonTestState {
  user: UserEventInstance;
  mockRouter = { navigate: jest.fn(), back: jest.fn() };

  constructor() {
    this.user = userEvent.setup();
    (useRouter as jest.Mock).mockReturnValue(this.mockRouter);
  }
}
