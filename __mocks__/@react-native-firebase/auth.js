const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  isAnonymous: false,
};

const mockAuth = {
  onAuthStateChanged: jest.fn(() => jest.fn()), // Returns unsubscribe function
  signInAnonymously: jest.fn(() => Promise.resolve({ user: mockUser })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
  signOut: jest.fn(() => Promise.resolve()),
  currentUser: mockUser,
  useEmulator: jest.fn(),
};

const auth = () => mockAuth;

export default auth;

// Export types as well to match the real module
export const FirebaseAuthTypes = {
  AuthErrorCode: {},
};