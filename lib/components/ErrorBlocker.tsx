/**
 * ErrorBlocker React Component
 *
 * React Native component that wraps the entire app and blocks interaction when uncaught errors occur.
 * Provides testID attributes for Maestro integration test detection.
 */

import React, { ReactNode, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MAESTRO_TEST_IDS } from "../models/MaestroErrorIndicator";
import { getGlobalErrorState } from "../utils/logging/SimpleErrorLogger";

interface ErrorBlockerProps {
  children: ReactNode;
}

/**
 * ErrorBlocker component implementation
 */
const ErrorBlockerImpl: React.FC<ErrorBlockerProps> = ({ children }) => {
  // Initialize with safe default state
  const defaultErrorState = {
    hasUncaughtError: false,
    errorCount: 0,
    lastError: "",
    lastErrorTimestamp: "",
    isBlocking: false,
  };

  const [errorState, setErrorState] = useState(defaultErrorState);

  // Add error boundary protection to prevent recursion if ErrorBlocker itself fails
  const [hasInternalError] = useState(false);

  // Get initial error state after mount
  useEffect(() => {
    try {
      const initialState = getGlobalErrorState();
      setErrorState(initialState);
    } catch (error) {
      console.error(
        "ErrorBlocker: Failed to get initial error state on mount",
        error,
      );
    }
  }, []);

  // Use useCallback to memoize the comparison function
  const pollErrorState = useCallback(() => {
    try {
      const currentState = getGlobalErrorState();
      // Only update if there's actually a change to avoid unnecessary re-renders
      if (
        currentState.hasUncaughtError !== errorState.hasUncaughtError ||
        currentState.errorCount !== errorState.errorCount ||
        currentState.lastError !== errorState.lastError
      ) {
        setErrorState(currentState);
      }
    } catch (error) {
      console.error("ErrorBlocker: Failed to poll error state", error);
    }
  }, [
    errorState.hasUncaughtError,
    errorState.errorCount,
    errorState.lastError,
  ]);

  useEffect(() => {
    // Start polling every 500ms (less frequent to reduce overhead)
    const interval = setInterval(pollErrorState, 500);

    return () => {
      clearInterval(interval);
    };
  }, [pollErrorState]);

  // If ErrorBlocker itself has an internal error, render children safely without blocking
  if (hasInternalError) {
    console.error(
      "ErrorBlocker: Internal error detected, rendering children without error blocking",
    );
    return <>{children}</>;
  }

  try {
    // If no error, render children normally
    if (!errorState.hasUncaughtError) {
      return <>{children}</>;
    }

    // If error occurred, show blocking overlay
    return (
      <View style={styles.container}>
        {/* Render children in background (blocked) */}
        <View style={styles.backgroundContent}>{children}</View>

        {/* Error blocking overlay */}
        <View
          style={styles.errorOverlay}
          testID={MAESTRO_TEST_IDS.ERROR_BLOCKER}
        >
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Application Error</Text>

            <Text
              style={styles.errorCount}
              testID={MAESTRO_TEST_IDS.ERROR_COUNT}
            >
              {errorState.errorCount}
            </Text>

            <Text
              style={styles.errorMessage}
              testID={MAESTRO_TEST_IDS.ERROR_MESSAGE}
            >
              {errorState.lastError}
            </Text>

            <Text style={styles.errorInstructions}>
              The application has encountered an error and needs to be
              restarted.
            </Text>

            <Text style={styles.errorTimestamp}>
              Last error:{" "}
              {errorState.lastErrorTimestamp
                ? new Date(errorState.lastErrorTimestamp).toLocaleString()
                : "Unknown"}
            </Text>
          </View>
        </View>
      </View>
    );
  } catch (internalError) {
    // Prevent recursion - if ErrorBlocker itself fails, log error and render children safely
    console.error(
      "ErrorBlocker: Internal error in render, falling back to children only:",
      internalError,
    );
    // Return children directly without state update to avoid infinite loops
    return <>{children}</>;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  backgroundContent: {
    flex: 1,
    opacity: 0.3, // Dim the background content
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 0, 0, 0.9)", // Semi-transparent red
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999999, // Ensure it's on top
  },
  errorContent: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxWidth: "90%",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 10,
    textAlign: "center",
  },
  errorCount: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "monospace",
  },
  errorInstructions: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  errorTimestamp: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});

/**
 * Export ErrorBlocker component directly without type casting to avoid runtime errors
 */
export const ErrorBlocker = ErrorBlockerImpl;
