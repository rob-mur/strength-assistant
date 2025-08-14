import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-ondevice-actions";
import AddExerciseForm from "../../lib/components/Forms/AddExerciseForm";
import { View } from "react-native";

const meta: Meta<typeof AddExerciseForm> = {
  title: "Forms/AddExerciseForm",
  component: AddExerciseForm,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onSubmit: {
      action: "submitted",
      description: "Callback function called when form is submitted",
    },
  },
  args: {
    onSubmit: action("onSubmit"),
  },
};

export default meta;

type Story = StoryObj<typeof AddExerciseForm>;

export const Default: Story = {};