import { Platform } from "react-native";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../models/supabase";
import { Logger } from "./supabase/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";

class SupabaseService {
  private initialized: boolean = false;
  private client: SupabaseClient<Database> | undefined;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger("Supabase");
  }

  private logInfo(message: string, context?: Record<string, unknown>): void {
    this.logger.info(message, context);
  }

  private logWarn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, context);
  }

  private logError(message: string, context?: Record<string, unknown>): void {
    this.logger.error(message, context);
  }

  private assertInitialized(operation: string): void {
    if (!this.initialized) {
      const error = `Supabase service not initialized. Call init() before ${operation}`;
      this.logError(error);
      throw new Error(error);
    }
  }

  private getSupabaseUrl(): string {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error(
        "EXPO_PUBLIC_SUPABASE_URL environment variable is required",
      );
    }
    return url;
  }

  private getSupabaseAnonKey(): string {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error(
        "EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required",
      );
    }
    return key;
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return "invalid-url";
    }
  }

  private createSupabaseClient(): void {
    const supabaseUrl = this.getSupabaseUrl();
    const supabaseAnonKey = this.getSupabaseAnonKey();

    this.logInfo("Supabase configuration check", {
      operation: "config_check",
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: this.sanitizeUrl(supabaseUrl),
    });

    this.logInfo("Creating Supabase client", {
      operation: "create_client",
      url: this.sanitizeUrl(supabaseUrl),
      platform: Platform.OS,
    });

    // Platform-specific configuration
    const detectSessionInUrl = Platform.OS === "web";

    // Platform-specific storage configuration
    let storage;
    if (Platform.OS === "web") {
      // Use localStorage for web
      storage = {
        getItem: (key: string) => {
          if (typeof globalThis !== "undefined" && globalThis.localStorage) {
            return globalThis.localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key: string, value: string) => {
          if (typeof globalThis !== "undefined" && globalThis.localStorage) {
            globalThis.localStorage.setItem(key, value);
          }
        },
        removeItem: (key: string) => {
          if (typeof globalThis !== "undefined" && globalThis.localStorage) {
            globalThis.localStorage.removeItem(key);
          }
        },
      };
    } else {
      // Use AsyncStorage for React Native
      storage = AsyncStorage;
    }

    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl,
        storage,
      },
    });

    this.logInfo("Supabase client created successfully", {
      operation: "client_created",
      detectSessionInUrl,
    });
  }

  init(): void {
    if (this.initialized) {
      this.logInfo("Already initialized, skipping");
      return;
    }

    const startTime = Date.now();
    const initMessage =
      Platform.OS === "web"
        ? "Initializing Supabase client..."
        : "Initializing Supabase client for React Native...";

    this.logInfo(initMessage, {
      operation: "init",
    });

    try {
      this.createSupabaseClient();

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

  getSupabaseClient(): SupabaseClient<Database> {
    this.assertInitialized("getSupabaseClient()");
    if (!this.client) {
      throw new Error("Supabase client not available");
    }
    return this.client;
  }

  isReady(): boolean {
    return this.initialized && !!this.client;
  }

  // Test utility to reset service state
  resetSupabaseService(): void {
    this.initialized = false;
    this.client = undefined;
  }
}

const supabaseService = new SupabaseService();

export const initSupabase = () => supabaseService.init();
export const getSupabaseClient = () => supabaseService.getSupabaseClient();
export const resetSupabaseService = () =>
  supabaseService.resetSupabaseService();
export { SupabaseClient } from "@supabase/supabase-js";
