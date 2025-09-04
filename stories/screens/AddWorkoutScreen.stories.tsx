import AddWorkoutScreen from "@/app/add";
import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

const meta: Meta<typeof AddWorkoutScreen> = {
  title: "Screens/AddWorkoutScreen",
  component: AddWorkoutScreen,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof AddWorkoutScreen>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Add workout screen in loading state during form submission",
      },
    },
  },
};

export const WithValidationError: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Add workout screen showing validation error states",
      },
    },
  },
};