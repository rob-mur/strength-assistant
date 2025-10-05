/**
 * Unified Toast Service using react-native-toast-notifications
 *
 * Cross-platform toast notifications using react-native-toast-notifications.
 * Provides graceful degradation on platforms without toast support.
 */

// Note: Toast import handled through ref to avoid direct dependency

export interface ToastOptions {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  position?: "top" | "center" | "bottom";
}

export interface IToastService {
  show(options: ToastOptions): Promise<void>;
  hide(): Promise<void>;
}

class UnifiedToastService implements IToastService {
  private toastRef: {
    show: (
      message: string,
      options?: {
        type?: string;
        duration?: number;
        placement?: string;
        animationType?: string;
      },
    ) => void;
    hideAll?: () => void;
  } | null = null;

  /**
   * Show a toast notification
   */
  async show(options: ToastOptions): Promise<void> {
    try {
      if (this.toastRef) {
        const type = this.mapToastType(options.type || "info");

        this.toastRef.show(options.message, {
          type: type,
          duration: options.duration || 3000,
          placement: this.mapPosition(options.position || "top"),
          animationType: "slide-in",
        });
      } else {
        // Fallback to console for environments without toast support
        console.log(`Toast (${options.type || "info"}): ${options.message}`);
      }
    } catch {
      // Silent fallback to console
      console.log(`Toast (${options.type || "info"}): ${options.message}`);
    }
  }

  /**
   * Hide current toast notifications
   */
  async hide(): Promise<void> {
    try {
      if (this.toastRef && this.toastRef.hideAll) {
        this.toastRef.hideAll();
      }
    } catch {
      // Silent failure - hide is not critical
    }
  }

  /**
   * Set the toast reference (should be called when ToastProvider is mounted)
   */
  setToastRef(
    ref: {
      show: (
        message: string,
        options?: {
          type?: string;
          duration?: number;
          placement?: string;
          animationType?: string;
        },
      ) => void;
      hideAll?: () => void;
    } | null,
  ): void {
    this.toastRef = ref;
  }

  /**
   * Map our toast types to react-native-toast-notifications types
   */
  private mapToastType(type: ToastOptions["type"]): string {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
      default:
        return "normal";
    }
  }

  /**
   * Map our position to react-native-toast-notifications placement
   */
  private mapPosition(position: ToastOptions["position"]): string {
    switch (position) {
      case "top":
        return "top";
      case "bottom":
        return "bottom";
      case "center":
        return "center";
      default:
        return "top";
    }
  }
}

// Export singleton instance
export const toastService = new UnifiedToastService();

// Export class for testing
export { UnifiedToastService as ToastServiceClass };

// Export interface for compatibility
export type { IToastService as ToastService };
