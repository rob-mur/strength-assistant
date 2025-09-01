import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseService } from "./supabase-core";

class SupabaseNativeService extends SupabaseService {
	constructor() {
		super("Supabase");
	}

	protected getInitMessage(): string {
		return "Initializing Supabase client for React Native...";
	}

	protected getEmulatorHost(): string {
		// Android emulator needs 10.0.2.2 to access host machine
		// iOS simulator can use localhost/127.0.0.1
		return process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST || "10.0.2.2";
	}

	init(): void {
		if (this.initialized) {
			this.logInfo("Already initialized, skipping");
			return;
		}

		const startTime = Date.now();
		this.logInfo(this.getInitMessage(), {
			operation: "init",
		});

		try {
			this.createSupabaseClient({ detectSessionInUrl: false });

			this.logInfo("Supabase client initialized successfully", {
				operation: "init",
				duration: Date.now() - startTime,
				url: this.sanitizeUrl(this.getSupabaseUrl()),
			});

			this.initialized = true;

			this.logInfo("Initialization complete", {
				operation: "init",
				duration: Date.now() - startTime,
			});
		} catch (error: any) {
			this.logError("Failed to initialize Supabase", {
				operation: "init",
				duration: Date.now() - startTime,
				error: {
					message: error.message,
					stack: error.stack,
				},
			});
			throw error;
		}
	}
}

const supabaseService = new SupabaseNativeService();

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