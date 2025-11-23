import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { 
  Modal, 
  Portal, 
  Title, 
  List, 
  Divider,
  Button,
  IconButton,
  useTheme
} from 'react-native-paper';
import type { Exercise } from '../../models/Exercise';
import type { DayPlan } from '../../models/ExerciseSchedule';

interface DayAssignmentModalProps {
  visible: boolean;
  selectedDay: number | null;
  dayPlan: DayPlan | null;
  availableExercises: Exercise[];
  onClose: () => void;
  onAssignExercise: (exerciseId: string) => void;
  onRemoveExercise: (scheduleId: string) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DayAssignmentModal: React.FC<DayAssignmentModalProps> = ({
  visible,
  selectedDay,
  dayPlan,
  availableExercises,
  onClose,
  onAssignExercise,
  onRemoveExercise,
}) => {
  const theme = useTheme();

  if (selectedDay === null || !dayPlan) return null;

  const dayName = DAY_NAMES[selectedDay];
  const assignedExerciseIds = new Set(dayPlan.exercises.map(e => e.exerciseId));
  const unassignedExercises = availableExercises.filter(
    exercise => !assignedExerciseIds.has(exercise.id)
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface }
        ]}
        testID="day-assignment-modal"
      >
        <Title style={{ color: theme.colors.onSurface }}>{dayName} Exercises</Title>
        
        <ScrollView style={styles.scrollView}>
          {/* Currently assigned exercises */}
          {dayPlan.exercises.length > 0 && (
            <>
              <List.Subheader style={{ color: theme.colors.onSurface }}>
                Assigned Exercises
              </List.Subheader>
              {dayPlan.exercises.map((exercise, index) => (
                <List.Item
                  key={exercise.scheduleId}
                  title={exercise.exerciseName}
                  titleStyle={{ color: theme.colors.onSurface }}
                  description={`Order: ${index + 1}`}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                  right={(props) => (
                    <IconButton
                      {...props} 
                      icon="delete" 
                      iconColor={theme.colors.error}
                      onPress={() => onRemoveExercise(exercise.scheduleId)}
                    />
                  )}
                  testID={`assigned-exercise-${exercise.scheduleId}`}
                />
              ))}
              <Divider style={{ backgroundColor: theme.colors.outline }} />
            </>
          )}

          {/* Available exercises to assign */}
          {unassignedExercises.length > 0 && (
            <>
              <List.Subheader style={{ color: theme.colors.onSurface }}>
                Available Exercises
              </List.Subheader>
              {unassignedExercises.map((exercise) => (
                <List.Item
                  key={exercise.id}
                  title={exercise.name}
                  titleStyle={{ color: theme.colors.onSurface }}
                  right={(props) => (
                    <IconButton
                      {...props} 
                      icon="plus" 
                      iconColor={theme.colors.primary}
                      onPress={() => onAssignExercise(exercise.id)}
                    />
                  )}
                  testID={`available-exercise-${exercise.id}`}
                />
              ))}
            </>
          )}

          {/* Empty state when no exercises available */}
          {availableExercises.length === 0 && (
            <List.Item
              title="No exercises available"
              titleStyle={{ color: theme.colors.onSurface }}
              description="Create new exercises to add to this day"
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              left={(props) => (
                <List.Icon {...props} icon="information" color={theme.colors.primary} />
              )}
              testID="no-exercises-message"
            />
          )}

          {/* All exercises assigned state */}
          {availableExercises.length > 0 && unassignedExercises.length === 0 && dayPlan.exercises.length > 0 && (
            <List.Item
              title="All exercises assigned"
              titleStyle={{ color: theme.colors.onSurface }}
              description="Create new exercises to add more to this day"
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              left={(props) => (
                <List.Icon {...props} icon="check-circle" color={theme.colors.primary} />
              )}
              testID="all-assigned-message"
            />
          )}
        </ScrollView>

        <Button 
          mode="outlined" 
          onPress={onClose} 
          style={styles.closeButton}
          textColor={theme.colors.primary}
          testID="close-modal-button"
        >
          Done
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scrollView: {
    marginVertical: 16,
    flexGrow: 0,
  },
  closeButton: {
    marginTop: 16,
  },
});