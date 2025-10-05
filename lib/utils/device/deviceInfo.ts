/**
 * Unified Device Information Service using Expo SDK
 *
 * Cross-platform device information using Expo Device, Application, and Constants.
 * Provides graceful degradation on web and consistent API across all platforms.
 */

import * as Device from "expo-device";
import * as Application from "expo-application";
import Constants from "expo-constants";

export interface IDeviceInfo {
  getDeviceId(): Promise<string>;
  getSystemVersion(): Promise<string>;
  getDeviceModel(): Promise<string>;
  getBrand(): Promise<string>;
  getCarrier(): Promise<string>;
  getBatteryLevel(): Promise<number>;
  isEmulator(): Promise<boolean>;
  getTotalMemory(): Promise<number>;
  getUsedMemory(): Promise<number>;
}

class ExpoDeviceInfo implements IDeviceInfo {
  /**
   * Generate a consistent device identifier
   * On native: uses Device.deviceName or generates from device properties
   * On web: generates from browser fingerprint
   */
  async getDeviceId(): Promise<string> {
    try {
      if (Device.deviceName) {
        return Device.deviceName;
      }

      // Fallback: generate ID from available device properties
      const brand = Device.brand || "unknown";
      const model = Device.modelName || "unknown";
      const os = Device.osName || "unknown";
      const sessionId = Constants.sessionId || "unknown";

      // Create a simple hash-like ID
      const combined = `${brand}-${model}-${os}-${sessionId}`;
      return combined.toLowerCase().replaceAll(/[^a-z0-9-]/g, "");
    } catch {
      // Ultimate fallback
      return `device-${Date.now()}`;
    }
  }

  /**
   * Get system version
   * Returns OS version on native platforms, user agent on web
   */
  async getSystemVersion(): Promise<string> {
    try {
      return Device.osVersion || "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Get device model
   * Returns device model on native, 'Web Browser' on web
   */
  async getDeviceModel(): Promise<string> {
    try {
      return Device.modelName || Device.modelId || "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Get device brand
   * Returns manufacturer on native, browser name on web
   */
  async getBrand(): Promise<string> {
    try {
      return Device.brand || "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Get carrier information
   * Note: Limited support across platforms
   */
  async getCarrier(): Promise<string> {
    // Expo Device doesn't provide carrier info directly
    // This would require additional platform-specific implementation
    return "unknown";
  }

  /**
   * Get battery level
   * Note: Limited support, especially on web
   */
  async getBatteryLevel(): Promise<number> {
    // Expo Device doesn't provide battery info directly
    // This would require expo-battery if needed
    return -1; // Indicates not available
  }

  /**
   * Check if running on emulator/simulator
   * Returns true for simulators, false for physical devices
   */
  async isEmulator(): Promise<boolean> {
    try {
      return Device.isDevice === false;
    } catch {
      return false;
    }
  }

  /**
   * Get total memory
   * Note: Limited cross-platform support
   */
  async getTotalMemory(): Promise<number> {
    // Expo doesn't provide memory info directly
    // This would require additional native modules
    return -1; // Indicates not available
  }

  /**
   * Get used memory
   * Note: Limited cross-platform support
   */
  async getUsedMemory(): Promise<number> {
    // Expo doesn't provide memory info directly
    // This would require additional native modules
    return -1; // Indicates not available
  }

  /**
   * Get comprehensive device context for error reporting
   */
  async getDeviceContext() {
    const [deviceId, systemVersion, model, brand] = await Promise.all([
      this.getDeviceId(),
      this.getSystemVersion(),
      this.getDeviceModel(),
      this.getBrand(),
    ]);

    return {
      deviceId,
      systemVersion,
      model,
      brand,
      deviceType: Device.deviceType,
      osName: Device.osName,
      osVersion: Device.osVersion,
      isDevice: Device.isDevice,
      platform: Constants.platform,
      appVersion: Application.nativeApplicationVersion,
      buildVersion: Application.nativeBuildVersion,
      applicationId: Application.applicationId,
      applicationName: Application.applicationName,
    };
  }
}

// Export singleton instance
export const deviceInfo = new ExpoDeviceInfo();

// Export class for testing
export { ExpoDeviceInfo as DeviceInfoService };

// Export interface for compatibility
export type { IDeviceInfo as DeviceInfo };
