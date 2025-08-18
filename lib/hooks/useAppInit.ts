import {
	JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import { NotoSans_400Regular } from "@expo-google-fonts/noto-sans";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect, useState } from "react";

import { initFirebase } from "@/lib/data/firebase";

export const useAppInit = () => {
	const [isAppReady, setAppReady] = useState(false);

	const [fontsLoaded, fontError] = useFonts({
		NotoSans_400Regular,
		JetBrainsMono_400Regular,
		...MaterialCommunityIcons.font,
	});

	useEffect(() => {
		// Throw any font loading errors
		if (fontError) {
			console.error("[useAppInit] Font loading error:", fontError);
			throw fontError;
		}
	}, [fontError]);

	useEffect(() => {
		const prepare = async () => {
			const startTime = Date.now();
			console.log("[useAppInit] Starting app initialization");
			
			try {
				console.log("[useAppInit] Initializing Firebase...");
				initFirebase();
				const duration = Date.now() - startTime;
				console.log(`[useAppInit] Firebase initialization completed successfully (${duration}ms)`);
			} catch (e) {
				const duration = Date.now() - startTime;
				console.error(`[useAppInit] App initialization error after ${duration}ms:`, e);
				console.error("[useAppInit] App will continue with limited functionality");
			} finally {
				setAppReady(true);
				const totalDuration = Date.now() - startTime;
				console.log(`[useAppInit] App initialization complete (${totalDuration}ms total)`);
			}
		};

		prepare();
	}, []);

	useEffect(() => {
		if (fontsLoaded && isAppReady) {
			console.log("[useAppInit] Fonts loaded and app ready, hiding splash screen");
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, isAppReady]);

	return fontsLoaded && isAppReady;
};
