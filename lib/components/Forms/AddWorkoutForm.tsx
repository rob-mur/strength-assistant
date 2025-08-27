import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import {
  Button,
  Card,
  TextInput,
  Text,
  RadioButton,
  Menu,
  Divider,
} from "react-native-paper";
import Slider from "@react-native-community/slider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/lib/hooks/useAuth";
import { useExercises } from "@/lib/hooks/useExercises";
import { Locales } from "@/lib/locales";
import { Workout } from "@/lib/models/Workout";

export default function AddWorkoutForm() {
  const [date, setDate] = React.useState(new Date());
  const [selectedExercise, setSelectedExercise] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [reps, setReps] = React.useState("");
  const [rpe, setRpe] = React.useState(8);
  const [unit, setUnit] = React.useState<"kg" | "lbs">("kg");
  const [isLoading, setIsLoading] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const exercises = useExercises(user?.uid || "");

  const isFormValid = selectedExercise && weight && reps;

  const handleSubmit = async () => {
    if (!isFormValid || !user?.uid) return;

    setIsLoading(true);
    try {
      const workout: Workout = {
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        exercise: selectedExercise,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        rpe: rpe,
        unit: unit,
      };
      
      // TODO: Implement workout saving logic when workout repository is available
      console.log("Workout to save:", workout);
      
      router.back();
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <Card.Title title={Locales.t("addWorkoutTitle")} />
      <Card.Content>
        <View style={{ gap: 16 }}>
          {/* Date Picker */}
          <View>
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              {Locales.t("date")}
            </Text>
            <DateTimePicker
              testID="date-picker"
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          </View>

          {/* Exercise Dropdown */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                testID="exercise-dropdown"
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                contentStyle={{ justifyContent: "flex-start" }}
              >
                {selectedExercise || Locales.t("exercise")}
              </Button>
            }
          >
            {exercises.map((exercise) => (
              <Menu.Item
                key={exercise.id}
                onPress={() => {
                  setSelectedExercise(exercise.name);
                  setMenuVisible(false);
                }}
                title={exercise.name}
              />
            ))}
          </Menu>

          {/* Weight Input */}
          <TextInput
            testID="weight-input"
            label={Locales.t("weight")}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            mode="outlined"
          />

          {/* Reps Input */}
          <TextInput
            testID="reps-input"
            label={Locales.t("reps")}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            mode="outlined"
          />

          {/* RPE Slider */}
          <View>
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              {Locales.t("effortLevel")}: {rpe}
            </Text>
            <Slider
              testID="rpe-slider"
              style={{ width: "100%", height: 40 }}
              minimumValue={6.5}
              maximumValue={10}
              step={0.5}
              value={rpe}
              onValueChange={setRpe}
              minimumTrackTintColor="#6750A4"
              maximumTrackTintColor="#E7E0EC"
              thumbStyle={{ backgroundColor: "#6750A4" }}
            />
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              marginTop: 4 
            }}>
              <Text variant="bodySmall">6.5</Text>
              <Text variant="bodySmall">10</Text>
            </View>
          </View>

          {/* Unit Selection */}
          <View>
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              {Locales.t("units")}
            </Text>
            <RadioButton.Group
              onValueChange={(value) => setUnit(value as "kg" | "lbs")}
              value={unit}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginRight: 24 }}>
                  <RadioButton testID="unit-kg" value="kg" />
                  <Text>{Locales.t("kg")}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <RadioButton testID="unit-lbs" value="lbs" />
                  <Text>{Locales.t("lbs")}</Text>
                </View>
              </View>
            </RadioButton.Group>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          testID="submit-workout"
          mode="contained"
          loading={isLoading}
          disabled={!isFormValid || isLoading}
          onPress={handleSubmit}
        >
          {isLoading ? Locales.t("submitting") : Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}