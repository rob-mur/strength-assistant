// @ts-nocheck
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  canDismiss: jest.fn(),
  navigate: jest.fn(),
};

const MockStack = jest.fn(({ children }) => children);
MockStack.Screen = jest.fn(() => null);

const MockTabs = jest.fn(({ children }) => children);
MockTabs.Screen = jest.fn(() => null);

module.exports = {
  Stack: MockStack,
  Tabs: MockTabs,
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({})),
  router: mockRouter,
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
  ErrorBoundary: ({ children }) => children,
};
