// useSmartConfig.ts
import { useContext } from "react";
import { configManager } from "../config/configManager";
import { SmartRConfigContext } from "../context/SmartRProvider";

/**
 * Returns the effective configuration: the nearest `SmartRProvider`'s config,
 * or the global `configManager` configuration (which also picks up
 * `window.SmartRConfig`) when there is no provider.
 */
export const useSmartConfig = () => {
  const contextConfig = useContext(SmartRConfigContext);
  return contextConfig ?? configManager.getConfig();
};
