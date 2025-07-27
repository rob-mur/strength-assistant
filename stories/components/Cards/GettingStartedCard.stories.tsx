import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Meta, StoryObj } from "@storybook/react-native";
import { Router } from "expo-router";
import { fn } from "storybook/test";

const meta = {
  title: "Cards/Getting Started",
  component: GettingStartedCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    on_get_started: {
      action: "on_get_started",
      type: {
        name: "function",
        required: true,
      },
    },
  },
  args: { on_get_started: fn() },
} satisfies Meta<typeof GettingStartedCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    explanation: "Select an exercise to get started",
    call_to_action: "Go!",
    on_get_started: fn((_: Router) => console.log("Go button clicked!")),
  },
};
