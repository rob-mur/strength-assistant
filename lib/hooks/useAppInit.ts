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
		if (fontError) throw fontError;
	}, [fontError]);

	useEffect(() => {
		const prepare = async () => {
			try {
				initFirebase();
			} catch (e) {
				console.error("App initialization error:", e);
			} finally {
				setAppReady(true);
			}
		};

		prepare();
	}, []);

	useEffect(() => {
		if (fontsLoaded && isAppReady) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, isAppReady]);

	return fontsLoaded && isAppReady;
};
