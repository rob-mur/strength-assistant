import { Logger } from "./logger";

/**
 * Base service class for Supabase implementations following Firebase pattern
 * Provides common functionality for web and native platforms
 */
export abstract class SupabaseService {
	protected initialized: boolean = false;
	private logger: Logger;

	constructor(serviceName: string) {
		this.logger = new Logger(serviceName);
	}

	protected logInfo(message: string, context?: Record<string, unknown>): void {
		this.logger.info(message, context);
	}

	protected logWarn(message: string, context?: Record<string, unknown>): void {
		this.logger.warn(message, context);
	}

	protected logError(message: string, context?: Record<string, unknown>): void {
		this.logger.error(message, context);
	}

	protected assertInitialized(operation: string): void {
		if (!this.initialized) {
			const error = `Supabase service not initialized. Call init() before ${operation}`;
			this.logError(error);
			throw new Error(error);
		}
	}

	protected isEmulatorEnabled(): boolean {
		// Check if we're in development mode and should use local Supabase
		return (
			process.env.NODE_ENV === "development" ||
			process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR === "true"
		);
	}

	protected getEmulatorHost(): string {
		// Default to localhost for web, but allow override
		// Native apps might need different host (e.g., 10.0.2.2 for Android emulator)
		return process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST || "127.0.0.1";
	}

	protected getEmulatorPort(): number {
		return parseInt(process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT || "54321", 10);
	}

	/**
	 * Initialize the Supabase service
	 */
	abstract init(): void;

	/**
	 * Get the Supabase client instance
	 */
	abstract getSupabaseClient(): any;

	/**
	 * Check if the service is ready for use
	 */
	abstract isReady(): boolean;
}