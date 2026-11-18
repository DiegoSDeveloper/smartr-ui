/**
 * Tailwind CSS-grid column classes shared by the Tailwind and shadcn presets.
 * Pure data (no React, no Bootstrap classes): every class is written in full
 * so Tailwind's content scanner finds it.
 */
import type { GridColumnClassFn } from "../config/defaultConfig";

/** Literal lookup: screen → size → class. Keep every class written in full. */
export const tailwindGridColumns: Record<string, Record<string, string>> = {
  base: {
    "1": "col-span-1",
    "2": "col-span-2",
    "3": "col-span-3",
    "4": "col-span-4",
    "5": "col-span-5",
    "6": "col-span-6",
    "7": "col-span-7",
    "8": "col-span-8",
    "9": "col-span-9",
    "10": "col-span-10",
    "11": "col-span-11",
    "12": "col-span-12",
    auto: "col-auto",
  },
  sm: {
    "1": "sm:col-span-1",
    "2": "sm:col-span-2",
    "3": "sm:col-span-3",
    "4": "sm:col-span-4",
    "5": "sm:col-span-5",
    "6": "sm:col-span-6",
    "7": "sm:col-span-7",
    "8": "sm:col-span-8",
    "9": "sm:col-span-9",
    "10": "sm:col-span-10",
    "11": "sm:col-span-11",
    "12": "sm:col-span-12",
    auto: "sm:col-auto",
  },
  md: {
    "1": "md:col-span-1",
    "2": "md:col-span-2",
    "3": "md:col-span-3",
    "4": "md:col-span-4",
    "5": "md:col-span-5",
    "6": "md:col-span-6",
    "7": "md:col-span-7",
    "8": "md:col-span-8",
    "9": "md:col-span-9",
    "10": "md:col-span-10",
    "11": "md:col-span-11",
    "12": "md:col-span-12",
    auto: "md:col-auto",
  },
  lg: {
    "1": "lg:col-span-1",
    "2": "lg:col-span-2",
    "3": "lg:col-span-3",
    "4": "lg:col-span-4",
    "5": "lg:col-span-5",
    "6": "lg:col-span-6",
    "7": "lg:col-span-7",
    "8": "lg:col-span-8",
    "9": "lg:col-span-9",
    "10": "lg:col-span-10",
    "11": "lg:col-span-11",
    "12": "lg:col-span-12",
    auto: "lg:col-auto",
  },
  xl: {
    "1": "xl:col-span-1",
    "2": "xl:col-span-2",
    "3": "xl:col-span-3",
    "4": "xl:col-span-4",
    "5": "xl:col-span-5",
    "6": "xl:col-span-6",
    "7": "xl:col-span-7",
    "8": "xl:col-span-8",
    "9": "xl:col-span-9",
    "10": "xl:col-span-10",
    "11": "xl:col-span-11",
    "12": "xl:col-span-12",
    auto: "xl:col-auto",
  },
  xxl: {
    "1": "2xl:col-span-1",
    "2": "2xl:col-span-2",
    "3": "2xl:col-span-3",
    "4": "2xl:col-span-4",
    "5": "2xl:col-span-5",
    "6": "2xl:col-span-6",
    "7": "2xl:col-span-7",
    "8": "2xl:col-span-8",
    "9": "2xl:col-span-9",
    "10": "2xl:col-span-10",
    "11": "2xl:col-span-11",
    "12": "2xl:col-span-12",
    auto: "2xl:col-auto",
  },
};

/**
 * Column builder for the Tailwind grid. `xs` is treated as the base
 * (unprefixed) size; when both `size` and `xs` are set, `xs` takes precedence
 * (see `getGridColumnClasses`).
 */
export const tailwindColumnClass: GridColumnClassFn = (size, screen) => {
  if (!size) return null;
  const key = !screen || screen === "xs" ? "base" : String(screen);
  const map = tailwindGridColumns[key] || tailwindGridColumns.base;
  return map[size > 0 ? String(Math.min(size, 12)) : "auto"] ?? null;
};

/** Every class the Tailwind preset can generate at runtime (for `safelist`). */
export const tailwindSafelist: string[] = /*#__PURE__*/ (() =>
  Object.values(tailwindGridColumns).reduce<string[]>(
    (all, map) => all.concat(Object.values(map)),
    []
  ))();

