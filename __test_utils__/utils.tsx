import { userEvent } from '@testing-library/react-native';
import { UserEventInstance } from '@testing-library/react-native/build/user-event/setup';

export class CommonTestState {
  user: UserEventInstance;
  constructor() {
    this.user = userEvent.setup();
  }
}
