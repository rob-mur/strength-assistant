export const useAuth = jest.fn(() => ({
  user: { uid: "test-uid", email: "test@example.com", isAnonymous: false },
  loading: false,
  error: null,
  signInAnonymously: jest.fn(),
  createAccount: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  clearError: jest.fn(),
}));
