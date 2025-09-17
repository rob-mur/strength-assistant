import { jest } from "@jest/globals";

// Create a consistent mock router instance
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  canDismiss: jest.fn(),
  navigate: jest.fn(),
  canGoBack: jest.fn(),
  setParams: jest.fn(),
};

export const useRouter = jest.fn(() => mockRouter);
export const useLocalSearchParams = jest.fn(() => ({}));

// Mock Stack and Tabs components
const MockStack = jest.fn(({ children }: any) => children) as any;
MockStack.Screen = jest.fn(() => null);

const MockTabs = jest.fn(({ children }: any) => children) as any;
MockTabs.Screen = jest.fn(() => null);

export const Stack = MockStack;
export const Tabs = MockTabs;

// Export the router instance for direct access in tests
export const router = mockRouter;

// Mock other exports that might be needed
export const SplashScreen = {
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
};

export const ErrorBoundary = ({ children }: any) => children;