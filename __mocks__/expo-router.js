// @ts-nocheck
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  canDismiss: jest.fn(),
  navigate: jest.fn(),
};

const MockStack = ({ children }) => children;
MockStack.Screen = jest.fn(() => null);

module.exports = {
  Stack: MockStack,
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({})),
  router: mockRouter,
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
  ErrorBoundary: ({ children }) => children,
};
