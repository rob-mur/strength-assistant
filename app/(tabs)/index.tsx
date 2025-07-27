import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Router } from "expo-router";
import { Surface } from "react-native-paper";
interface HomeScreenProps {
  onUserReadyToStart: (r: Router) => void;
}

export default function HomeScreen({
  onUserReadyToStart = (r: Router) => r.navigate("/exercises"),
}: HomeScreenProps) {
  return (
    <GettingStartedCard
      style={{ padding: 16 }}
      content="Select an exercise to get started"
      call_to_action="Start"
      on_get_started={onUserReadyToStart}
    />
  );
}
