// Mock React Native Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
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
  
  return {
    __esModule: true,
    default: auth,
    FirebaseAuthTypes: {
      AuthErrorCode: {},
    },
  };
});

// Mock platform detection to avoid requiring native Firebase
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'ios'; // Set to non-web to test native path
  return RN;
});

// Mock navigator global for web APIs used in isOnline() method
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
  configurable: true,
});