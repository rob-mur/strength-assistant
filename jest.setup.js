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
  
  // Ensure Platform object exists and set OS
  if (!RN.Platform) {
    RN.Platform = {};
  }
  RN.Platform.OS = 'web'; // Default to web for most tests
  
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