import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Locales } from "@/lib/locales";
import { useRouter } from "expo-router";
import * as React from "react";

export default function HomeScreen() {
  const router = useRouter();
  
  // Debug logging for Chrome tests
  React.useEffect(() => {
    if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
      console.log("🔍 HomeScreen: Component rendered");
    }
  }, []);
  
  return (
    <GettingStartedCard
      style={{ padding: 16 }}
      content={Locales.t("getStartedMessage")}
      call_to_action={Locales.t("getStartedCallToAction")}
      on_get_started={() => {
        // Debug logging for Chrome tests
        if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
          console.log("🔍 HomeScreen: Navigating to exercises screen");
        }
        router.navigate("./exercises");
      }}
    />
  );
}
