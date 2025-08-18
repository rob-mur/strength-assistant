import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Button,
  Text,
  TextInput,
  Card,
  Title,
  Paragraph,
  Snackbar,
  Surface,
} from "react-native-paper";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    loading,
    error,
    signInWithEmail,
    createAccount,
    signInAnonymously: signInAnon,
    clearError,
  } = useAuth();

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      if (isSignUp) {
        await createAccount(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnon();
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Surface style={styles.surface}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>
                {isSignUp ? "Create Account" : "Sign In"}
              </Title>
              
              <Paragraph style={styles.subtitle}>
                {isSignUp 
                  ? "Create an account to save your workouts" 
                  : "Welcome back to Strength Assistant"
                }
              </Paragraph>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                disabled={loading}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleEmailAuth}
                style={styles.button}
                loading={loading}
                disabled={loading || !email.trim() || !password.trim()}
              >
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setIsSignUp(!isSignUp)}
                style={styles.switchButton}
                disabled={loading}
              >
                {isSignUp 
                  ? "Already have an account? Sign In" 
                  : "Need an account? Sign Up"
                }
              </Button>

              <View style={styles.divider}>
                <Text variant="bodyMedium" style={styles.dividerText}>
                  or
                </Text>
              </View>

              <Button
                mode="outlined"
                onPress={handleAnonymousSignIn}
                style={styles.anonymousButton}
                loading={loading}
                disabled={loading}
                icon="incognito"
              >
                Continue as Guest
              </Button>
            </Card.Content>
          </Card>
        </View>

        <Snackbar
          visible={!!error}
          onDismiss={clearError}
          duration={6000}
          action={{
            label: "Dismiss",
            onPress: clearError,
          }}
        >
          {error}
        </Snackbar>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  surface: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
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
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  switchButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerText: {
    flex: 1,
    textAlign: "center",
    opacity: 0.7,
  },
  anonymousButton: {
    marginTop: 8,
  },
});