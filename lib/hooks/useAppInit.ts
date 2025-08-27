import {
	JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import { NotoSans_400Regular } from "@expo-google-fonts/noto-sans";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect, useState } from "react";

import { initFirebase } from "@/lib/data/firebase";
import { logger } from "@/lib/data/firebase/logger";

export const useAppInit = () => {
	const [isAppReady, setAppReady] = useState(false);

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
					stack: fontError.stack
				}
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
				operation: "init"
			});

			try {
				logger.info("Initializing Firebase...", {
					service: "App Init",
					platform: "React Native",
					operation: "firebase_init"
				});

				initFirebase();

				logger.info("Firebase initialization completed successfully", {
					service: "App Init",
					platform: "React Native",
					operation: "firebase_init",
					duration: Date.now() - startTime
				});
			} catch (error: any) {
				logger.error("App initialization error", {
					service: "App Init",
					platform: "React Native",
					operation: "init",
					duration: Date.now() - startTime,
					error: {
						message: error.message,
						stack: error.stack
					}
				});
				logger.warn("App will continue with limited functionality", {
					service: "App Init",
					platform: "React Native",
					operation: "init"
				});
			} finally {
				setAppReady(true);
				logger.info("App initialization complete", {
					service: "App Init",
					platform: "React Native",
					operation: "init",
					duration: Date.now() - startTime
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
				operation: "splash_screen"
			});
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, isAppReady]);

	return fontsLoaded && isAppReady;
};
