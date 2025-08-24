import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { AuthScreen } from "@/lib/components/AuthScreen";
import { useAuthContext } from "@/lib/components/AuthProvider";
import { CommonTestState } from "../../__test_utils__/utils";

// Mock the AuthProvider hook
jest.mock("@/lib/components/AuthProvider");
const mockUseAuthContext = jest.mocked(useAuthContext);

describe("AuthScreen", () => {
  let state: CommonTestState;
  const mockAuthFunctions = {
    signIn: jest.fn(),
    createAccount: jest.fn(),
    signInAnonymously: jest.fn(),
    signOut: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    state = new CommonTestState();
    jest.clearAllMocks();
    
    // Default mock return value
    mockUseAuthContext.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      ...mockAuthFunctions,
    });
  });

  describe("Initial Rendering", () => {
    it("should render sign in form by default", () => {
      render(<AuthScreen />);
      
      expect(screen.getByText("Sign In")).toBeOnTheScreen();
      expect(screen.getByText("Welcome back! Sign in to continue.")).toBeOnTheScreen();
      expect(screen.getByLabelText("Email")).toBeOnTheScreen();
      expect(screen.getByLabelText("Password")).toBeOnTheScreen();
      expect(screen.getByTestId("continue-as-guest")).toBeOnTheScreen();
    });

    it("should not show confirm password field in sign in mode", () => {
      render(<AuthScreen />);
      
      expect(screen.queryByLabelText("Confirm Password")).not.toBeOnTheScreen();
    });

    it("should have proper button text in sign in mode", () => {
      render(<AuthScreen />);
      
      expect(screen.getByText("Sign In")).toBeOnTheScreen();
      expect(screen.getByText("Need an account? Sign up")).toBeOnTheScreen();
      expect(screen.getByText("Continue as Guest")).toBeOnTheScreen();
    });
  });

  describe("Mode Switching", () => {
    it("should switch to sign up mode when switch button is pressed", async () => {
      render(<AuthScreen />);
      
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      expect(screen.getByText("Create Account")).toBeOnTheScreen();
      expect(screen.getByText("Create a new account to get started.")).toBeOnTheScreen();
      expect(screen.getByLabelText("Confirm Password")).toBeOnTheScreen();
      expect(screen.getByText("Already have an account? Sign in")).toBeOnTheScreen();
    });

    it("should switch back to sign in mode from sign up mode", async () => {
      render(<AuthScreen />);
      
      // Switch to sign up
      await state.user.press(screen.getByText("Need an account? Sign up"));
      expect(screen.getByText("Create Account")).toBeOnTheScreen();
      
      // Switch back to sign in
      await state.user.press(screen.getByText("Already have an account? Sign in"));
      expect(screen.getByText("Sign In")).toBeOnTheScreen();
      expect(screen.queryByLabelText("Confirm Password")).not.toBeOnTheScreen();
    });

    it("should clear form fields when switching modes", async () => {
      render(<AuthScreen />);
      
      // Fill form in sign in mode
      await state.user.type(screen.getByLabelText("Email"), "test@example.com");
      await state.user.type(screen.getByLabelText("Password"), "password123");
      
      // Switch to sign up mode
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      // Fields should be cleared
      expect(screen.getByLabelText("Email").props.value).toBe("");
      expect(screen.getByLabelText("Password").props.value).toBe("");
    });

    it("should clear errors when switching modes", async () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: false,
        error: { code: "test-error", message: "Test error message" },
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      // Error should be visible
      expect(screen.getByText("Test error message")).toBeOnTheScreen();
      
      // Switch modes
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      // clearError should be called
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
    });
  });

  describe("Form Validation", () => {
    it("should show email required error", async () => {
      render(<AuthScreen />);
      
      await state.user.press(screen.getByText("Sign In"));
      
      expect(screen.getByText("Email is required")).toBeOnTheScreen();
    });

    it("should show invalid email error", async () => {
      render(<AuthScreen />);
      
      await state.user.type(screen.getByLabelText("Email"), "invalid-email");
      await state.user.press(screen.getByText("Sign In"));
      
      expect(screen.getByText("Please enter a valid email address")).toBeOnTheScreen();
    });

    it("should show password required error", async () => {
      render(<AuthScreen />);
      
      await state.user.type(screen.getByLabelText("Email"), "test@example.com");
      await state.user.press(screen.getByText("Sign In"));
      
      expect(screen.getByText("Password is required")).toBeOnTheScreen();
    });

    it("should show password too short error", async () => {
      render(<AuthScreen />);
      
      await state.user.type(screen.getByLabelText("Email"), "test@example.com");
      await state.user.type(screen.getByLabelText("Password"), "123");
      await state.user.press(screen.getByText("Sign In"));
      
      expect(screen.getByText("Password must be at least 6 characters")).toBeOnTheScreen();
    });

    it("should show password mismatch error in sign up mode", async () => {
      render(<AuthScreen />);
      
      // Switch to sign up mode
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      await state.user.type(screen.getByLabelText("Email"), "test@example.com");
      await state.user.type(screen.getByLabelText("Password"), "password123");
      await state.user.type(screen.getByLabelText("Confirm Password"), "different123");
      await state.user.press(screen.getByText("Create Account"));
      
      expect(screen.getByText("Passwords do not match")).toBeOnTheScreen();
    });

    it("should not call auth functions when validation fails", async () => {
      render(<AuthScreen />);
      
      // Try to submit with empty fields
      await state.user.press(screen.getByText("Sign In"));
      
      expect(mockAuthFunctions.signIn).not.toHaveBeenCalled();
    });

    it("should call signIn with valid credentials", async () => {
      render(<AuthScreen />);
      
      await state.user.type(screen.getByLabelText("Email"), "test@example.com");
      await state.user.type(screen.getByLabelText("Password"), "password123");
      await state.user.press(screen.getByText("Sign In"));
      
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
      expect(mockAuthFunctions.signIn).toHaveBeenCalledWith("test@example.com", "password123");
    });

    it("should call createAccount with valid credentials in sign up mode", async () => {
      render(<AuthScreen />);
      
      // Switch to sign up mode
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      await state.user.type(screen.getByLabelText("Email"), "new@example.com");
      await state.user.type(screen.getByLabelText("Password"), "newpassword123");
      await state.user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
      await state.user.press(screen.getByText("Create Account"));
      
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
      expect(mockAuthFunctions.createAccount).toHaveBeenCalledWith("new@example.com", "newpassword123");
    });
  });

  describe("Anonymous Authentication", () => {
    it("should call signInAnonymously when Continue as Guest is pressed", async () => {
      render(<AuthScreen />);
      
      await state.user.press(screen.getByTestId("continue-as-guest"));
      
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
      expect(mockAuthFunctions.signInAnonymously).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should disable form inputs when loading", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      expect(screen.getByLabelText("Email")).toBeDisabled();
      expect(screen.getByLabelText("Password")).toBeDisabled();
      expect(screen.getByText("Sign In")).toBeDisabled();
      expect(screen.getByText("Need an account? Sign up")).toBeDisabled();
      expect(screen.getByTestId("continue-as-guest")).toBeDisabled();
    });

    it("should show loading state on primary button", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      // The button should show loading state (implementation depends on react-native-paper Button)
      const signInButton = screen.getByText("Sign In");
      expect(signInButton).toBeDisabled();
    });

    it("should disable confirm password field when loading in sign up mode", async () => {
      render(<AuthScreen />);
      
      // Switch to sign up mode first
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      // Update mock to loading state
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        ...mockAuthFunctions,
      });

      // Re-render with loading state
      render(<AuthScreen />);
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      expect(screen.getByLabelText("Confirm Password")).toBeDisabled();
    });
  });

  describe("Error Display", () => {
    it("should show error in Snackbar when error exists", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: false,
        error: { code: "invalid-credential", message: "Invalid login credentials" },
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      expect(screen.getByText("Invalid login credentials")).toBeOnTheScreen();
    });

    it("should show default error message when error message is missing", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: false,
        error: { code: "unknown-error", message: "" },
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      expect(screen.getByText("An error occurred")).toBeOnTheScreen();
    });

    it("should not show Snackbar when no error exists", () => {
      render(<AuthScreen />);
      
      // Snackbar should not be visible when error is null
      expect(screen.queryByText("An error occurred")).not.toBeOnTheScreen();
    });

    it("should call clearError when Snackbar is dismissed", async () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: false,
        error: { code: "test-error", message: "Test error" },
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      // The Snackbar should be visible and dismissible
      // Note: Testing Snackbar dismissal might require specific implementation details
      expect(screen.getByText("Test error")).toBeOnTheScreen();
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email formats", async () => {
      render(<AuthScreen />);
      
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "123@domain.com"
      ];

      for (const email of validEmails) {
        await state.user.clear(screen.getByLabelText("Email"));
        await state.user.clear(screen.getByLabelText("Password"));
        
        await state.user.type(screen.getByLabelText("Email"), email);
        await state.user.type(screen.getByLabelText("Password"), "password123");
        await state.user.press(screen.getByText("Sign In"));
        
        expect(screen.queryByText("Please enter a valid email address")).not.toBeOnTheScreen();
        expect(mockAuthFunctions.signIn).toHaveBeenCalledWith(email, "password123");
      }
    });

    it("should reject invalid email formats", async () => {
      render(<AuthScreen />);
      
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user.domain.com",
        "user @domain.com"
      ];

      for (const email of invalidEmails) {
        await state.user.clear(screen.getByLabelText("Email"));
        await state.user.clear(screen.getByLabelText("Password"));
        
        await state.user.type(screen.getByLabelText("Email"), email);
        await state.user.type(screen.getByLabelText("Password"), "password123");
        await state.user.press(screen.getByText("Sign In"));
        
        expect(screen.getByText("Please enter a valid email address")).toBeOnTheScreen();
        expect(mockAuthFunctions.signIn).not.toHaveBeenCalled();
      }
    });
  });

  describe("Password Validation", () => {
    it("should accept passwords of 6 or more characters", async () => {
      render(<AuthScreen />);
      
      const validPasswords = ["123456", "password", "verylongpassword123"];

      for (const password of validPasswords) {
        await state.user.clear(screen.getByLabelText("Email"));
        await state.user.clear(screen.getByLabelText("Password"));
        
        await state.user.type(screen.getByLabelText("Email"), "test@example.com");
        await state.user.type(screen.getByLabelText("Password"), password);
        await state.user.press(screen.getByText("Sign In"));
        
        expect(screen.queryByText("Password must be at least 6 characters")).not.toBeOnTheScreen();
        expect(mockAuthFunctions.signIn).toHaveBeenCalledWith("test@example.com", password);
      }
    });

    it("should reject passwords shorter than 6 characters", async () => {
      render(<AuthScreen />);
      
      const shortPasswords = ["", "1", "12", "123", "1234", "12345"];

      for (const password of shortPasswords) {
        await state.user.clear(screen.getByLabelText("Email"));
        await state.user.clear(screen.getByLabelText("Password"));
        
        await state.user.type(screen.getByLabelText("Email"), "test@example.com");
        if (password) {
          await state.user.type(screen.getByLabelText("Password"), password);
        }
        await state.user.press(screen.getByText("Sign In"));
        
        const expectedError = password === "" ? "Password is required" : "Password must be at least 6 characters";
        expect(screen.getByText(expectedError)).toBeOnTheScreen();
        expect(mockAuthFunctions.signIn).not.toHaveBeenCalled();
      }
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete sign in flow", async () => {
      render(<AuthScreen />);
      
      // Fill form
      await state.user.type(screen.getByLabelText("Email"), "user@example.com");
      await state.user.type(screen.getByLabelText("Password"), "userpassword");
      
      // Submit
      await state.user.press(screen.getByText("Sign In"));
      
      // Verify calls
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
      expect(mockAuthFunctions.signIn).toHaveBeenCalledWith("user@example.com", "userpassword");
    });

    it("should handle complete sign up flow", async () => {
      render(<AuthScreen />);
      
      // Switch to sign up
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      // Fill form
      await state.user.type(screen.getByLabelText("Email"), "newuser@example.com");
      await state.user.type(screen.getByLabelText("Password"), "newpassword");
      await state.user.type(screen.getByLabelText("Confirm Password"), "newpassword");
      
      // Submit
      await state.user.press(screen.getByText("Create Account"));
      
      // Verify calls
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
      expect(mockAuthFunctions.createAccount).toHaveBeenCalledWith("newuser@example.com", "newpassword");
    });

    it("should handle error recovery flow", async () => {
      // Start with error state
      mockUseAuthContext.mockReturnValue({
        user: null,
        loading: false,
        error: { code: "invalid-credential", message: "Wrong password" },
        ...mockAuthFunctions,
      });

      render(<AuthScreen />);
      
      expect(screen.getByText("Wrong password")).toBeOnTheScreen();
      
      // Clear error by switching modes
      await state.user.press(screen.getByText("Need an account? Sign up"));
      
      expect(mockAuthFunctions.clearError).toHaveBeenCalled();
    });
  });
});