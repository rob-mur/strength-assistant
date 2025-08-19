import { mock } from "jest-mock-extended";
import { useAuth as useAuthIn } from "@/lib/hooks/useAuth";
import { mocked } from "storybook/internal/test";

export const useAuth = jest.fn(() => mocked(useAuthIn));
