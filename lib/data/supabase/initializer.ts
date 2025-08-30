import { Platform } from "react-native";

// Platform-specific imports will be resolved at build time
let supabaseImplementation: any;

if (Platform.OS === "web") {
	supabaseImplementation = require("./supabase.web");
} else {
	supabaseImplementation = require("./supabase.native");
}

export const initSupabase = supabaseImplementation.initSupabase;
export const getSupabaseClient = supabaseImplementation.getSupabaseClient;

/**
 * Initialize Supabase services
 * This should be called early in your app lifecycle
 */
export function initializeSupabaseServices(): void {
	initSupabase();
}