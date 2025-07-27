import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Router, useRouter } from "expo-router";
import { Button } from "react-native";
interface HomeScreenProps {
  onUserReadyToStart: (r: Router) => void;
}

export default function HomeScreen({
  onUserReadyToStart = (r: Router) => r.navigate("/exercises"),
}: HomeScreenProps) {
  return (
    <GettingStartedCard
      content="Select an exercise to get started"
      call_to_action="Start"
      on_get_started={onUserReadyToStart}
    />
  );
}
