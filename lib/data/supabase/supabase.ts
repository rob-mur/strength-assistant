import { Platform } from "react-native";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../models/supabase";

interface SupabaseInitializer {
	initSupabase(): void;
	getSupabaseClient(): SupabaseClient<Database>;
}

const getSupabaseModule = (): SupabaseInitializer => {
	if (Platform.OS === "web") {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("./supabase/supabase.web");
	} else {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("./supabase/supabase.native");
	}
};

export const initSupabase = () => getSupabaseModule().initSupabase();
export const getSupabaseClient = () => getSupabaseModule().getSupabaseClient();