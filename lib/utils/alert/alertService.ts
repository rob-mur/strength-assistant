/**
 * Unified Alert Service using react-native-paper-alerts
 *
 * Cross-platform alert dialogs using react-native-paper-alerts.
 * Provides graceful degradation on platforms without alert support.
 */

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
}

export interface IAlertService {
  show(options: AlertOptions): Promise<void>;
}

class UnifiedAlertService implements IAlertService {
  /**
   * Show an alert dialog
   */
  async show(options: AlertOptions): Promise<void> {
    try {
      // Note: react-native-paper-alerts is not used as it requires hook-based integration
      // See isPaperAlertsAvailable() method for detection logic

      // Try React Native Alert
      if (await this.tryReactNativeAlert(options)) {
        return;
      }

      // Fallback to web alert
      if (await this.tryWebAlert(options)) {
        return;
      }

      // Ultimate fallback to console
      this.fallbackToConsole(options);
    } catch {
      // Silent fallback
      this.fallbackToConsole(options);
    }
  }

  /**
   * Check if react-native-paper-alerts is available
   * Currently not used as it requires hook-based integration at component level
   */
  private isPaperAlertsAvailable(): boolean {
    try {
      // Use synchronous check to avoid always returning false
      const importModule = eval("require");
      importModule("react-native-paper-alerts");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Try react-native-paper-alerts implementation
   * Note: Currently not implemented as it requires hook-based integration
   */
  private tryPaperAlerts(_options: AlertOptions): boolean {
    // react-native-paper-alerts uses a hook-based API that requires component-level integration
    // This service-level implementation cannot use it directly

    if (this.isPaperAlertsAvailable()) {
      console.warn(
        "react-native-paper-alerts detected but requires hook-based integration. Use AlertProvider in your component tree.",
      );
      // Return false to indicate we cannot handle it at service level
      return false;
    }

    // Library not available
    return false;
  }

  /**
   * Try React Native Alert implementation
   */
  private async tryReactNativeAlert(options: AlertOptions): Promise<boolean> {
    try {
      const { Alert } = await import("react-native");

      const buttons = options.buttons?.map((button) => ({
        text: button.text,
        onPress: button.onPress,
        style: button.style,
      })) || [{ text: "OK" }];

      Alert.alert(options.title, options.message, buttons, {
        cancelable: options.cancelable ?? true,
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Try web alert implementation
   */
  private async tryWebAlert(options: AlertOptions): Promise<boolean> {
    try {
      if (globalThis.window === undefined) {
        return false;
      }

      // If no buttons or just one button, use simple alert
      if (!options.buttons || options.buttons.length <= 1) {
        const messageText = options.message ? "\n\n" + options.message : "";
        const fullMessage = options.title + messageText;
        globalThis.window.alert(fullMessage);
        if (options.buttons?.[0]?.onPress) {
          options.buttons[0].onPress();
        }
        return true;
      }

      // For multiple buttons, use confirm dialog
      if (options.buttons.length === 2) {
        const messageText = options.message ? "\n\n" + options.message : "";
        const fullMessage = options.title + messageText;
        const confirmed = globalThis.window.confirm(fullMessage);

        // Find the appropriate button to call
        const confirmButton =
          options.buttons.find((b) => b.style !== "cancel") ||
          options.buttons[1];
        const cancelButton =
          options.buttons.find((b) => b.style === "cancel") ||
          options.buttons[0];

        if (confirmed && confirmButton.onPress) {
          confirmButton.onPress();
        } else if (!confirmed && cancelButton.onPress) {
          cancelButton.onPress();
        }
        return true;
      }

      // For more than 2 buttons, create a custom modal
      this.createCustomWebAlert(options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create custom web alert for complex cases
   */
  private createCustomWebAlert(options: AlertOptions): void {
    // Create overlay
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: "10000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    // Create modal
    const modal = document.createElement("div");
    Object.assign(modal.style, {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "24px",
      maxWidth: "400px",
      width: "90%",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    });

    // Title
    const title = document.createElement("h3");
    title.textContent = options.title;
    Object.assign(title.style, {
      margin: "0 0 16px 0",
      fontSize: "18px",
      fontWeight: "600",
    });
    modal.appendChild(title);

    // Message
    if (options.message) {
      const message = document.createElement("p");
      message.textContent = options.message;
      Object.assign(message.style, {
        margin: "0 0 24px 0",
        fontSize: "14px",
        lineHeight: "1.5",
        color: "#666",
      });
      modal.appendChild(message);
    }

    // Buttons container
    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, {
      display: "flex",
      gap: "8px",
      justifyContent: "flex-end",
    });

    // Add buttons
    if (options.buttons) {
      for (const buttonConfig of options.buttons) {
        const button = document.createElement("button");
        button.textContent = buttonConfig.text;

        const buttonColors = this.getButtonColors(buttonConfig.style);

        Object.assign(button.style, {
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          cursor: "pointer",
          backgroundColor: buttonColors.backgroundColor,
          color: buttonColors.color,
        });

        button.onclick = () => {
          overlay.remove();
          if (buttonConfig.onPress) {
            buttonConfig.onPress();
          }
        };

        buttonContainer.appendChild(button);
      }
    }

    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // Handle overlay click if cancelable
    if (options.cancelable !== false) {
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      };
    }

    document.body.appendChild(overlay);
  }

  /**
   * Get button colors based on style
   */
  private getButtonColors(style?: "default" | "cancel" | "destructive"): {
    backgroundColor: string;
    color: string;
  } {
    if (style === "destructive") {
      return { backgroundColor: "#ef4444", color: "white" };
    }

    if (style === "cancel") {
      return { backgroundColor: "#f3f4f6", color: "#374151" };
    }

    return { backgroundColor: "#3b82f6", color: "white" };
  }

  /**
   * Console fallback for alert
   */
  private fallbackToConsole(options: AlertOptions): void {
    const messageText = options.message ? ` - ${options.message}` : "";
    console.log(`Alert: ${options.title}${messageText}`);

    if (options.buttons) {
      console.log("Buttons:", options.buttons.map((b) => b.text).join(", "));
    }
  }
}

// Export singleton instance
export const alertService = new UnifiedAlertService();

// Export class for testing
export { UnifiedAlertService as AlertServiceClass };

// Export interface for compatibility
export type { IAlertService as AlertService };
