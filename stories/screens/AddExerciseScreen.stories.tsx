import AddExerciseScreen from "@/app/(tabs)/exercises/add";
import type { Meta, StoryObj } from "@storybook/react-native";
import { action } from "@storybook/addon-ondevice-actions";

const meta: Meta<typeof AddExerciseScreen> = {
  title: "Screens/AddExercisesScreen",
  component: AddExerciseScreen,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof AddExerciseScreen>;

export const Default: Story = {
  args: {
    onSubmit: action("onSubmit"),
  },
};
