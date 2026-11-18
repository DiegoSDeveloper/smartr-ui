/**
 * Tailwind CSS preset for smartr-ui.
 *
 * Requires Tailwind CSS >= 3.2 (arbitrary variants such as `[&_td]:` and
 * `group-[.is-open]:`) or Tailwind v4.
 *
 * IMPORTANT — Tailwind content scanning:
 * every class used by this preset is written out in full in this file, and
 * the built `dist/presets/tailwind.*` files contain ONLY this preset's data
 * (no Bootstrap classes), so it is safe to let Tailwind scan them:
 *
 * ```js
 * // tailwind.config.js (Tailwind v3)
 * content: [
 *   "./src/**\/*.{js,jsx,ts,tsx}",
 *   "./node_modules/smartr-ui/dist/presets/tailwind.esm.js",
 * ]
 * ```
 * ```css
 * /* Tailwind v4 — path relative to this CSS file *\/
 * @import "tailwindcss";
 * @source "../node_modules/smartr-ui/dist/presets/tailwind.esm.js";
 * ```
 * or use the exported `tailwindSafelist` (grid classes are the only ones built
 * from a lookup at runtime).
 *
 * Breakpoint mapping (smartr-ui `ScreenSize` → Tailwind prefix):
 * - no screen / `xs` → no prefix (`col-span-N`); when both `size` and `xs`
 *   are given, `xs` wins (only its class is emitted)
 * - `sm`  → `sm:`  (Tailwind 640px,  Bootstrap 576px)
 * - `md`  → `md:`  (Tailwind 768px,  Bootstrap 768px)
 * - `lg`  → `lg:`  (Tailwind 1024px, Bootstrap 992px)
 * - `xl`  → `xl:`  (Tailwind 1280px, Bootstrap 1200px)
 * - `xxl` → `2xl:` (Tailwind 1536px, Bootstrap 1400px)
 * A negative size (Bootstrap `auto`) maps to `col-auto` / `{prefix}:col-auto`.
 */
// NOTE: only type imports from defaultConfig (erased at build time) — this
// module must not pull the Bootstrap configuration into the subpath bundle.
import type { SmartRConfig } from "../config/defaultConfig";
import {
  tailwindColumnClass,
  tailwindGridColumns,
  tailwindSafelist,
} from "./tailwindGrid";
import {
  sharedAlertTextAlign,
  sharedBehavior,
  sharedEditorPlaceHolders,
  sharedFileTexts,
  sharedIcons,
  sharedIconsPosition,
  sharedMasks,
  sharedSelectTexts,
  sharedTableBehavior,
  sharedTableIcons,
  sharedTableTextsEnglish,
  sharedTags,
  sharedTooltipWidth,
  sharedTrailingIcons,
  sharedValidationMessages,
} from "../config/sharedConfig";

export { tailwindColumnClass, tailwindGridColumns, tailwindSafelist };

const input =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100";
const iconBox =
  "flex h-full items-center border border-gray-300 bg-gray-50 px-3 text-sm text-gray-500";
const tooltip =
  "fixed z-50 max-w-xs rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg";

/**
 * Tailwind preset: Bootstrap behavior/texts with Tailwind utility classes.
 * Data-attributes are enabled, so `data-[invalid=true]:` / `data-[state=open]:`
 * variants can be used in overrides.
 *
 * The invalid state uses the important modifier (`!border-red-500`…), so it
 * wins over the normal border/ring colors even without `tailwind-merge`.
 *
 * Tip: plug `tailwind-merge` so per-instance `classNames` win over the preset:
 * `createConfig(tailwindPreset, { mergeClasses: twMerge })`.
 */
