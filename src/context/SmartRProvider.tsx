import React, { createContext, useContext, useMemo, useRef } from "react";
import { configManager } from "../config/configManager";
import type {
  PartialSmartRConfig,
  SmartRConfig,
} from "../config/defaultConfig";
import { deepMerge, isPlainConfigObject } from "../config/merge";

/**
 * Holds the effective configuration of the nearest `SmartRProvider`.
 * `null` means "no provider": components fall back to `configManager`.
 */
export const SmartRConfigContext = /*#__PURE__*/ createContext<SmartRConfig | null>(null);

export interface SmartRProviderProps {
  /**
   * Configuration merged over the parent provider's configuration (or over the
   * global `configManager` configuration when this is the outermost provider).
   * Accepts a full preset (`tailwindPreset`) or a partial override.
   *
   * Prefer a stable object (module-level constant or `useMemo`). An inline
   * literal also works: when its content is structurally equal to the previous
   * render's, the previous merged configuration is reused, so consumers are
   * not re-rendered. Functions (`mergeClasses`, `translate`, `grid.column`,
   * render slots, icon components) are compared by reference, so inline arrow
   * functions still produce a new configuration on every render.
   */
  config?: PartialSmartRConfig | SmartRConfig;
  children?: React.ReactNode;
}

/**
 * Structural equality for configuration objects: plain objects and arrays
 * are compared recursively, React elements by type/key/props, everything else
 * (functions, components, class instances) by reference.
 */
export function configEquals(a: any, b: any, depth = 0): boolean {
  if (Object.is(a, b)) return true;
  if (depth > 32) return false;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!configEquals(a[i], b[i], depth + 1)) return false;
    }
    return true;
  }

  if (React.isValidElement(a) || React.isValidElement(b)) {
    if (!React.isValidElement(a) || !React.isValidElement(b)) return false;
    return (
      a.type === b.type &&
      a.key === b.key &&
      configEquals(a.props, b.props, depth + 1)
    );
  }

  if (!isPlainConfigObject(a) || !isPlainConfigObject(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!configEquals(a[key], b[key], depth + 1)) return false;
  }
  return true;
}

/**
 * Returns the previous `config` object while the new one is structurally
 * equal, so `useMemo` below only re-merges when the content really changed.
 */
function useStableConfig<T>(config: T): T {
  const ref = useRef<T>(config);
  if (ref.current !== config && !configEquals(ref.current, config)) {
    ref.current = config;
  }
  return ref.current;
}

/**
 * Scopes a smartr-ui configuration to a React subtree.
 *
 * Precedence (lowest to highest): built-in defaults → `window.SmartRConfig` /
 * `configManager.setConfig` → outer providers → inner providers → component props.
 */
export function SmartRProvider(props: SmartRProviderProps) {
  const { config, children } = props;
  const parent = useContext(SmartRConfigContext);
  const base = parent ?? configManager.getConfig();
  const stableConfig = useStableConfig(config);

  const value = useMemo(
    () => (stableConfig ? deepMerge(base, stableConfig) : base),
    [base, stableConfig]
  );

  return (
    <SmartRConfigContext.Provider value={value}>
      {children}
    </SmartRConfigContext.Provider>
  );
}
