import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Card, Text, Button, useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { EmptyWorkoutStateProps } from "../types/EmptyWorkoutState";

const EmptyWorkoutState: React.FC<EmptyWorkoutStateProps> = React.memo(
  ({
    onSelectExercise,
    onCreateExercise,
    style,
    testID = "empty-workout-state",
  }) => {
    const { width } = useWindowDimensions();
    const theme = useTheme();
    const isTablet = width >= 768;

    return (
      <View style={[styles.container, style]} testID={testID}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            {/* Icon - responsive size */}
            <MaterialIcons
              name="fitness-center"
              size={isTablet ? 64 : 48}
              color={theme.colors.primary}
              style={styles.icon}
            />

            {/* Primary message */}
            <Text
              variant="headlineSmall"
              style={styles.headline}
              accessibilityRole="header"
              accessible={true}
            >
              Ready to start your workout?
            </Text>

            {/* Supporting text */}
            <Text
              variant="bodyLarge"
              style={styles.body}
              accessible={true}
              accessibilityLabel="Select an exercise to begin tracking your workout, or create a new exercise routine"
            >
              Select an exercise to begin tracking your workout, or create a new
              exercise routine.
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={onSelectExercise}
                style={styles.primaryButton}
                testID="select-exercise-button"
                accessible={true}
                accessibilityLabel="Browse existing exercises"
                accessibilityHint="Navigate to exercises screen to select an exercise"
              >
                Browse Exercises
              </Button>
              <Button
                mode="outlined"
                onPress={onCreateExercise}
                style={styles.secondaryButton}
                testID="create-exercise-button"
                accessible={true}
                accessibilityLabel="Create new exercise"
                accessibilityHint="Navigate to add exercise screen to create a new exercise"
              >
                Create New Exercise
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    maxWidth: 400, // Prevent overstretching on tablets
    width: "100%",
  },
  content: {
    alignItems: "center",
    paddingVertical: 32,
  },
  icon: {
    marginBottom: 16,
  },
  headline: {
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    // Add margin for proper spacing
    marginTop: 4,
  },
});

EmptyWorkoutState.displayName = "EmptyWorkoutState";

export default EmptyWorkoutState;
