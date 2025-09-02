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
        user_id: "story-user",
        created_at: "2023-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Squat",
        user_id: "story-user",
        created_at: "2023-01-01T01:00:00Z",
      },
      {
        id: "3",
        name: "Deadlift",
        user_id: "story-user",
        created_at: "2023-01-01T02:00:00Z",
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ExerciseList>;

export const Default: Story = {};
