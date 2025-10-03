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

  protected getSupabaseUrl(): string {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error(
        "EXPO_PUBLIC_SUPABASE_URL environment variable is required",
      );
    }
    return url;
  }

  protected getSupabaseAnonKey(): string {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error(
        "EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required",
      );
    }
    return key;
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
      url: this.sanitizeUrl(supabaseUrl),
    });

    // URL and key validation is now handled in the getter methods

    this.logInfo("Creating Supabase client", {
      operation: "create_client",
      url: this.sanitizeUrl(supabaseUrl),
    });

    // Import AsyncStorage for session persistence in React Native
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;

    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: config.detectSessionInUrl,
        storage: AsyncStorage,
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
