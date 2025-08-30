import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SupabaseService } from "./supabase-core";

class SupabaseWebService extends SupabaseService {
	private client: SupabaseClient | undefined;

	constructor() {
		super("Supabase");
	}

	init(): void {
		if (this.initialized) {
			this.logInfo("Already initialized, skipping");
			return;
		}

		const startTime = Date.now();
		this.logInfo("Initializing Supabase client...", {
			operation: "init",
		});

		try {
			const supabaseUrl = this.getSupabaseUrl();
			const supabaseAnonKey = this.getSupabaseAnonKey();

			if (!supabaseUrl || !supabaseAnonKey) {
				throw new Error("Missing Supabase configuration. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.");
			}

			this.client = createClient(supabaseUrl, supabaseAnonKey, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: true,
				},
			});

			this.logInfo("Supabase client initialized successfully", {
				operation: "init",
				duration: Date.now() - startTime,
				url: this.sanitizeUrl(supabaseUrl),
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

	private getSupabaseUrl(): string {
		if (this.isEmulatorEnabled()) {
			const host = this.getEmulatorHost();
			const port = this.getEmulatorPort();
			return `http://${host}:${port}`;
		}
		
		return process.env.EXPO_PUBLIC_SUPABASE_URL || "";
	}

	private getSupabaseAnonKey(): string {
		if (this.isEmulatorEnabled()) {
			// Local Supabase has a default anon key for development
			return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
		}
		
		return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
	}

	private sanitizeUrl(url: string): string {
		// Remove sensitive information from URLs for logging
		try {
			const urlObj = new URL(url);
			return `${urlObj.protocol}//${urlObj.host}`;
		} catch {
			return "invalid-url";
		}
	}

	getSupabaseClient(): SupabaseClient {
		this.assertInitialized("getSupabaseClient()");
		if (!this.client) {
			throw new Error("Supabase client not available");
		}
		return this.client;
	}

	isReady(): boolean {
		return this.initialized && !!this.client;
	}
}

const supabaseService = new SupabaseWebService();

export function initSupabase(): void {
	supabaseService.init();
}

export function getSupabaseClient(): SupabaseClient {
	return supabaseService.getSupabaseClient();
}

export { SupabaseClient } from "@supabase/supabase-js";