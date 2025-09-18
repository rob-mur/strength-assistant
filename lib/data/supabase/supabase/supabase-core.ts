import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../models/supabase";
import { Logger } from "./logger";

/**
 * Base service class for Supabase implementations following Firebase pattern
 * Provides common functionality for web and native platforms
 */
export abstract class SupabaseService {
  protected initialized: boolean = false;
  protected client: SupabaseClient<Database> | undefined;
  private readonly logger: Logger;

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
    return parseInt(
      process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT || "54321",
      10,
    );
  }

  protected getSupabaseUrl(): string {
    if (this.isEmulatorEnabled()) {
      const host = this.getEmulatorHost();
      const port = this.getEmulatorPort();
      return `http://${host}:${port}`;
    }

    return process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  }

  protected getSupabaseAnonKey(): string {
    if (this.isEmulatorEnabled()) {
      // Local Supabase has a default anon key for development
      return (
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
      );
    }

    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
  }

  protected sanitizeUrl(url: string): string {
    // Remove sensitive information from URLs for logging
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return "invalid-url";
    }
  }

  protected createSupabaseClient(config: {
    detectSessionInUrl: boolean;
  }): void {
    const supabaseUrl = this.getSupabaseUrl();
    const supabaseAnonKey = this.getSupabaseAnonKey();

    this.logInfo("Supabase configuration check", {
      operation: "config_check",
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      emulatorEnabled: this.isEmulatorEnabled(),
      url: this.sanitizeUrl(supabaseUrl),
      emulatorHost: this.getEmulatorHost(),
      emulatorPort: this.getEmulatorPort(),
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      const error = `Missing Supabase configuration. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`;
      this.logError(error, {
        operation: "config_validation",
        supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        emulatorEnabled: this.isEmulatorEnabled(),
      });
      throw new Error(error);
    }

    this.logInfo("Creating Supabase client", {
      operation: "create_client",
      url: this.sanitizeUrl(supabaseUrl),
    });

    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: config.detectSessionInUrl,
      },
    });

    this.logInfo("Supabase client created successfully", {
      operation: "client_created",
    });
  }

  /**
   * Get platform-specific client configuration
   */
  protected abstract getClientConfig(): { detectSessionInUrl: boolean };

  /**
   * Initialize the Supabase service
   */
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
      this.createSupabaseClient(this.getClientConfig());

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
    } catch (error: unknown) {
      this.logError("Failed to initialize Supabase", {
        operation: "init",
        duration: Date.now() - startTime,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      throw error;
    }
  }

  /**
   * Get platform-specific initialization message
   */
  protected abstract getInitMessage(): string;

  /**
   * Get the Supabase client instance
   */
  getSupabaseClient(): SupabaseClient<Database> {
    this.assertInitialized("getSupabaseClient()");
    if (!this.client) {
      throw new Error("Supabase client not available");
    }
    return this.client;
  }

  /**
   * Check if the service is ready for use
   */
  isReady(): boolean {
    return this.initialized && !!this.client;
  }
}
