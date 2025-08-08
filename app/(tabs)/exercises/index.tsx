import { useRouter } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import { FAB } from "react-native-paper";

export default function ExerciseScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FAB
        style={{ position: "absolute", margin: 16, right: 0, bottom: 0 }}
        icon="plus"
        testID="add-exercise"
        onPress={(_) => router.navigate("/exercises/add")}
      />
    </View>
  );
}
