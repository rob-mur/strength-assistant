import { jest } from "@jest/globals";
import { mock } from "jest-mock-extended";
import { Router, UnknownOutputParams } from "expo-router";

export const useRouter = jest.fn(() => mock<Router>());
export const useLocalSearchParams = jest.fn(() => mock<UnknownOutputParams>());