/**
 * AuthProvider Component Tests
 * 
 * Comprehensive test coverage for the AuthProvider component including:
 * - Context creation and provider functionality
 * - Integration with useAuth hook
 * - Error handling and edge cases
 * - Authentication state management
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuthContext } from '../../lib/components/AuthProvider';
import * as useAuthModule from '../../lib/hooks/useAuth';
import type { AuthUser, AuthError } from '../../lib/hooks/useAuth';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Test component that uses AuthContext
const TestConsumer = ({ testId }: { testId: string }) => {
  const auth = useAuthContext();
  return (
    <Text testID={testId}>
      {JSON.stringify({
        hasUser: !!auth.user,
        loading: auth.loading,
        hasError: !!auth.error,
        userEmail: auth.user?.email,
        isAnonymous: auth.user?.isAnonymous,
      })}
    </Text>
  );
};

// Test component that calls auth methods
const TestAuthMethods = () => {
  const auth = useAuthContext();
  
  const handleSignInAnonymously = async () => {
    try {
      await auth.signInAnonymously();
    } catch (error) {
      // Error handled by auth hook
    }
  };

  const handleCreateAccount = async () => {
    try {
      await auth.createAccount('test@example.com', 'password123');
    } catch (error) {
      // Error handled by auth hook
    }
  };

  const handleSignIn = async () => {
    try {
      await auth.signIn('test@example.com', 'password123');
    } catch (error) {
      // Error handled by auth hook
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      // Error handled by auth hook
    }
  };

  const handleClearError = () => {
    auth.clearError();
  };

  return (
    <Text testID="auth-methods">
      Methods available: {typeof auth.signInAnonymously}, {typeof auth.createAccount}, 
      {typeof auth.signIn}, {typeof auth.signOut}, {typeof auth.clearError}
    </Text>
  );
};

describe('AuthProvider', () => {
  // Mock auth state for tests
  const createMockAuthState = (overrides: Partial<ReturnType<typeof useAuthModule.useAuth>> = {}) => ({
    user: null,
    loading: false,
    error: null,
    signInAnonymously: jest.fn(),
    createAccount: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    clearError: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(createMockAuthState());
  });

  describe('Context Provider', () => {
    it('should provide auth context to child components', () => {
      const mockAuth = createMockAuthState({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          isAnonymous: false,
        },
        loading: false,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer testId="auth-state" />
        </AuthProvider>
      );

      const authState = JSON.parse(getByTestId('auth-state').props.children);
      expect(authState).toEqual({
        hasUser: true,
        loading: false,
        hasError: false,
        userEmail: 'test@example.com',
        isAnonymous: false,
      });
    });

    it('should provide loading state', () => {
      const mockAuth = createMockAuthState({
        user: null,
        loading: true,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer testId="loading-state" />
        </AuthProvider>
      );

      const authState = JSON.parse(getByTestId('loading-state').props.children);
      expect(authState.loading).toBe(true);
      expect(authState.hasUser).toBe(false);
    });

    it('should provide error state', () => {
      const mockError: AuthError = {
        code: 'auth/invalid-email',
        message: 'Invalid email format',
      };
      const mockAuth = createMockAuthState({
        user: null,
        loading: false,
        error: mockError,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer testId="error-state" />
        </AuthProvider>
      );

      const authState = JSON.parse(getByTestId('error-state').props.children);
      expect(authState.hasError).toBe(true);
      expect(authState.hasUser).toBe(false);
    });

    it('should provide anonymous user state', () => {
      const mockAuth = createMockAuthState({
        user: {
          uid: 'anon-uid',
          email: null,
          isAnonymous: true,
        },
        loading: false,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer testId="anon-state" />
        </AuthProvider>
      );

      const authState = JSON.parse(getByTestId('anon-state').props.children);
      expect(authState).toEqual({
        hasUser: true,
        loading: false,
        hasError: false,
        userEmail: null,
        isAnonymous: true,
      });
    });
  });

  describe('Authentication Methods', () => {
    it('should provide all required authentication methods', () => {
      const mockSignInAnonymously = jest.fn();
      const mockCreateAccount = jest.fn();
      const mockSignIn = jest.fn();
      const mockSignOut = jest.fn();
      const mockClearError = jest.fn();

      const mockAuth = createMockAuthState({
        signInAnonymously: mockSignInAnonymously,
        createAccount: mockCreateAccount,
        signIn: mockSignIn,
        signOut: mockSignOut,
        clearError: mockClearError,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthMethods />
        </AuthProvider>
      );

      const methodsText = getByTestId('auth-methods').props.children;
      expect(methodsText).toContain('function'); // All methods should be functions
    });

    it('should call signInAnonymously when method is invoked', async () => {
      const mockSignInAnonymously = jest.fn().mockResolvedValue(undefined);
      const mockAuth = createMockAuthState({
        signInAnonymously: mockSignInAnonymously,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const TestComponent = () => {
        const auth = useAuthContext();
        React.useEffect(() => {
          auth.signInAnonymously();
        }, [auth]);
        return <Text testID="test">Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
      });
    });

    it('should call createAccount with correct parameters', async () => {
      const mockCreateAccount = jest.fn().mockResolvedValue(undefined);
      const mockAuth = createMockAuthState({
        createAccount: mockCreateAccount,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const TestComponent = () => {
        const auth = useAuthContext();
        React.useEffect(() => {
          auth.createAccount('test@example.com', 'password123');
        }, [auth]);
        return <Text testID="test">Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockCreateAccount).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should call signIn with correct parameters', async () => {
      const mockSignIn = jest.fn().mockResolvedValue(undefined);
      const mockAuth = createMockAuthState({
        signIn: mockSignIn,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const TestComponent = () => {
        const auth = useAuthContext();
        React.useEffect(() => {
          auth.signIn('user@example.com', 'mypassword');
        }, [auth]);
        return <Text testID="test">Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'mypassword');
      });
    });

    it('should call signOut when method is invoked', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      const mockAuth = createMockAuthState({
        signOut: mockSignOut,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const TestComponent = () => {
        const auth = useAuthContext();
        React.useEffect(() => {
          auth.signOut();
        }, [auth]);
        return <Text testID="test">Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it('should call clearError when method is invoked', () => {
      const mockClearError = jest.fn();
      const mockAuth = createMockAuthState({
        clearError: mockClearError,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const TestComponent = () => {
        const auth = useAuthContext();
        React.useEffect(() => {
          auth.clearError();
        }, [auth]);
        return <Text testID="test">Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useAuthContext is used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        const auth = useAuthContext();
        return <Text>{auth.user?.email}</Text>;
      };

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAuthContext must be used within an AuthProvider');
    });

    it('should handle auth method errors gracefully', async () => {
      const mockError = new Error('Auth failed');
      const mockSignIn = jest.fn().mockRejectedValue(mockError);
      const mockAuth = createMockAuthState({
        signIn: mockSignIn,
        error: {
          code: 'auth/failed',
          message: 'Auth failed',
        },
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const TestComponent = () => {
        const auth = useAuthContext();
        const [errorOccurred, setErrorOccurred] = React.useState(false);

        const handleSignIn = async () => {
          try {
            await auth.signIn('test@example.com', 'wrong-password');
          } catch (error) {
            setErrorOccurred(true);
          }
        };

        React.useEffect(() => {
          handleSignIn();
        }, []);

        return (
          <Text testID="error-test">
            {errorOccurred ? 'Error occurred' : 'No error'}
          </Text>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // Error should be handled gracefully, component should still render
      expect(getByTestId('error-test')).toBeTruthy();
    });
  });

  describe('State Updates', () => {
    it('should reflect different auth states from useAuth hook', () => {
      // Test loading state
      const loadingAuth = createMockAuthState({
        user: null,
        loading: true,
      });
      mockUseAuth.mockReturnValue(loadingAuth);

      const { getByTestId, rerender } = render(
        <AuthProvider>
          <TestConsumer testId="state-test" />
        </AuthProvider>
      );

      let authState = JSON.parse(getByTestId('state-test').props.children);
      expect(authState.loading).toBe(true);
      expect(authState.hasUser).toBe(false);

      // Test authenticated state
      const authenticatedAuth = createMockAuthState({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          isAnonymous: false,
        },
        loading: false,
      });
      mockUseAuth.mockReturnValue(authenticatedAuth);

      rerender(
        <AuthProvider>
          <TestConsumer testId="state-test" />
        </AuthProvider>
      );

      authState = JSON.parse(getByTestId('state-test').props.children);
      expect(authState.loading).toBe(false);
      expect(authState.hasUser).toBe(true);
      expect(authState.userEmail).toBe('test@example.com');
    });
  });

  describe('Integration', () => {
    it('should integrate properly with useAuth hook', () => {
      const mockAuth = createMockAuthState({
        user: {
          uid: 'integration-test',
          email: 'integration@test.com',
          isAnonymous: false,
        },
        loading: false,
        error: null,
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer testId="integration-test" />
        </AuthProvider>
      );

      // Verify that useAuth was called
      expect(mockUseAuth).toHaveBeenCalledTimes(1);

      // Verify that auth state is properly provided
      const authState = JSON.parse(getByTestId('integration-test').props.children);
      expect(authState.userEmail).toBe('integration@test.com');
      expect(authState.isAnonymous).toBe(false);
    });

    it('should handle multiple child components', () => {
      const mockAuth = createMockAuthState({
        user: {
          uid: 'multi-child-test',
          email: 'multi@test.com',
          isAnonymous: false,
        },
      });
      mockUseAuth.mockReturnValue(mockAuth);

      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer testId="child1" />
          <TestConsumer testId="child2" />
          <TestAuthMethods />
        </AuthProvider>
      );

      // All children should have access to the same auth context
      const child1State = JSON.parse(getByTestId('child1').props.children);
      const child2State = JSON.parse(getByTestId('child2').props.children);
      
      expect(child1State.userEmail).toBe('multi@test.com');
      expect(child2State.userEmail).toBe('multi@test.com');
      expect(getByTestId('auth-methods')).toBeTruthy();
    });
  });
});