/**
 * shadcn/ui (theme-token) Tailwind preset for smartr-ui.
 *
 * Same structure as `tailwindPreset`, but every color comes from the
 * shadcn/ui CSS-variable tokens (`bg-background`, `text-foreground`,
 * `border-input`, `ring-ring`, `ring-offset-background`,
 * `text-muted-foreground`, `text-destructive`, `bg-popover`, `bg-accent`,
 * `bg-primary`…) instead of a fixed palette, so light/dark mode (and any
 * shadcn theme) works with zero overrides. Control classes match shadcn's
 * `Input` / `Textarea` / `SelectTrigger` / `Label` / `Checkbox` defaults
 * (`h-10`, `rounded-md`, `text-base md:text-sm`).
 *
 * Requires Tailwind CSS >= 3.2 or v4 and the shadcn/ui theme variables
 * (`npx shadcn init` adds them).
 *
 * IMPORTANT — Tailwind content scanning: every class used by this preset is
 * written out in full in this file, and the built `dist/presets/shadcn.*`
 * files contain ONLY this preset's data (no Bootstrap classes), so scan it:
 *
 * ```js
 * // tailwind.config.js (Tailwind v3)
 * content: ["./src/**\/*.{ts,tsx}", "./node_modules/smartr-ui/dist/presets/shadcn.esm.js"]
 * ```
 * ```css
 * /* Tailwind v4 — path relative to this CSS file *\/
 * @source "../node_modules/smartr-ui/dist/presets/shadcn.esm.js";
 * ```
 * or use `shadcnSafelist` (grid classes are the only ones built at runtime).
 *
 * Icons: shadcn apps don't load Font Awesome, so the Editor icons are `false`
 * (no icon slots, no empty wrappers; File buttons show text, tooltips get an
 * accessible `?` trigger). Plug lucide-react icons through
 * `resources.icons` / `components.table.icons` (React components/elements).
 * The Table sort/pagination icons keep the Font Awesome names, as in
 * `tailwindPreset` — replace them with lucide icons too.
 */
// NOTE: only type imports from defaultConfig (erased at build time) — this
// module must not pull the Bootstrap configuration into the subpath bundle.
import type { SmartRConfig } from "../config/defaultConfig";
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
import {
  tailwindColumnClass,
  tailwindGridColumns,
  tailwindSafelist,
} from "./tailwindGrid";

export { tailwindColumnClass, tailwindGridColumns };

/** Every class the shadcn preset can generate at runtime (for `safelist`). */
export const shadcnSafelist: string[] = /*#__PURE__*/ (() => [...tailwindSafelist])();

// shadcn/ui <Input />
const input =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
// shadcn/ui <SelectTrigger /> (applied to the native <select> and the custom dropdown box)
const select =
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
// shadcn/ui <Textarea />
const textarea =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
// shadcn/ui <Label />
const label =
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
const iconBox =
  "flex h-10 items-center border border-input bg-muted px-3 text-sm text-muted-foreground";
const tooltip =
  "fixed z-50 max-w-xs overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md";

/** Editor icons are off (`false`): no Font Awesome in shadcn apps. */
const noEditorIcons = {
  money: false,
  percent: false,
  date: false,
  dateTime: false,
  month: false,
  week: false,
  email: false,
  phone: false,
  mobile: false,
  fax: false,
  password: false,
  time: false,
  url: false,
  fastSearch: false,
  note: false,
  tooltip: false,
  delete: false,
  download: false,
  upload: false,
  showPassword: false,
  hidePassword: false,
} as { [K in keyof typeof sharedIcons | keyof typeof sharedTrailingIcons | "tooltip"]: false };

/**
 * shadcn/ui preset: Bootstrap behavior/texts with shadcn theme-token classes.
 * Data-attributes, ARIA wiring and "instance classes last" are on.
 *
 * Tip: plug `tailwind-merge` (shadcn's `cn`) so instance classes win over
 * conflicting preset utilities: `createConfig(shadcnPreset, { mergeClasses: cn })`.
 * The invalid state uses the important modifier, so it wins without it.
 */
