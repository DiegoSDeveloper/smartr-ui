/**
 * Framework-agnostic styling helpers shared by all components.
 *
 * Every helper is written so that, with the default (Bootstrap) configuration
 * and no per-instance overrides, the produced output is byte-for-byte the
 * same as smartr-ui 1.1.0.
 */
import React from "react";
import type { IconValue, SmartRConfig } from "../config/defaultConfig";
import { ColumnSize, ScreenSize } from "../types";
import { classNames, parameterizedString } from "./utils";
import { resolveTranslation } from "./translate";
export { resolveTranslation, translationKeyPath } from "./translate";

/**
 * Merges classes honoring `config.mergeClasses` (e.g. `twMerge`).
 * Without a custom merger it is exactly `classNames(...)` (1.1.0 behavior).
 * Arguments accept the same shapes as `classNames` (strings, arrays, objects).
 */
export function cx(config: SmartRConfig | undefined, ...args: any[]): string {
  const merge = config?.mergeClasses;
  if (!merge) return classNames(...args);
  const parts = args.map((a) => classNames(a)).filter(Boolean);
  return merge(...parts);
}

/**
 * Whether instance classes (`className`, `classNames` slots) go AFTER the
 * configured classes. True when a class merger is configured or the preset
 * sets `behavior.instanceClassesLast` (Tailwind / shadcn / unstyled).
 * False for Bootstrap without a merger, which keeps the 1.1.0 token order.
 */
export function instanceClassesLast(config: SmartRConfig | undefined): boolean {
  return !!config?.mergeClasses || !!(config?.behavior as any)?.instanceClassesLast;
}

/**
 * Merges an instance `className` with configured classes. Legacy (1.1.0)
 * order: `className` first; with `instanceClassesLast`: `className` last, so
 * a merger such as `twMerge` lets the instance win.
 */
export function cxInstance(
  config: SmartRConfig | undefined,
  className: any,
  ...configured: any[]
): string {
  return instanceClassesLast(config)
    ? cx(config, ...configured, className)
    : cx(config, className, ...configured);
}

/** ARIA wiring (`behavior.accessibility.aria`): off in Bootstrap, on in the other presets. */
export function ariaEnabled(config: SmartRConfig | undefined): boolean {
  return !!(config?.behavior as any)?.accessibility?.aria;
}

/**
 * Plain text of a React node (strings, numbers, arrays, elements' children),
 * used where a string is required (validation results, `getTitle()`,
 * `aria-label`). Strings are returned untouched.
 */
export function nodeToText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (React.isValidElement(node)) {
    return nodeToText((node.props as any)?.children);
  }
  return "";
}

/**
 * Appends a per-instance slot class to a configured class.
 * Returns `base` untouched when no slot class is given.
 */
export function withSlot(
  config: SmartRConfig | undefined,
  base: string | undefined | null,
  slot?: string
): any {
  if (!slot) return base;
  return cx(config, base, slot);
}

/**
 * For call sites that historically used template strings (and therefore may
 * contain extra spaces): keeps the legacy string unless a custom merger or a
 * slot override is in play.
 */
export function legacyClass(
  config: SmartRConfig | undefined,
  legacy: string,
  parts: any[],
  slot?: string
): string {
  if (!config?.mergeClasses && !slot) return legacy;
  return cx(config, ...parts, slot);
}

export interface DataState {
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: string;
  state?: string;
}

/**
 * State data-attributes (`data-invalid`, `data-disabled`, `data-required`,
 * `data-size`, `data-state`). Emitted only when
 * `config.behavior.emitDataAttributes` is true (false in the Bootstrap preset).
 * Boolean states are emitted only when true.
 */
export function dataAttrs(
  config: SmartRConfig | undefined,
  state: DataState
): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!config?.behavior?.emitDataAttributes) return attrs;
  if (state.invalid) attrs["data-invalid"] = "true";
  if (state.disabled) attrs["data-disabled"] = "true";
  if (state.required) attrs["data-required"] = "true";
  if (state.size) attrs["data-size"] = state.size;
  if (state.state) attrs["data-state"] = state.state;
  return attrs;
}

/**
 * Resolves a built-in text through `config.translate` (when configured) and
 * replaces `%s1`, `%s2`… placeholders with `params`.
 * Without `translate` and without params the fallback is returned untouched.
 */
export function translateText(
  config: SmartRConfig | undefined,
  key: string,
  fallback: any,
  ...params: any[]
): any {
  const text = resolveTranslation(
    config,
    key,
    fallback,
    params.length ? params : undefined
  );
  if (params.length) {
    return parameterizedString(text, ...params);
  }
  return text;
}

/**
 * Replaces the placeholders of a text template: `%s1`, `%s2`… (1-based) and
 * `{0}`, `{1}`… (0-based) with `params`, and `{name}` with `named[name]`.
 * Unknown placeholders are left as-is.
 */
