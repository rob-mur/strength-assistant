import type { Meta, StoryObj } from "@storybook/react";
import ExerciseList from "../../lib/components/ExerciseList";
import { View } from "react-native";

const meta: Meta<typeof ExerciseList> = {
  title: "Lists/ExerciseList",
  component: ExerciseList,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    exercises: {
      control: "object",
      description: "Array of exercise objects",
    },
  },
  args: {
    exercises: [
      {
        id: "1",
        name: "Bench Press",
      },
      {
        id: "2",
        name: "Squat",
      },
      {
        id: "3",
        name: "Deadlift",
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ExerciseList>;

export const Default: Story = {};