// (built in a pure-annotated function so bundlers drop it when unused)
export const shadcnPreset: SmartRConfig = /*#__PURE__*/ (() => ({
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
        badge:
          "inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground",
        container: "w-full",
        responsiveWrapper: "relative w-full overflow-auto",
        table:
          "w-full caption-bottom text-sm [&_tr]:border-b [&_tr]:border-border [&_th]:h-12 [&_th]:px-4 [&_th]:text-left [&_th]:align-middle [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:p-4 [&_td]:align-middle",
        tableHover: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/50",
        thead: "whitespace-nowrap",
        headerFilter: "cursor-pointer select-none",
        headerCheckbox: "w-10 text-center",
        cellCheckbox: "w-10 text-center",
        emptyMessage:
          "rounded-md border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground",
        emptyMessageCard:
          "my-3 rounded-md border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground",
        alignStart: "text-left",
        alignCenter: "text-center",
        alignEnd: "text-right",
        rowFooter: "bg-muted/50",
        rowFooterCell: "px-4 py-2",
        detailRow: "bg-muted/50",
        detailRowFooter: "bg-muted/50",
        detailRowFooterCell: "px-4 py-2",
        groupHeader: "px-4 py-2 font-medium",
        groupLevelPrefix: "",
        groupClickable: "cursor-pointer",
        groupExpanded: "",
        groupCollapsed: "",
        groupHeaderContent: "flex items-center",
        groupHeaderRow: "bg-muted/50",
        groupHeaderCell: "p-0",
        groupFooter: "px-4 py-2 text-sm text-muted-foreground",
        groupFooterRow: "",
        groupFooterCell: "p-0",
        cardList: "flex flex-col gap-3",
        card: "rounded-lg border bg-card p-4 text-card-foreground shadow-sm",
        groupHeaderCard: "font-medium",
        groupFooterCard: "text-sm text-muted-foreground",
        cardField: "grid grid-cols-12 gap-x-2 border-b border-border py-2 last:border-b-0",
        cardLabel: "col-span-4 text-muted-foreground",
        cardValue: "col-span-8",
        cardValueFull: "col-span-12",
        cardRowFooter: "pt-2",
        cardDetails: "mt-3 flex flex-col gap-2",
        detailCard: "rounded-md border bg-muted/50 p-2",
        cardRowDetailFooter: "pt-2",
        pagination: {
          container:
            "flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-muted-foreground",
          info: "",
          controls: "",
          pagination: "flex items-center gap-1",
          pageItem: "list-none",
          pageLink:
            "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-sm font-medium text-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          pageInfo: "px-2 font-medium text-foreground",
          pageIndicatorBadge: "",
          activePage: "border border-input bg-background",
          disabledPage: "pointer-events-none opacity-50",
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
        spinner: "animate-spin rounded-full border-4 border-muted border-t-primary",
        text: "text-sm text-muted-foreground",
      },
    },
    select: {
      classes: {
        container: "relative cursor-pointer",
        innerContainer: "group relative w-full",
        open: "is-open",
        groupHeader: "px-2 py-1.5 text-xs font-semibold text-muted-foreground",
        optionsContainer:
          "absolute left-0 top-full z-50 mt-1 hidden overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md group-[.is-open]:block",
        optionSelectedInput: "truncate",
        optionDisabled: "pointer-events-none opacity-50",
        dropdown: "max-h-60 overflow-y-auto p-1",
        option:
          "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        optionActive: "bg-accent text-accent-foreground",
        optionsMessage: "px-2 py-1.5 text-sm text-muted-foreground",
        optionsError: "text-destructive",
        optionsRetry: "ml-1 text-primary underline-offset-4 hover:underline",
        optionsSentinel: "h-px",
        searchInput:
          "m-1 flex h-9 w-[calc(100%-0.5rem)] rounded-md border border-input bg-background px-2 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selectAll: "block px-2 py-1.5 text-sm text-primary underline-offset-4 hover:underline",
      },
      texts: sharedSelectTexts,
    },
    editor: {
      classes: {
        // shadcn <FormItem>
        controlGroup: "space-y-2",
        // shadcn dims the control itself (disabled:opacity-50), not the group
        controlGroupDisabledControl: "",
        horizontalFormRow: "items-center",
        horizontalLabel: label,
        input,
        inputLabel: "block py-2 text-sm text-foreground",
        label,
        required: "after:ml-0.5 after:text-destructive after:content-['*']",
        titleBold: "font-semibold",
        inputGroup: "flex w-full items-stretch [&>input]:min-w-0 [&>input]:flex-1",
        inputGroupAppendFile: "flex",
        inputGroupAppendButton: "flex",
        inputGroupAppendIcon: "flex",
        inputGroupPrependIcon: "flex",
        inputGroupIcon: iconBox,
        inputGroupButton: `${iconBox} cursor-pointer gap-1 hover:bg-accent hover:text-accent-foreground`,
        inputGroupFileUploadIcon: `${iconBox} cursor-pointer hover:bg-accent hover:text-accent-foreground`,
        inputGroupFileDeleteIcon: `${iconBox} cursor-pointer hover:bg-accent hover:text-destructive`,
        inputGroupFileDownloadIcon: `${iconBox} cursor-pointer hover:bg-accent hover:text-accent-foreground`,
        inputGroupShowPasswordIcon: `${iconBox} cursor-pointer hover:bg-accent hover:text-accent-foreground`,
        // shadcn <FormDescription>
        labelNote: "text-sm text-muted-foreground",
        // Important modifier: wins over `border-input` / `focus-visible:ring-ring`
        // regardless of CSS order, so the invalid state works without tailwind-merge.
        invalid: "!border-destructive focus-visible:!ring-destructive focus:!ring-destructive",
        controlGroupInvalid: "",
        select,
        textarea,
        file: input,
        switchRow: "flex flex-row items-center justify-between gap-4 rounded-lg border p-4",
        switchText: "space-y-0.5",
      },
      placeHolders: sharedEditorPlaceHolders,
    },
    radio: {
      classes: {
        groupList: "grid gap-2",
        group: "flex items-center space-x-2",
        groupInLine: "mr-4 inline-flex items-center space-x-2",
        input:
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary accent-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        label,
        optionsGroup: "grid gap-2",
      },
    },
    checkbox: {
      classes: {
        group: "flex items-center space-x-2",
        input:
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary accent-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        label,
        // A native checkbox drawn as a shadcn <Switch> (or plug the Radix Switch via
        // `render.checkbox`): the checkbox is the track and a sibling <span> is the
        // thumb. No `::before` on the input, so it renders in every evergreen
        // browser, Firefox included (no pseudo-elements on form controls there).
        switchGroup: "relative inline-flex shrink-0 items-center",
        switch:
          "peer h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-transparent bg-input transition-colors checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        switchThumb:
          "pointer-events-none absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform peer-checked:translate-x-5",
      },
    },
    // Toggle chips (Input.Chips): a visually hidden checkbox + its label styled with `peer-*`
    chips: {
      classes: {
        group: "flex flex-wrap gap-2",
        item: "relative inline-flex",
        input: "peer sr-only",
        chip: "inline-flex cursor-pointer select-none items-center rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        chipChecked: "",
        chipDisabled: "",
      },
    },
    validation: {
      classes: {
        // shadcn <FormMessage>
        messageError: "text-sm font-medium text-destructive",
        messageSuccess: "text-sm font-medium text-green-700 dark:text-green-400",
        messageWarning: "text-sm font-medium text-amber-700 dark:text-amber-400",
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
          "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-input align-middle text-[10px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      },
    },
    alert: {
      textAlig: sharedAlertTextAlign,
      classes: {
        container: "relative w-full rounded-lg border p-4 text-sm",
        success: "border-green-600/50 text-green-700 dark:text-green-400",
        warning: "border-amber-500/50 text-amber-700 dark:text-amber-400",
        danger: "border-destructive/50 text-destructive",
        info: "bg-background text-foreground",
        textCenter: "text-center",
        textLeft: "text-left",
        textRight: "text-right",
      },
    },
  },
  resources: {
    icons: noEditorIcons,
    iconsPosition: sharedIconsPosition,
    validationMessages: sharedValidationMessages,
    fileTexts: sharedFileTexts,
    masks: sharedMasks,
  },
  tags: { ...sharedTags, noteTag: "p" },
  grid: {
    row: "grid grid-cols-12 gap-4",
    column: tailwindColumnClass,
    columnDefault: "col-span-12",
  },
}))();
