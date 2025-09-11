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

// Set up test environment variables for Supabase
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.USE_SUPABASE_DATA = 'false'; // Default to Firebase for tests
process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR = 'true';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
  };

  const mockAuthResponse = {
    data: { user: mockUser, session: { user: mockUser } },
    error: null,
  };

  const mockSupabaseClient = {
    auth: {
      signUp: jest.fn(() => Promise.resolve(mockAuthResponse)),
      signInWithPassword: jest.fn(() => Promise.resolve(mockAuthResponse)),
      signInAnonymously: jest.fn(() => Promise.resolve({
        data: { user: { ...mockUser, email: undefined }, session: { user: { ...mockUser, email: undefined } } },
        error: null,
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: {} }, unsubscribe: jest.fn() })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null })),
      insert: jest.fn(() => ({ data: null, error: null })),
      update: jest.fn(() => ({ data: null, error: null })),
      delete: jest.fn(() => ({ data: null, error: null })),
    })),
  };

  return {
    createClient: jest.fn(() => mockSupabaseClient),
  };
});