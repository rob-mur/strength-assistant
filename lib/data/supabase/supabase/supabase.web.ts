import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../models/supabase";
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

export function getSupabaseClient(): SupabaseClient<Database> {
	return supabaseService.getSupabaseClient();
}

// Test utility to reset service state
export function resetSupabaseService(): void {
	(supabaseService as unknown as { initialized: boolean; client: unknown }).initialized = false;
	(supabaseService as unknown as { initialized: boolean; client: unknown }).client = undefined;
}

export { SupabaseClient } from "@supabase/supabase-js";