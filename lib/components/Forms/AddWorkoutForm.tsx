import { useRouter } from "expo-router";
import React from "react";
import { 
  Button, 
  Card, 
  TextInput, 
  RadioButton,
  Text,
  Menu,
  Divider
} from "react-native-paper";
import { View, Slider } from "react-native";
import { Locales } from "@/lib/locales";
import { useExercises } from "@/lib/hooks/useExercises";

export default function AddWorkoutForm() {
  const [selectedExercise, setSelectedExercise] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = React.useState("");
  const [reps, setReps] = React.useState("");
  const [rpe, setRpe] = React.useState(8);
  const [unit, setUnit] = React.useState<'kg' | 'lbs'>('kg');
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const router = useRouter();
  const { exercises } = useExercises();

  const handleSubmit = () => {
    // TODO: Add workout submission logic
    console.log({
      exercise: selectedExercise,
      date,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      rpe,
      unit
    });
    router.back();
  };


  return (
    <Card>
      <Card.Title title={Locales.t("addWorkoutTitle")} />
      <Card.Content>
        <View style={{ marginBottom: 16 }}>
          <TextInput
            label={Locales.t("date")}
            value={date}
            onChangeText={setDate}
            placeholder="2025-08-14"
            style={{ marginBottom: 16 }}
          />
          
          <Menu
            visible={showDropdown}
            onDismiss={() => setShowDropdown(false)}
            anchor={
              <TextInput
                label={Locales.t("exercise")}
                value={selectedExercise}
                onFocus={() => setShowDropdown(true)}
                placeholder="Select exercise"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" onPress={() => setShowDropdown(true)} />}
                style={{ marginBottom: 16 }}
              />
            }>
            {exercises.map((exercise) => (
              <Menu.Item
                key={exercise.id || exercise.name}
                onPress={() => {
                  setSelectedExercise(exercise.name);
                  setShowDropdown(false);
                }}
                title={exercise.name}
              />
            ))}
          </Menu>

          <TextInput
            label={Locales.t("weight")}
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            keyboardType="numeric"
            style={{ marginBottom: 16 }}
          />

          <TextInput
            label={Locales.t("reps")}
            value={reps}
            onChangeText={setReps}
            placeholder="0"
            keyboardType="numeric"
            style={{ marginBottom: 16 }}
          />

          <View style={{ marginBottom: 16 }}>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              {Locales.t("effortLevel")}: {rpe.toFixed(1)}
            </Text>
            <Slider
              value={rpe}
              onValueChange={setRpe}
              minimumValue={6.5}
              maximumValue={10}
              step={0.5}
              thumbColor="#6200ee"
              minimumTrackTintColor="#6200ee"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodySmall">6.5</Text>
              <Text variant="bodySmall">7</Text>
              <Text variant="bodySmall">7.5</Text>
              <Text variant="bodySmall">8</Text>
              <Text variant="bodySmall">8.5</Text>
              <Text variant="bodySmall">9</Text>
              <Text variant="bodySmall">9.5</Text>
              <Text variant="bodySmall">10</Text>
            </View>
          </View>

          <RadioButton.Group onValueChange={value => setUnit(value as 'kg' | 'lbs')} value={unit}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <RadioButton.Item label={Locales.t("kg")} value="kg" />
              <RadioButton.Item label={Locales.t("lbs")} value="lbs" />
            </View>
          </RadioButton.Group>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!selectedExercise || !weight || !reps}
        >
          {Locales.t("submit")}
        </Button>
      </Card.Actions>
    </Card>
  );
}