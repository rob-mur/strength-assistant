import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { NotoSans_400Regular } from "@expo-google-fonts/noto-sans";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { Logger } from "@/lib/data/supabase/supabase/logger";
import { initializeDataLayer } from "@/lib/data/sync";

export const useAppInit = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const logger = useMemo(() => new Logger("AppInit"), []);

  // Enhanced debugging for Chrome tests
  console.log("🔄 useAppInit: Hook initialized");
  
  const [fontsLoaded, fontError] = useFonts({
    NotoSans_400Regular,
    JetBrainsMono_400Regular,
    ...MaterialCommunityIcons.font,
  });
  
  console.log("🔄 useAppInit: Fonts state -", { fontsLoaded, fontError: !!fontError });

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
  }, [fontError, logger]);

  useEffect(() => {
    const prepare = async () => {
      const startTime = Date.now();
      console.log("🚀 useAppInit: Starting app initialization");

      logger.info("Starting app initialization", {
        service: "App Init",
        platform: "React Native",
        operation: "init",
      });

      try {
        console.log("🔄 useAppInit: Initializing data layer...");
        logger.info("Initializing offline-first data layer...", {
          service: "App Init",
          platform: "React Native",
          operation: "data_layer_init",
        });

        await initializeDataLayer();
        console.log("✅ useAppInit: Data layer initialized successfully");

        logger.info("Offline-first data layer initialized successfully", {
          service: "App Init",
          platform: "React Native",
          operation: "data_layer_init",
          duration: Date.now() - startTime,
        });
      } catch (error: unknown) {
        const errorMessage = (error as Error).message;

        logger.error("App initialization error", {
          service: "App Init",
          platform: "React Native",
          operation: "init",
          duration: Date.now() - startTime,
          error: {
            message: errorMessage,
            stack: (error as Error).stack,
          },
        });

        // IMPROVED ERROR VISIBILITY: Show critical startup errors prominently
        console.error("🚨 CRITICAL STARTUP ERROR:", errorMessage);
        console.error("🔧 This may prevent the app from working correctly");

        // In Chrome/test environments, show error in DOM for easier debugging
        if (typeof window !== "undefined") {
          console.error(
            "🧪 CHROME TEST ENVIRONMENT - Startup error detected:",
            errorMessage,
          );

          // Create visible error indicator for integration tests
          const errorDiv = document.createElement("div");
          errorDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
            background: #ff4444; color: white; padding: 10px;
            font-family: monospace; font-size: 14px;
          `;
          errorDiv.innerHTML = `🚨 STARTUP ERROR: ${errorMessage}`;
          document.body?.appendChild(errorDiv);

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
        console.log("🏁 useAppInit: Setting app ready to true");
        setIsAppReady(true);
        logger.info("App initialization complete", {
          service: "App Init",
          platform: "React Native",
          operation: "init",
          duration: Date.now() - startTime,
        });
        console.log("✅ useAppInit: App initialization complete");
      }
    };

    prepare();
  }, [logger]);

  useEffect(() => {
    console.log("🔄 useAppInit: Checking readiness -", { fontsLoaded, isAppReady });
    if (fontsLoaded && isAppReady) {
      console.log("✅ useAppInit: App fully ready, hiding splash screen");
      logger.info("Fonts loaded and app ready, hiding splash screen", {
        service: "App Init",
        platform: "React Native",
        operation: "splash_screen",
      });
      SplashScreen.hideAsync();
    } else {
      console.log("⏳ useAppInit: Not ready yet -", { 
        fontsLoaded, 
        isAppReady, 
        willReturn: fontsLoaded && isAppReady 
      });
    }
  }, [fontsLoaded, isAppReady, logger]);

  const returnValue = fontsLoaded && isAppReady;
  console.log("🔄 useAppInit: Returning", returnValue);
  return returnValue;
};
