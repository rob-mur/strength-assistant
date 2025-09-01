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
import { initSupabase } from "@/lib/data/supabase";

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
				logger.info("Starting service initialization...", {
					service: "App Init",
					platform: "React Native",
					operation: "services_init"
				});

				logger.info("Initializing Firebase...", {
					service: "App Init",
					platform: "React Native",
					operation: "firebase_init"
				});

				try {
					initFirebase();
					logger.info("Firebase initialization completed successfully", {
						service: "App Init",
						platform: "React Native",
						operation: "firebase_init"
					});
				} catch (firebaseError: any) {
					logger.error("Firebase initialization failed", {
						service: "App Init",
						platform: "React Native", 
						operation: "firebase_init",
						error: {
							message: firebaseError.message,
							stack: firebaseError.stack
						}
					});
					logger.warn("Continuing without Firebase", {
						service: "App Init",
						platform: "React Native",
						operation: "firebase_init"
					});
				}

				logger.info("Initializing Supabase...", {
					service: "App Init",
					platform: "React Native",
					operation: "supabase_init"
				});

				try {
					logger.debug("SUPABASE DEBUG: About to call initSupabase", {
					service: "App Init",
					platform: "React Native",
					operation: "supabase_init"
				});
					initSupabase();
					logger.debug("SUPABASE DEBUG: Supabase initialization completed successfully", {
					service: "App Init",
					platform: "React Native",
					operation: "supabase_init"
				});
					logger.info("Supabase initialization completed successfully", {
						service: "App Init",
						platform: "React Native",
						operation: "supabase_init"
					});
				} catch (supabaseError: any) {
					logger.debug("SUPABASE DEBUG: An error occurred - not attempting to inspect it", {
						service: "App Init",
						platform: "React Native",
						operation: "supabase_init"
					});
					// Don't try to access the error object at all since it's toxic
					logger.error("Supabase initialization failed", {
						service: "App Init",
						platform: "React Native",
						operation: "supabase_init",
						error: {
							message: supabaseError.message,
							stack: supabaseError.stack
						}
					});
					logger.warn("Continuing without Supabase", {
						service: "App Init",
						platform: "React Native",
						operation: "supabase_init"
					});
				}

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
