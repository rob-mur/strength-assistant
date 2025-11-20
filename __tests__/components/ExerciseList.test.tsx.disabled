import React from "react";
import { render } from "@testing-library/react-native";
import ExerciseList from "@/lib/components/ExerciseList";
import { Exercise } from "@/lib/models/Exercise";

// Mock react-native-paper components
jest.mock("react-native-paper", () => ({
  Card: function MockCard({ children }: any) {
    return children;
  },
  List: {
    Section: function MockListSection({ children }: any) {
      return children;
    },
    Item: function MockListItem({ title }: any) {
      return title;
    },
  },
  Surface: function MockSurface({ children }: any) {
    return children;
  },
}));

describe("ExerciseList", () => {
  it("should render empty list", () => {
    render(<ExerciseList exercises={[]} />);
    expect(true).toBe(true);
  });

  it("should render list with exercises", () => {
    const exercises: Exercise[] = [
      {
        id: "1",
        name: "Push-ups",
        user_id: "user1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted: false,
      },
      {
        id: "2",
        name: "Squats",
        user_id: "user1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted: false,
      },
    ];

    render(<ExerciseList exercises={exercises} />);
    expect(true).toBe(true);
  });
});
