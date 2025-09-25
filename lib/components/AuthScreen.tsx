import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Snackbar,
  HelperText,
  Divider,
} from "react-native-paper";
import { useAuthContext } from "./AuthProvider";

type AuthMode = "signin" | "signup";

export function AuthScreen() {
  const {
    signIn,
    createAccount,
    signInAnonymously,
    error,
    loading,
    clearError,
  } = useAuthContext();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    clearError();

    if (mode === "signin") {
      await signIn(email, password);
    } else {
      await createAccount(email, password);
    }
  };

  const handleAnonymousAuth = async () => {
    clearError();
    await signInAnonymously();
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEmailError("");
    setPasswordError("");
    clearError();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {mode === "signin"
                ? "Welcome back! Sign in to continue."
                : "Create a new account to get started."}
            </Text>

            <View style={styles.form}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!emailError}
                disabled={loading}
                style={styles.input}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                error={!!passwordError}
                disabled={loading}
                style={styles.input}
              />

              {mode === "signup" && (
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry
                  disabled={loading}
                  style={styles.input}
                />
              )}

              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleEmailAuth}
                loading={loading}
                disabled={loading}
                style={styles.primaryButton}
                testID={
                  mode === "signin" ? "sign-in-button" : "create-account-button"
                }
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>

              <Button
                mode="outlined"
                onPress={switchMode}
                disabled={loading}
                style={styles.secondaryButton}
                testID="switch-mode-button"
              >
                {mode === "signin"
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>

              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <Divider style={styles.divider} />
              </View>

              <Button
                mode="outlined"
                onPress={handleAnonymousAuth}
                loading={loading}
                disabled={loading}
                style={styles.anonymousButton}
                testID="continue-as-guest"
                // @ts-ignore - Web compatibility for Maestro tests
                id="continue-as-guest"
              >
                Continue as Guest
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>

      <Snackbar visible={!!error} onDismiss={clearError} duration={5000}>
        {error?.message || "An error occurred"}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    marginHorizontal: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  form: {
    gap: 8,
  },
  input: {
    marginBottom: 4,
  },
  primaryButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  secondaryButton: {
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 12,
  },
  anonymousButton: {
    marginTop: 8,
  },
});
