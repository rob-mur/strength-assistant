import AddExerciseScreen from "@/app/(tabs)/exercises/add";
import type { Meta, StoryObj } from "@storybook/react-native";

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
  args: {},
};
