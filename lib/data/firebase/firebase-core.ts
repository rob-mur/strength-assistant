import { Platform } from "react-native";
import { logger } from "./logger";

export interface FirebaseInitOptions {
	useEmulator?: boolean;
	emulatorHost?: string;
}

export abstract class FirebaseService {
	protected initialized = false;
	protected serviceName: string;
	protected platform: string;

	constructor(serviceName: string) {
		this.serviceName = serviceName;
		this.platform = Platform.OS === 'web' ? 'Web' : 'Native';
	}

	protected isEmulatorEnabled(): boolean {
		const useEmulator = __DEV__ || process.env.EXPO_PUBLIC_USE_EMULATOR === "true";
		this.logInfo(`Firebase emulator enabled: ${useEmulator}`, {
			__DEV__,
			EXPO_PUBLIC_USE_EMULATOR: process.env.EXPO_PUBLIC_USE_EMULATOR
		});
		return useEmulator;
	}

	protected getEmulatorHost(): string {
		return Platform.OS === "web" ? "localhost" : "10.0.2.2";
	}

	protected logInfo(message: string, context?: Partial<any>): void {
		logger.info(message, {
			service: this.serviceName,
			platform: this.platform,
			...context
		});
	}

	protected logWarn(message: string, context?: Partial<any>): void {
		logger.warn(message, {
			service: this.serviceName,
			platform: this.platform,
			...context
		});
	}

	protected logError(message: string, context?: Partial<any>): void {
		logger.error(message, {
			service: this.serviceName,
			platform: this.platform,
			...context
		});
	}

	protected assertInitialized(methodName: string): void {
		if (!this.initialized) {
			const error = `${methodName} called but ${this.serviceName} not initialized`;
			this.logError(error);
			throw new Error(`${this.serviceName} not initialized. Call init() first.`);
		}
	}

	abstract init(): void;
	abstract isReady(): boolean;
}