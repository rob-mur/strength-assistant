import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SupabaseService } from "./supabase-core";

class SupabaseNativeService extends SupabaseService {
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
		this.logInfo("Initializing Supabase client for React Native...", {
			operation: "init",
		});

		try {
			const supabaseUrl = this.getSupabaseUrl();
			const supabaseAnonKey = this.getSupabaseAnonKey();
			
			this.logInfo("Supabase configuration check", {
				operation: "config_check",
				hasUrl: !!supabaseUrl,
				hasKey: !!supabaseAnonKey,
				emulatorEnabled: this.isEmulatorEnabled(),
				url: this.sanitizeUrl(supabaseUrl),
				emulatorHost: this.getEmulatorHost(),
				emulatorPort: this.getEmulatorPort()
			});

			if (!supabaseUrl || !supabaseAnonKey) {
				const error = `Missing Supabase configuration. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`;
				this.logError(error, {
					operation: "config_validation",
					supabaseUrl,
					hasAnonKey: !!supabaseAnonKey,
					emulatorEnabled: this.isEmulatorEnabled()
				});
				throw new Error(error);
			}

			this.logInfo("Creating Supabase client", {
				operation: "create_client",
				url: this.sanitizeUrl(supabaseUrl)
			});

			this.client = createClient(supabaseUrl, supabaseAnonKey, {
				auth: {
					// React Native specific configurations
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: false, // Disable for native apps
				},
			});

			this.logInfo("Supabase client created successfully", {
				operation: "client_created"
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
			// For Android emulator, use 10.0.2.2 instead of localhost
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

	protected getEmulatorHost(): string {
		// Android emulator needs 10.0.2.2 to access host machine
		// iOS simulator can use localhost/127.0.0.1
		return process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST || "10.0.2.2";
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