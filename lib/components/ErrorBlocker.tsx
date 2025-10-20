/**
 * ErrorBlocker React Component
 * 
 * React Native component that wraps the entire app and blocks interaction when uncaught errors occur.
 * Provides testID attributes for Maestro integration test detection.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBlockerComponent } from '../../specs/012-production-bug-android/contracts/simple-error-blocking';
import { MAESTRO_TEST_IDS } from '../models/MaestroErrorIndicator';
import { getGlobalErrorState } from '../utils/logging/SimpleErrorLogger';

interface ErrorBlockerProps {
  children: ReactNode;
}

/**
 * ErrorBlocker component implementation
 */
const ErrorBlockerImpl: React.FC<ErrorBlockerProps> = ({ children }) => {
  const [errorState, setErrorState] = useState(() => getGlobalErrorState());

  useEffect(() => {
    // Listen for uncaught error events
    const handleUncaughtError = (event: any) => {
      if (event.detail) {
        setErrorState(event.detail);
      }
    };

    // Add event listener for uncaught errors
    if (typeof window !== 'undefined') {
      window.addEventListener('uncaughtError', handleUncaughtError);
      
      return () => {
        window.removeEventListener('uncaughtError', handleUncaughtError);
      };
    }

    // React Native doesn't have window, so we'll poll for changes
    const interval = setInterval(() => {
      const currentState = getGlobalErrorState();
      if (currentState.hasError !== errorState.hasError || 
          currentState.errorCount !== errorState.errorCount) {
        setErrorState(currentState);
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [errorState.hasError, errorState.errorCount]);

  // If no error, render children normally
  if (!errorState.hasError) {
    return <>{children}</>;
  }

  // If error occurred, show blocking overlay
  return (
    <View style={styles.container}>
      {/* Render children in background (blocked) */}
      <View style={styles.backgroundContent}>
        {children}
      </View>
      
      {/* Error blocking overlay */}
      <View style={styles.errorOverlay} testID={MAESTRO_TEST_IDS.ERROR_BLOCKER}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Application Error</Text>
          
          <Text style={styles.errorCount} testID={MAESTRO_TEST_IDS.ERROR_COUNT}>
            {errorState.errorCount}
          </Text>
          
          <Text style={styles.errorMessage} testID={MAESTRO_TEST_IDS.ERROR_MESSAGE}>
            {errorState.lastError}
          </Text>
          
          <Text style={styles.errorInstructions}>
            The application has encountered an error and needs to be restarted.
          </Text>
          
          <Text style={styles.errorTimestamp}>
            Last error: {errorState.lastErrorTimestamp ? new Date(errorState.lastErrorTimestamp).toLocaleString() : 'Unknown'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundContent: {
    flex: 1,
    opacity: 0.3, // Dim the background content
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.9)', // Semi-transparent red
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999, // Ensure it's on top
  },
  errorContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxWidth: '90%',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorTimestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

/**
 * Typed ErrorBlocker component that implements ErrorBlockerComponent interface
 */
export const ErrorBlocker = ErrorBlockerImpl as ErrorBlockerComponent;