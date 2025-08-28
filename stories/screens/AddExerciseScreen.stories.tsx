import AddExerciseScreen from "@/app/(tabs)/exercises/add";
import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

const meta: Meta<typeof AddExerciseScreen> = {
  title: "Screens/AddExerciseScreen",
  component: AddExerciseScreen,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof AddExerciseScreen>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Add exercise screen in loading state during form submission",
      },
    },
  },
};

export const WithValidationError: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Add exercise screen showing validation error states",
      },
    },
  },
};
