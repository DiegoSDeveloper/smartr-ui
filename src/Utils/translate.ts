/**
 * Translation key resolution shared by every component (no React, no config
 * singleton: safe to import from anywhere).
 */
import type { SmartRConfig } from "../config/defaultConfig";

/**
 * Maps a short (legacy) translation key to its configuration path:
 * - `validation.X`  → `resources.validationMessages.X`
 * - `file.texts.X`  → `resources.fileTexts.X`
 * - `file.placeholder` → `behavior.file.filePlaceholderText`
 * - `table.texts.X` / `select.texts.X` → `components.table.texts.X` / `components.select.texts.X`
 * Keys that already are configuration paths are returned unchanged.
 */
export function translationKeyPath(key: string): string {
  if (key.startsWith("validation.")) {
    return `resources.validationMessages.${key.slice("validation.".length)}`;
  }
  if (key.startsWith("file.texts.")) {
    return `resources.fileTexts.${key.slice("file.texts.".length)}`;
  }
  if (key === "file.placeholder") return "behavior.file.filePlaceholderText";
  if (key.startsWith("table.texts.") || key.startsWith("select.texts.")) {
    return `components.${key}`;
  }
  return key;
}

function isMissingTranslation(value: any, key: string, fallback: any): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    value === key ||
    value === fallback
  );
}

/**
 * Calls `config.translate` and falls back to `fallback` when the translator
 * returns nothing usable (`undefined`, `null` or `""`), so a missing
 * translation never renders as "undefined" or as an empty message.
 *
 * The translator is called with the configuration-path key first
 * (`components.select.texts.loadingText`); when that returns nothing, the
 * key itself or the fallback, it is called again with the short alias
 * (`select.texts.loadingText`), so dictionaries keyed either way work.
 */
export function resolveTranslation(
  config: Pick<SmartRConfig, "translate"> | undefined,
  key: string,
  fallback: any,
  params?: any[]
): any {
  if (!config?.translate) return fallback;
  const pathKey = translationKeyPath(key);
  if (pathKey !== key) {
    const byPath = config.translate(pathKey, fallback, params);
    if (!isMissingTranslation(byPath, pathKey, fallback)) return byPath;
  }
  const translated = config.translate(key, fallback, params);
  if (translated === undefined || translated === null || translated === "") {
    return fallback;
  }
  return translated;
}

