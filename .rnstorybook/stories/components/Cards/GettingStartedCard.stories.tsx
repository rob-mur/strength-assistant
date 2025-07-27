import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Meta, StoryObj } from "@storybook/react-native";
import { Router } from "expo-router";

const meta = {
  title: "Cards/Getting Started",
  component: GettingStartedCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GettingStartedCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    explanation: "Select an exercise to get started",
    call_to_action: "Go!",
    on_get_started: (_: Router) => console.log("Go button clicked!"),
  },
};