// (built in a pure-annotated function so bundlers drop it when unused)
export const tailwindPreset: SmartRConfig = /*#__PURE__*/ (() => ({
  behavior: {
    ...sharedBehavior,
    emitDataAttributes: true,
    hideEmptyIcons: true,
    instanceClassesLast: true,
    accessibility: { ...sharedBehavior.accessibility, aria: true },
    // `mask=""` / `placeholder=""` turn the default phone mask/placeholder off
    input: { ...sharedBehavior.input, emptyDisablesDefault: true },
    // trimmed, IDN-aware built-in e-mail rule
    validation: { ...sharedBehavior.validation, emailRule: "unicode" as const },
  },
  components: {
    table: {
      behavior: sharedTableBehavior,
      classes: {
        badge: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        container: "w-full",
        responsiveWrapper: "w-full overflow-x-auto",
        table:
          "min-w-full border-collapse border border-gray-200 text-left text-sm [&_td]:border-b [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold",
        tableHover: "[&_tbody_tr:hover]:bg-gray-50",
        thead: "whitespace-nowrap bg-gray-50 text-gray-700",
        headerFilter: "cursor-pointer select-none",
        headerCheckbox: "w-10 text-center",
        cellCheckbox: "w-10 text-center",
        emptyMessage:
          "rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-800",
        emptyMessageCard:
          "my-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-800",
        alignStart: "text-left",
        alignCenter: "text-center",
        alignEnd: "text-right",
        rowFooter: "bg-gray-50",
        rowFooterCell: "px-3 py-2",
        detailRow: "bg-gray-50",
        detailRowFooter: "bg-gray-50",
        detailRowFooterCell: "px-3 py-2",
        groupHeader: "px-3 py-2",
        groupLevelPrefix: "",
        groupClickable: "cursor-pointer",
        groupExpanded: "",
        groupCollapsed: "",
        groupHeaderContent: "flex items-center",
        groupHeaderRow: "",
        groupHeaderCell: "p-0",
        groupFooter: "px-3 py-2 text-sm text-gray-600",
        groupFooterRow: "",
        groupFooterCell: "p-0",
        cardList: "flex flex-col gap-3",
        card: "rounded-lg border border-gray-200 bg-white p-3 shadow-sm",
        groupHeaderCard: "",
        groupFooterCard: "",
        cardField: "grid grid-cols-12 gap-x-2 border-b border-gray-100 py-2 last:border-b-0",
        cardLabel: "col-span-4",
        cardValue: "col-span-8",
        cardValueFull: "col-span-12",
        cardRowFooter: "pt-2",
        cardDetails: "mt-3 flex flex-col gap-2",
        detailCard: "rounded-md border border-gray-200 bg-gray-50 p-2",
        cardRowDetailFooter: "pt-2",
        pagination: {
          container: "flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-gray-700",
          info: "",
          controls: "",
          pagination: "flex items-center gap-1",
          pageItem: "list-none",
          // `min-w-[2rem]` (not `min-w-8`, which needs Tailwind 3.4)
          pageLink:
            "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-gray-700 hover:bg-gray-100",
          pageInfo: "px-2 font-semibold text-gray-900",
          pageIndicatorBadge: "",
          activePage: "font-semibold text-blue-600",
          disabledPage: "pointer-events-none opacity-40",
        },
      },
      icons: {
        ...sharedTableIcons,
        groupExpanded: "fas mr-2 fa-chevron-down",
        groupCollapsed: "fas mr-2 fa-chevron-right",
      },
      texts: sharedTableTextsEnglish,
    },
    loading: {
      classes: {
        container: "flex flex-col items-center justify-center gap-2 p-4",
        containerSm: "[&>div:first-child]:h-4 [&>div:first-child]:w-4",
        containerMd: "[&>div:first-child]:h-8 [&>div:first-child]:w-8",
        containerLg: "[&>div:first-child]:h-12 [&>div:first-child]:w-12",
        spinner: "animate-spin rounded-full border-4 border-gray-200 border-t-blue-600",
        text: "text-sm text-gray-500",
      },
    },
    select: {
      classes: {
        container: "relative cursor-pointer",
        innerContainer: "group relative",
        open: "is-open",
        groupHeader: "px-3 py-1 text-xs font-semibold uppercase text-gray-500",
        optionsContainer:
          "absolute left-0 top-full z-50 mt-1 hidden rounded-md border border-gray-200 bg-white shadow-lg group-[.is-open]:block",
        optionSelectedInput: "truncate",
        optionDisabled: "cursor-not-allowed opacity-50",
        dropdown: "max-h-60 overflow-y-auto py-1",
        option: "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100",
        optionActive: "bg-gray-100",
        optionsMessage: "px-3 py-2 text-sm text-gray-500",
        optionsError: "text-red-600",
        optionsRetry: "ml-1 text-blue-600 underline",
        optionsSentinel: "h-px",
        searchInput:
          "m-2 block w-[calc(100%-1rem)] rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none",
        selectAll: "block px-3 py-2 text-sm text-blue-600 hover:underline",
      },
      texts: sharedSelectTexts,
    },
    editor: {
      classes: {
        controlGroup: "flex flex-col gap-1",
        controlGroupDisabledControl: "opacity-60",
        horizontalFormRow: "mb-1 items-center",
        horizontalLabel: "text-sm font-medium text-gray-700",
        input,
        inputLabel: "block py-2 text-sm text-gray-900",
        label: "block text-sm font-medium text-gray-700",
        required: "after:ml-0.5 after:text-red-600 after:content-['*']",
        titleBold: "font-bold",
        inputGroup: "flex w-full items-stretch [&>input]:min-w-0 [&>input]:flex-1",
        inputGroupAppendFile: "flex cursor-pointer",
        inputGroupAppendButton: "flex",
        inputGroupAppendIcon: "flex",
        inputGroupPrependIcon: "flex",
        inputGroupIcon: iconBox,
        inputGroupButton:
          "flex h-full cursor-pointer items-center gap-1 border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 hover:bg-gray-100",
        inputGroupFileUploadIcon: `${iconBox} hover:bg-gray-100`,
        inputGroupFileDeleteIcon: `${iconBox} hover:bg-gray-100 hover:text-red-600`,
        inputGroupFileDownloadIcon: `${iconBox} hover:bg-gray-100`,
        inputGroupShowPasswordIcon: `${iconBox} cursor-pointer hover:bg-gray-100`,
        labelNote: "text-xs text-gray-500",
        // Important modifier: wins over `border-gray-300` / `focus:border-blue-500`
        // / `focus:ring-blue-500/20` of `input` regardless of CSS order, so the
        // invalid state works without tailwind-merge.
        invalid: "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20",
        controlGroupInvalid: "",
        select: undefined,
        textarea: undefined,
        file: undefined,
        switchRow: "flex items-start justify-between gap-4",
        switchText: "flex flex-1 flex-col gap-1",
      },
      placeHolders: sharedEditorPlaceHolders,
    },
    radio: {
      classes: {
        groupList: "flex flex-col gap-2",
        group: "flex items-center gap-2",
        groupInLine: "mr-4 inline-flex items-center gap-2",
        input: "h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500",
        label: "text-sm text-gray-700",
        optionsGroup: "flex flex-col gap-2",
      },
    },
    checkbox: {
      classes: {
        group: "flex items-center gap-2",
        input: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
        label: "text-sm text-gray-700",
        switchGroup: "flex items-center",
        switch: undefined,
        switchThumb: "",
      },
    },
    chips: {
      classes: {
        group: "flex flex-wrap gap-2",
        item: "relative inline-flex",
        input: "peer sr-only",
        chip: "inline-flex cursor-pointer select-none items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        chipChecked: "",
        chipDisabled: "",
      },
    },
    validation: {
      classes: {
        messageError: "text-xs text-red-600",
        messageSuccess: "text-xs text-green-600",
        messageWarning: "text-xs text-amber-600",
        formMessage: "",
      },
    },
    tooltip: {
      width: sharedTooltipWidth,
      classes: {
        top: tooltip,
        bottom: tooltip,
        left: tooltip,
        right: tooltip,
        overlay: "",
        trigger:
          "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] leading-none text-gray-500 hover:bg-gray-100",
      },
    },
    alert: {
      textAlig: sharedAlertTextAlign,
      classes: {
        container: "rounded-md border px-4 py-3 text-sm",
        success: "border-green-200 bg-green-50 text-green-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        danger: "border-red-200 bg-red-50 text-red-800",
        info: "border-blue-200 bg-blue-50 text-blue-800",
        textCenter: "text-center",
        textLeft: "text-left",
        textRight: "text-right",
      },
    },
  },
  resources: {
    icons: {
      ...sharedIcons,
      tooltip: "fas fa-info-circle ml-1 cursor-help text-gray-400",
      ...sharedTrailingIcons,
    },
    iconsPosition: sharedIconsPosition,
    validationMessages: sharedValidationMessages,
    fileTexts: sharedFileTexts,
    masks: sharedMasks,
  },
  tags: { ...sharedTags, noteTag: "p" },
  grid: {
    row: "grid grid-cols-12 gap-x-4 gap-y-3",
    column: tailwindColumnClass,
    columnDefault: "col-span-12",
  },
}))();
