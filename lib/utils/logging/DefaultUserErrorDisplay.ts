/**
 * DefaultUserErrorDisplay Implementation
 *
 * User-facing error display service for React Native applications.
 * Provides consistent error messaging and user interaction patterns.
 */

import { UserErrorDisplay } from "../../../specs/011-improve-error-logging/contracts/logging-service";
import { alertService } from "../alert/alertService";
import { toastService } from "../toast/toastService";

export class DefaultUserErrorDisplay implements UserErrorDisplay {
  /**
   * Show a generic error message to the user
   */
  async showGenericError(
    operation: string,
    canRetry: boolean = false,
  ): Promise<void> {
    const title = "Error";
    const message = this.formatGenericErrorMessage(operation, canRetry);

    return this.showAlert(title, message, canRetry);
  }

  /**
   * Show a network error message to the user
   */
  async showNetworkError(operation: string): Promise<void> {
    const title = "Network Error";
    const message = this.formatNetworkErrorMessage(operation);

    return this.showAlert(title, message, true); // Network errors can usually be retried
  }

  /**
   * Show an authentication error message to the user
   */
  async showAuthenticationError(operation: string): Promise<void> {
    const title = "Authentication Error";
    const message = this.formatAuthenticationErrorMessage(operation);

    return this.showAlert(title, message, false); // Auth errors typically require different action
  }

  /**
   * Show a custom error message to the user
   */
  async showCustomError(
    message: string,
    title: string = "Error",
  ): Promise<void> {
    return this.showAlert(title, message, false);
  }

  /**
   * Private helper methods
   */

  private async showAlert(
    title: string,
    message: string,
    canRetry: boolean,
  ): Promise<void> {
    try {
      // Try React Native Alert first
      if (await this.tryReactNativeAlert(title, message, canRetry)) {
        return;
      }

      // Fallback to web alert
      if (await this.tryWebAlert(title, message, canRetry)) {
        return;
      }

      // Ultimate fallback to console
      this.fallbackToConsole(title, message);
    } catch {
      // Silent failure fallback
      this.fallbackToConsole(title, message);
    }
  }

  private async tryReactNativeAlert(
    title: string,
    message: string,
    canRetry: boolean,
  ): Promise<boolean> {
    try {
      const buttons = [];

      if (canRetry) {
        buttons.push({
          text: "Retry",
          onPress: () => {},
        });
      }

      buttons.push({
        text: "OK",
        onPress: () => {},
        style: "default" as const,
      });

      await alertService.show({
        title,
        message,
        buttons,
      });

      return true;
    } catch {
      return false;
    }
  }

  private async tryWebAlert(
    title: string,
    message: string,
    _canRetry: boolean,
  ): Promise<boolean> {
    try {
      // Check if we're in a web environment
      if (typeof globalThis.alert !== "function") {
        return false;
      }

      // Use native web alert
      const fullMessage = `${title}\n\n${message}`;
      globalThis.alert(fullMessage);
      return true;
    } catch {
      return false;
    }
  }

  private fallbackToConsole(title: string, message: string): void {
    console.error(`${title}: ${message}`);
  }

  private formatGenericErrorMessage(
    operation: string,
    canRetry: boolean,
  ): string {
    const baseMessage = `An error occurred while ${operation}.`;

    if (canRetry) {
      return `${baseMessage} Please try again.`;
    }

    return `${baseMessage} Please contact support if the problem persists.`;
  }

  private formatNetworkErrorMessage(operation: string): string {
    return `Unable to connect to the server while ${operation}. Please check your internet connection and try again.`;
  }

  private formatAuthenticationErrorMessage(operation: string): string {
    return `Authentication is required to ${operation}. Please sign in and try again.`;
  }

  protected formatOperation(operation: string): string {
    // Convert operation strings to user-friendly descriptions
    const operationMap: Record<string, string> = {
      login: "signing in",
      logout: "signing out",
      "fetch-data": "loading data",
      "save-data": "saving data",
      "upload-file": "uploading file",
      "download-file": "downloading file",
      "sync-data": "synchronizing data",
      "load-exercises": "loading exercises",
      "save-exercise": "saving exercise",
      "delete-exercise": "deleting exercise",
      "load-workouts": "loading workouts",
      "save-workout": "saving workout",
      "delete-workout": "deleting workout",
      "backup-data": "backing up data",
      "restore-data": "restoring data",
      "update-profile": "updating profile",
      "change-password": "changing password",
      "send-feedback": "sending feedback",
    };

    // Return mapped operation or clean up the original
    const mapped = operationMap[operation.toLowerCase()];
    if (mapped) {
      return mapped;
    }

    // Clean up operation string
    return operation
      .replaceAll(/[-_]/g, " ") // Replace hyphens and underscores with spaces
      .replaceAll(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .toLowerCase()
      .trim();
  }
}

/**
 * Toast notification support for better user experience
 */
export interface LocalToastOptions {
  duration?: number;
  position?: "top" | "center" | "bottom";
  type?: "error" | "warning" | "info" | "success";
}

export class EnhancedUserErrorDisplay extends DefaultUserErrorDisplay {
  /**
   * Show a toast notification if available, otherwise fall back to alert
   */
  async showToast(
    message: string,
    options: LocalToastOptions = {},
  ): Promise<void> {
    try {
      // Try to use a toast library if available
      if (await this.tryToastNotification(message, options)) {
        return;
      }

      // Fallback to standard alert
      await this.showCustomError(message);
    } catch {
      // Silent fallback
      console.warn("Toast notification failed:", message);
    }
  }

  /**
   * Show error with toast for non-critical errors
   */
  async showGenericError(
    operation: string,
    canRetry: boolean = false,
  ): Promise<void> {
    const message = this.getGenericErrorMessage(operation, canRetry);

    // Use toast for non-critical errors that can be retried
    if (canRetry && !this.isCriticalOperation(operation)) {
      await this.showToast(message, { type: "error", duration: 4000 });
      return;
    }

    // Use alert for critical operations
    return super.showGenericError(operation, canRetry);
  }

  /**
   * Show network error with toast
   */
  async showNetworkError(operation: string): Promise<void> {
    const message = this.getNetworkErrorMessage(operation);

    // Network errors are good candidates for toast notifications
    if (!this.isCriticalOperation(operation)) {
      await this.showToast(message, { type: "warning", duration: 5000 });
      return;
    }

    return super.showNetworkError(operation);
  }

  private async tryToastNotification(
    message: string,
    options: LocalToastOptions,
  ): Promise<boolean> {
    try {
      await toastService.show({
        message,
        type: options.type || "error",
        duration: options.duration || 3000,
        position: options.position || "top",
      });
      return true;
    } catch {
      return false;
    }
  }

  private isCriticalOperation(operation: string): boolean {
    const criticalOperations = [
      "login",
      "logout",
      "change-password",
      "delete-account",
      "backup-data",
      "restore-data",
      "payment",
      "purchase",
    ];

    return criticalOperations.some((critical) =>
      operation.toLowerCase().includes(critical),
    );
  }

  private getGenericErrorMessage(operation: string, canRetry: boolean): string {
    const baseMessage = `Error ${this.formatOperation(operation)}`;

    if (canRetry) {
      return `${baseMessage}. Tap to retry.`;
    }

    return `${baseMessage}. Please try again.`;
  }

  private getNetworkErrorMessage(operation: string): string {
    return `No connection while ${this.formatOperation(operation)}. Check internet and retry.`;
  }
}
