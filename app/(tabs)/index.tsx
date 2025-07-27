import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Locales } from "@/lib/locales";
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
      content={Locales.t("getStartedMessage")}
      call_to_action={Locales.t("getStartedCallToAction")}
      on_get_started={onUserReadyToStart}
    />
  );
}
