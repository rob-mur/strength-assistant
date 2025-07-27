import HomeScreen from "@/app/(tabs)";
import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

const meta: Meta<typeof HomeScreen> = {
  title: "Screens/HomeScreen",
  component: HomeScreen,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    onUserReadyToStart: { action: fn() },
  },
};

export default meta;

type Story = StoryObj<typeof HomeScreen>;

export const Default: Story = {
  args: {
    onUserReadyToStart: fn((_) => {
      console.log("Ready to start");
    }),
  },
};
