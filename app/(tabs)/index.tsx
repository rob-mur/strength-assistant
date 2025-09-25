import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Locales } from "@/lib/locales";
import { useRouter } from "expo-router";
import * as React from "react";

export default function HomeScreen() {
  const router = useRouter();

  // Debug logging for Chrome tests
  React.useEffect(() => {
    const isChromeTest = process.env.CHROME_TEST === "true" || process.env.EXPO_PUBLIC_CHROME_TEST === "true";
    const isCITest = process.env.CI === "true" && process.env.CI !== "false" && process.env.CHROME_TEST !== "true" && process.env.EXPO_PUBLIC_CHROME_TEST !== "true";
    if (isChromeTest || isCITest) {
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
        const isChromeTest = process.env.CHROME_TEST === "true" || process.env.EXPO_PUBLIC_CHROME_TEST === "true";
        const isCITest = process.env.CI === "true" && process.env.CI !== "false" && process.env.CHROME_TEST !== "true" && process.env.EXPO_PUBLIC_CHROME_TEST !== "true";
        if (isChromeTest || isCITest) {
          console.log("🔍 HomeScreen: Navigating to exercises screen");
        }
        router.navigate("./exercises");
      }}
    />
  );
}
