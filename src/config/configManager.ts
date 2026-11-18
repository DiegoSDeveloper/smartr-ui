// configManager.ts - Global configuration singleton
import {
  defaultConfig,
  SmartRConfig,
  PartialSmartRConfig,
} from "./defaultConfig";
import { createConfig, deepMerge } from "./merge";

export class ConfigManager {
  private config: SmartRConfig = { ...defaultConfig };
  private hasUserConfig = false;

  /**
   * Set user configuration - merges with the current configuration
   */
  setConfig(userConfig: PartialSmartRConfig): void {
    this.config = this.deepMerge(this.config, userConfig as any);
    this.hasUserConfig = true;
  }

  /**
   * Replace the base configuration with a preset (e.g. `tailwindPreset`),
   * optionally merging overrides on top of it.
   *
   * @example
   * configManager.setPreset(tailwindPreset, { mergeClasses: twMerge });
   */
  setPreset(preset: SmartRConfig, overrides?: PartialSmartRConfig): void {
    this.config = createConfig(preset, overrides);
    this.hasUserConfig = true;
  }

  /**
   * Get current configuration
   */
  getConfig(): SmartRConfig {
    // Try to load global config if no user config was set
    if (!this.hasUserConfig) {
      this.tryLoadGlobalConfig();
    }
    return this.config;
  }

  /**
   * Reset to default configuration
   */
  resetConfig(): void {
    this.config = { ...defaultConfig };
    this.hasUserConfig = false;
  }

  /**
   * Try to load configuration from global window object
   */
  private tryLoadGlobalConfig(): void {
    try {
      if (typeof window !== "undefined" && (window as any).SmartRConfig) {
        this.setConfig((window as any).SmartRConfig);
      }
    } catch (error) {
      console.warn("[SmartR] Failed to load global config, using defaults");
    }
  }

  /**
   * Deep merge objects and arrays - updated to handle DeepPartial
   */
  private deepMerge<T>(base: T, patch: any): T {
    return deepMerge(base, patch);
  }
}

// Global instance
export const configManager = new ConfigManager();

// Export for compatibility
export const configSmartR = configManager.getConfig();
export type { SmartRConfig, PartialSmartRConfig };
