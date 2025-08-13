import React from "react";
import { Card, List, Surface } from "react-native-paper";
import { Exercise } from "../../lib/models/Exercise";
import { View, StyleSheet } from "react-native";

interface ExerciseListProps {
  exercises: Exercise[];
}

const ExerciseList: React.FC<ExerciseListProps> = ({ exercises }) => {
  return (
    <View style={styles.container}>
      <List.Section>
        {exercises.map((exercise) => (
          <Surface
            testID={exercise.name}
            key={exercise.id}
            style={{ padding: 8 }}
            elevation={0}
          >
            <Card>
              <List.Item title={exercise.name} />
            </Card>
          </Surface>
        ))}
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});

export default ExerciseList;
