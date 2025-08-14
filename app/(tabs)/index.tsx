import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Locales } from "@/lib/locales";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <GettingStartedCard
      style={{ padding: 16 }}
      content={Locales.t("getStartedMessage")}
      call_to_action={Locales.t("getStartedCallToAction")}
      on_get_started={() => router.navigate("./exercises")}
    />
  );
}
