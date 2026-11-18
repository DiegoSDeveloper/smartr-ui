import { defaultConfig, SmartRConfig } from "../config/defaultConfig";
import { sharedTableTextsEnglish } from "../config/sharedConfig";

/** Recursively replaces every string of a `classes` map by "". */
function blankClasses<T>(classes: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(classes as any)) {
    if (typeof value === "string") {
      result[key] = "";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = blankClasses(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Recursively replaces every icon by `false` (render nothing). */
function noIcons<T>(icons: T): T {
  const result: any = {};
  for (const key of Object.keys(icons as any)) {
    result[key] = false;
  }
  return result;
}

function blankComponents(): any {
  const components: any = {};
  for (const [name, component] of Object.entries(defaultConfig.components)) {
    const copy: any = { ...(component as any) };
    if (copy.classes) copy.classes = blankClasses(copy.classes);
    if (copy.icons) copy.icons = noIcons(copy.icons);
    components[name] = copy;
  }
  // English card-view group texts (Bootstrap keeps the 1.1.0 ones)
  components.table = { ...components.table, texts: sharedTableTextsEnglish };
  return components;
}

/**
 * Unstyled preset — no classes at all (every class string is empty) and no
 * icons (no empty icon wrappers either; tooltips get a minimal accessible
 * `?` button trigger). Components expose their state through data-attributes instead
 * (`data-invalid`, `data-disabled`, `data-required`, `data-size`,
 * `data-state`), so you can style them with any CSS approach:
 *
 * ```css
 * [data-smarteditor][data-invalid] { border-color: red; }
 * ```
 */
// (built in a pure-annotated function so bundlers drop it when unused)
export const unstyledPreset: SmartRConfig = /*#__PURE__*/ (() => ({
  ...defaultConfig,
  behavior: {
    ...defaultConfig.behavior,
    emitDataAttributes: true,
    // no empty icon wrappers (every icon is `false`)
    hideEmptyIcons: true,
    instanceClassesLast: true,
    accessibility: { ...defaultConfig.behavior.accessibility, aria: true },
    // `mask=""` / `placeholder=""` turn the default phone mask/placeholder off
    input: { ...defaultConfig.behavior.input, emptyDisablesDefault: true },
    // trimmed, IDN-aware built-in e-mail rule
    validation: { ...defaultConfig.behavior.validation, emailRule: "unicode" as const },
  },
  tags: { ...defaultConfig.tags, noteTag: "p" },
  components: blankComponents(),
  resources: {
    ...defaultConfig.resources,
    icons: noIcons(defaultConfig.resources.icons),
  },
  grid: {
    row: "",
    column: () => "",
    columnDefault: "",
  },
}))();
