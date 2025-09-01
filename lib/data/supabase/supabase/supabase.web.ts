import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseService } from "./supabase-core";

class SupabaseWebService extends SupabaseService {
	constructor() {
		super("Supabase");
	}

	protected getInitMessage(): string {
		return "Initializing Supabase client...";
	}

	protected getClientConfig(): { detectSessionInUrl: boolean } {
		return { detectSessionInUrl: true };
	}
}

const supabaseService = new SupabaseWebService();

export function initSupabase(): void {
	supabaseService.init();
}

export function getSupabaseClient(): SupabaseClient {
	return supabaseService.getSupabaseClient();
}

// Test utility to reset service state
export function resetSupabaseService(): void {
	(supabaseService as any).initialized = false;
	(supabaseService as any).client = undefined;
}

export { SupabaseClient } from "@supabase/supabase-js";