export function formatTemplate(
  template: any,
  params: any[] = [],
  named: Record<string, any> = {}
): string {
  if (template === undefined || template === null) return "";
  return String(template)
    .replace(/%s([0-9]+)/g, (match, index) => {
      const value = params[Number(index) - 1];
      return value === undefined ? match : String(value);
    })
    .replace(/\{([A-Za-z0-9_]+)\}/g, (match, key) => {
      if (/^[0-9]+$/.test(key)) {
        const value = params[Number(key)];
        return value === undefined ? match : String(value);
      }
      return Object.prototype.hasOwnProperty.call(named, key) &&
        named[key] !== undefined
        ? String(named[key])
        : match;
    });
}

/**
 * A built-in text with placeholders (`{count}`, `{0}`, `%s1`…): translated
 * with `params` (`translate(key, fallback, params)`), then formatted.
 */
export function translateTemplate(
  config: SmartRConfig | undefined,
  key: string,
  fallback: any,
  params: any[],
  named: Record<string, any> = {}
): string {
  return formatTemplate(resolveTranslation(config, key, fallback, params), params, named);
}

function isComponentType(icon: any): boolean {
  if (typeof icon === "function") return true;
  return (
    typeof icon === "object" &&
    icon !== null &&
    !React.isValidElement(icon) &&
    typeof (icon as any).$$typeof === "symbol"
  );
}

/**
 * Renders a configured icon.
 * - string / undefined / null → `<i className={icon} />` (exactly as 1.1.0,
 *   where an explicit `null` rendered an empty `<i></i>`)
 * - React element → rendered as-is
 * - React component → `<Icon aria-hidden="true" />`
 * - `false` → nothing
 * `style` is applied to the `<i>` (or to a wrapping `<span>` for React icons).
 */
export function renderIcon(
  icon: IconValue | undefined,
  options: { style?: React.CSSProperties } = {}
): React.ReactNode {
  const { style } = options;
  if (icon === undefined || icon === null || typeof icon === "string") {
    return (
      <i className={(icon ?? undefined) as string | undefined} style={style}></i>
    );
  }
  if (icon === false) return null;

  let node: React.ReactNode = icon as React.ReactNode;
  if (isComponentType(icon)) {
    node = React.createElement(icon as React.ComponentType<any>, {
      "aria-hidden": true,
    });
  }
  if (style) {
    return <span style={style}>{node}</span>;
  }
  return node;
}

/** True when the icon is something that would render (used for optional icons). */
export function hasIconValue(icon: IconValue | undefined): boolean {
  return !!icon;
}

/**
 * Whether an icon *slot* (wrapper + icon) should be rendered at all.
 * - `false` never renders (explicit "no icon").
 * - With `behavior.hideEmptyIcons` (unstyled/Tailwind presets) empty values
 *   (`""`, `null`, `undefined`) are skipped too, so no empty wrappers are left.
 * - Otherwise (Bootstrap default) the slot is rendered as in 1.1.0.
 */
export function shouldRenderIconSlot(
  config: SmartRConfig | undefined,
  icon: IconValue | undefined
): boolean {
  if (icon === false) return false;
  if (config?.behavior?.hideEmptyIcons) return hasIconValue(icon);
  return true;
}

export interface ColumnSizes {
  size?: ColumnSize | null;
  xs?: ColumnSize | null;
  sm?: ColumnSize | null;
  md?: ColumnSize | null;
  lg?: ColumnSize | null;
  xl?: ColumnSize | null;
  xxl?: ColumnSize | null;
}

/**
 * Builds the grid column classes for the given sizes using `config.grid`.
 * Reproduces the exact 1.1.0 string (including its spacing) for Bootstrap.
 */
export function getGridColumnClasses(
  config: SmartRConfig,
  sizes: ColumnSizes
): string {
  const { size, xs, sm, md, lg, xl, xxl } = sizes;
  const grid = config.grid;
  const col = (value: number, screen?: ScreenSize) =>
    grid.column(value, screen) ?? "";

  let colClasses = "";
  if (!size && !xs && grid.columnDefault) {
    colClasses += grid.columnDefault;
  }
  // When the grid maps `xs` to the unprefixed (base) class — e.g. Tailwind,
  // where `xs` → `col-span-N` — `size` and `xs` would emit two conflicting
  // unprefixed classes: `xs` takes precedence. Bootstrap emits distinct
  // `col-N` / `col-xs-N` classes, so its 1.1.0 output is unchanged.
  const xsOverridesSize =
    !!size && !!xs && col(xs, ScreenSize.XS) === col(xs);
  if (xsOverridesSize) {
    colClasses += col(xs, ScreenSize.XS);
  } else {
    if (size) {
      colClasses += col(size);
    }
    if (xs) {
      colClasses += ` ${col(xs, ScreenSize.XS)}`;
    }
  }
  if (sm) {
    colClasses += ` ${col(sm, ScreenSize.SM)}`;
  }
  if (md) {
    colClasses += ` ${col(md, ScreenSize.MD)}`;
  }
  if (lg) {
    colClasses += ` ${col(lg, ScreenSize.LG)}`;
  }
  if (xl) {
    colClasses += ` ${col(xl, ScreenSize.XL)}`;
  }
  if (xxl) {
    colClasses += ` ${col(xxl, ScreenSize.XXL)}`;
  }
  return colClasses;
}
