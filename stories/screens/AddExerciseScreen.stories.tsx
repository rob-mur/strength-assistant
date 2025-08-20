import AddExerciseScreen from "@/app/(tabs)/exercises/add";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Router } from "expo-router";
import { fn } from "storybook/test";

const meta: Meta<typeof AddExerciseScreen> = {
  title: "Screens/AddExercisesScreen",
  component: AddExerciseScreen,
  parameters: {
    layout: "padded",
  },
  argTypes: { onExerciseSubmitted: fn() },
};

export default meta;

type Story = StoryObj<typeof AddExerciseScreen>;

export const Default: Story = {
  args: {
    onExerciseSubmitted: fn((_: Router, exercise: string) =>
      console.log(`Submitting exercise ${exercise}`),
    ),
  },
};
