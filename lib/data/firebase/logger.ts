export interface LogContext {
	service: string;
	platform: string;
	operation?: string;
	duration?: number;
	config?: Record<string, unknown>;
	emulator?: {
		host: string;
		port: number;
	};
	error?: {
		message: string;
		code?: string;
		stack?: string;
	};
}

export class FirebaseLogger {
	private createMessage(level: string, message: string, context: LogContext): string {
		const platformSuffix = context.platform ? ` ${context.platform}` : '';
		const prefix = `[${context.service}${platformSuffix}]`;
		return `${prefix} ${message}`;
	}

	private logWithContext(level: 'log' | 'warn' | 'error', message: string, context: LogContext): void {
		const formattedMessage = this.createMessage(level, message, context);
		
		if (level === 'error') {
			console.error(formattedMessage, context);
		} else if (level === 'warn') {
			console.warn(formattedMessage, context);
		} else {
			console.log(formattedMessage, context);
		}
	}

	debug(message: string, context: LogContext): void {
		this.logWithContext('log', message, context);
	}

	info(message: string, context: LogContext): void {
		this.logWithContext('log', message, context);
	}

	warn(message: string, context: LogContext): void {
		this.logWithContext('warn', message, context);
	}

	error(message: string, context: LogContext): void {
		this.logWithContext('error', message, context);
	}
}

export const logger = new FirebaseLogger();