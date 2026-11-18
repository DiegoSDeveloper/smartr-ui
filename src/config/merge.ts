import type { PartialSmartRConfig, SmartRConfig } from "./defaultConfig";

/** True for plain configuration objects (not arrays, functions, React elements, class instances). */
export function isPlainConfigObject(value: any): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if ((value as any).$$typeof) return false; // React element / forwardRef / memo
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep merge objects (arrays, functions and React values are replaced, not merged).
 * Same semantics as the 1.1.0 `configManager` merge for JSON configurations.
 */
export function deepMerge<T>(base: T, patch: any): T {
  if (!patch || typeof patch !== "object") return base;

  const result: any = Array.isArray(base)
    ? [...((patch as any) ?? base)]
    : { ...base };

  for (const [key, value] of Object.entries(patch)) {
    const baseValue = (base as any)?.[key];

    if (isPlainConfigObject(value) && isPlainConfigObject(baseValue)) {
      result[key] = deepMerge(baseValue, value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Builds a full configuration from a preset plus optional overrides.
 *
 * @example
 * const config = createConfig(tailwindPreset, { mergeClasses: twMerge });
 */
export function createConfig(
  preset: SmartRConfig,
  overrides?: PartialSmartRConfig
): SmartRConfig {
  return deepMerge(preset, overrides || {});
}
