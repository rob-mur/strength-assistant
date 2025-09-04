import WorkoutScreen from "@/app/(tabs)/workout";
import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

const meta: Meta<typeof WorkoutScreen> = {
  title: "Screens/WorkoutScreen",
  component: WorkoutScreen,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    selectedExercise: {
      control: "text",
      description: "The selected exercise to display",
    },
  },
};

export default meta;

type Story = StoryObj<typeof WorkoutScreen>;

export const Default: Story = {
  args: {
    selectedExercise: "Bench Press",
  },
};

export const NoExerciseSelected: Story = {
  args: {
    selectedExercise: null,
  },
};

export const LongExerciseName: Story = {
  args: {
    selectedExercise: "Barbell Romanian Deadlift with Pause",
  },
};