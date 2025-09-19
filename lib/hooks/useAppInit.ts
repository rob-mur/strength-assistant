import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { NotoSans_400Regular } from "@expo-google-fonts/noto-sans";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect, useState } from "react";

import { Logger } from "@/lib/data/supabase/supabase/logger";
import { initializeDataLayer } from "@/lib/data/sync";

export const useAppInit = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const logger = new Logger("AppInit");

  const [fontsLoaded, fontError] = useFonts({
    NotoSans_400Regular,
    JetBrainsMono_400Regular,
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    if (fontError) {
      logger.error("Font loading error", {
        service: "App Init",
        platform: "React Native",
        operation: "font_loading",
        error: {
          message: fontError.message,
          stack: fontError.stack,
        },
      });
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    const prepare = async () => {
      const startTime = Date.now();

      logger.info("Starting app initialization", {
        service: "App Init",
        platform: "React Native",
        operation: "init",
      });

      try {
        logger.info("Initializing offline-first data layer...", {
          service: "App Init",
          platform: "React Native",
          operation: "data_layer_init",
        });

        await initializeDataLayer();

        logger.info("Offline-first data layer initialized successfully", {
          service: "App Init",
          platform: "React Native",
          operation: "data_layer_init",
          duration: Date.now() - startTime,
        });
      } catch (error: unknown) {
        logger.error("App initialization error", {
          service: "App Init",
          platform: "React Native",
          operation: "init",
          duration: Date.now() - startTime,
          error: {
            message: (error as Error).message,
            stack: (error as Error).stack,
          },
        });

        // In web/Chrome testing environments, continue with degraded functionality
        if (typeof window !== "undefined") {
          logger.warn(
            "Web environment detected, continuing with degraded functionality for testing",
            {
              service: "App Init",
              platform: "React Native",
              operation: "init",
            },
          );
        } else {
          logger.warn("App will continue with limited functionality", {
            service: "App Init",
            platform: "React Native",
            operation: "init",
          });
        }
      } finally {
        setIsAppReady(true);
        logger.info("App initialization complete", {
          service: "App Init",
          platform: "React Native",
          operation: "init",
          duration: Date.now() - startTime,
        });
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isAppReady) {
      logger.info("Fonts loaded and app ready, hiding splash screen", {
        service: "App Init",
        platform: "React Native",
        operation: "splash_screen",
      });
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAppReady]);

  return fontsLoaded && isAppReady;
};
