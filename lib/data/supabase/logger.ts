export interface LogContext {
	service: string;
	platform?: string;
	operation?: string;
	duration?: number;
	url?: string;
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

export class Logger {
	private serviceName: string;

	constructor(serviceName: string) {
		this.serviceName = serviceName;
	}

	private createMessage(level: string, message: string, context?: Record<string, unknown>): string {
		const prefix = `[${this.serviceName}]`;
		return `${prefix} ${message}`;
	}

	private logWithContext(level: 'log' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
		const formattedMessage = this.createMessage(level, message, context);
		
		if (level === 'error') {
			console.error(formattedMessage, context);
		} else if (level === 'warn') {
			console.warn(formattedMessage, context);
		} else {
			console.log(formattedMessage, context);
		}
	}

	info(message: string, context?: Record<string, unknown>): void {
		this.logWithContext('log', message, context);
	}

	warn(message: string, context?: Record<string, unknown>): void {
		this.logWithContext('warn', message, context);
	}

	error(message: string, context?: Record<string, unknown>): void {
		this.logWithContext('error', message, context);
	}
}