import ExercisesScreen from "@/app/(tabs)/exercises";
import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

const meta: Meta<typeof ExercisesScreen> = {
  title: "Screens/ExercisesScreen",
  component: ExercisesScreen,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    onAddExercise: { action: fn() },
  },
};

export default meta;

type Story = StoryObj<typeof ExercisesScreen>;

export const Default: Story = {
  args: {
    onAddExercise: fn((_) => {
      console.log("Request to add exercise");
    }),
  },
};
