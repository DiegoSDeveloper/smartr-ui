/**
 * Every built-in text that goes through `config.translate`, with its key
 * (= its configuration path), its legacy short alias and its default text.
 * Use it to generate translation dictionaries:
 *
 * ```ts
 * import { defaultTexts, defaultTextsTree } from "smartr-ui";
 * // flat:   { "resources.validationMessages.required": "This field is required", … }
 * // nested: { resources: { validationMessages: { required: "This field is required" } }, … }
 * ```
 *
 * `translate(key, fallback, params)` is called with the configuration-path key
 * first and, when that returns nothing / the key / the fallback, with the
 * short alias (`validation.required`, `select.texts.loadingText`,
 * `table.texts.showing`, `file.texts.deleteTooltip`, `file.placeholder`),
 * so dictionaries keyed either way keep working.
 */
import type { SmartRConfig } from "./defaultConfig";
import {
  sharedBehavior,
  sharedFileTexts,
  sharedSelectTexts,
  sharedTableTextsEnglish,
  sharedValidationMessages,
} from "./sharedConfig";

export interface SmartRTranslationKey {
  /** Key passed first to `translate` — the text's configuration path. */
  key: string;
  /** Legacy short key, still passed to `translate` as an alias. */
  alias: string;
  /**
   * Default (English) text, possibly with placeholders: `%s1`, `%s2`… or, in
   * table texts, `{count}` / `{label}` / `{0}`, `{1}`….
   */
  defaultText: string;
  /** Number of distinct placeholders (= length of the `params` passed to `translate`). */
  params: number;
}

type TextSources = {
  validationMessages: Record<string, any>;
  fileTexts: Record<string, any>;
  tableTexts: Record<string, any>;
  selectTexts: Record<string, any>;
  filePlaceholderText: any;
};

function countParams(text: string): number {
  const matches = String(text ?? "").match(/%s[0-9]+|\{[A-Za-z0-9_]+\}/g);
  return matches ? new Set(matches).size : 0;
}

function entries(
  pathPrefix: string,
  aliasPrefix: string,
  texts: Record<string, any>
): SmartRTranslationKey[] {
  return Object.keys(texts || {})
    .filter((name) => typeof texts[name] === "string")
    .map((name) => ({
      key: `${pathPrefix}.${name}`,
      alias: `${aliasPrefix}.${name}`,
      defaultText: texts[name],
      params: countParams(texts[name]),
    }));
}

function buildKeys(sources: TextSources): SmartRTranslationKey[] {
  return [
    ...entries(
      "resources.validationMessages",
      "validation",
      sources.validationMessages
    ),
    ...entries("resources.fileTexts", "file.texts", sources.fileTexts),
    {
      key: "behavior.file.filePlaceholderText",
      alias: "file.placeholder",
      defaultText: sources.filePlaceholderText,
      params: 0,
    },
    ...entries("components.select.texts", "select.texts", sources.selectTexts),
    ...entries("components.table.texts", "table.texts", sources.tableTexts),
  ];
}

/**
 * The translation keys of a configuration (its current texts as defaults).
 * Without an argument, the built-in (English) texts.
 */
export function getTranslationKeys(config?: SmartRConfig): SmartRTranslationKey[] {
  if (!config) return smartrTranslationKeys;
  return buildKeys({
    validationMessages: config.resources.validationMessages,
    fileTexts: config.resources.fileTexts,
    tableTexts: config.components.table.texts,
    selectTexts: config.components.select.texts,
    filePlaceholderText: config.behavior.file.filePlaceholderText,
  });
}

/** Every built-in translation key with its alias and default text. */
export const smartrTranslationKeys: SmartRTranslationKey[] = /*#__PURE__*/ buildKeys({
  validationMessages: sharedValidationMessages,
  fileTexts: sharedFileTexts,
  // English card-view group texts (the Bootstrap preset keeps the 1.1.0 ones)
  tableTexts: sharedTableTextsEnglish,
  selectTexts: sharedSelectTexts,
  filePlaceholderText: sharedBehavior.file.filePlaceholderText,
});

/** Flat dictionary: configuration-path key → default text. */
export const defaultTexts: Record<string, string> = /*#__PURE__*/ (() =>
  smartrTranslationKeys.reduce<Record<string, string>>((all, entry) => {
    all[entry.key] = entry.defaultText;
    return all;
  }, {}))();

/** Nested dictionary (`{ resources: { validationMessages: { … } } }`), e.g. for i18next JSON files. */
export const defaultTextsTree: Record<string, any> = /*#__PURE__*/ (() =>
  smartrTranslationKeys.reduce<Record<string, any>>((tree, entry) => {
    const parts = entry.key.split(".");
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      node = node[parts[i]] = node[parts[i]] || {};
    }
    node[parts[parts.length - 1]] = entry.defaultText;
    return tree;
  }, {}))();

/** Legacy short key → configuration-path key. */
export const translationKeyAliases: Record<string, string> = /*#__PURE__*/ (() =>
  smartrTranslationKeys.reduce<Record<string, string>>((all, entry) => {
    all[entry.alias] = entry.key;
    return all;
  }, {}))();
