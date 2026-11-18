// sharedConfig.ts - Framework-independent configuration values.
//
// Behavior, texts, validation messages, masks, tags and the Font Awesome icon
// names shared by every preset. This module intentionally contains NO
// framework class names (no Bootstrap classes), so that the separate
// `smartr-ui/presets/tailwind` bundle — which Tailwind scans for class names —
// does not pull Bootstrap classes in and generate stray utilities.
//
// The values are exactly those shipped with smartr-ui 1.1.0.

/** When the Editors validate (see `behavior.validation.validateMode`). */
export type SmartRValidateMode = "blur" | "change" | "submit" | "afterSubmit";

export const sharedBehavior = {
  /**
   * Emit state data-attributes (`data-invalid`, `data-disabled`,
   * `data-required`, `data-size`, `data-state`). Off for Bootstrap so the
   * markup stays identical to 1.1.0; on for the Tailwind/unstyled presets.
   */
  emitDataAttributes: false,
  /**
   * Skip icon slots (wrapper + icon) whose icon is empty (`""`, `null`,
   * `undefined`). `false` icons are always skipped. Off for Bootstrap (1.1.0
   * renders an empty `<i>` inside the wrapper); on for the Tailwind/unstyled presets.
   */
  hideEmptyIcons: false,
  /**
   * Apply instance classes (`className`, `classNames` slots) AFTER the
   * configured classes in every component, so a class merger (`twMerge`) lets
   * the instance win (`<Row className="gap-x-3">` over the preset `gap-x-4`).
   * Also implied by `mergeClasses`. Off for Bootstrap: the 1.1.0 token order
   * (instance `className` first in Row/Column/Editor/Tooltip/Table) is kept.
   */
  instanceClassesLast: false,
  accessibility: {
    /**
     * Emit ARIA wiring: an `id` + `role="alert"` (errors) / `role="status"`
     * on validation messages, an `id` on the note, `aria-describedby` on the
     * control, and labelled File buttons. `aria-invalid` is always emitted
     * (as in 1.1.0). Off for Bootstrap (markup unchanged); on for the
     * Tailwind / shadcn / unstyled presets.
     */
    aria: false,
  },
  validation: {
    validateOnBlur: true,
    validateOnSubmit: true,
    /**
     * When the Editors validate: `"blur"` | `"change"` | `"submit"` |
     * `"afterSubmit"` (no messages until the first `validate()` / Container
     * submit, then live re-validation on change and blur). `undefined` (the
     * default) keeps the 1.1.0 behavior driven by `validateOnBlur` /
     * `validateOnChange`. Explicit `validateOnBlur` / `validateOnChange` props
     * always win over the mode.
     */
    validateMode: undefined as SmartRValidateMode | undefined,
    /**
     * Built-in e-mail rule (used when no `validators.email` is configured):
     * `"legacy"` — the 1.1.0 ASCII regex, value not trimmed (Bootstrap);
     * `"unicode"` — trims and accepts IDN / unicode domains
     * (`josé@exämple.com.br`, `a@xn--bcher-kva.de`) (Tailwind / shadcn / unstyled).
     */
    emailRule: "legacy" as "legacy" | "unicode",
    /**
     * Include the external `errors` prop in `validate()` results (one
     * `ValidationResult` of type Error per message). Clear `errors` from the
     * parent (e.g. on change) so that a resubmission can pass.
     */
    includeExternalErrors: true,
  },
  input: {
    hasInputGroup: true,
    prependIconAfterInput: true,
    showPasswordIcon: true,
    thousandsSeparator: ".",
    decimalSeparator: ",",
    decimalPlaces: 2,
    /**
     * `mask=""` / `placeholder=""` turn the default phone mask / placeholder
     * off for that Editor (`false` always does). Off in Bootstrap, where an
     * empty string falls back to the default as in 1.1.0; on in the other presets.
     */
    emptyDisablesDefault: false,
    /**
     * Default phone country of `Input.Phone` / `Mobile` / `Fax`: `"US"`,
     * `"BR"`, `"BR-MOBILE"`, `"BR-LANDLINE"` or any key of
     * `resources.masks.phoneByCountry`. `undefined`: `resources.masks.phone`
     * (the 1.1.0 US mask).
     */
    phoneCountry: undefined as string | undefined,
  },
  file: {
    maxFiles: 10,
    maxFilesPlaceholder: 5,
    maxFileSize: 300, // in KB
    filePlaceholderText: "Select a file...",
  },
  select: {
    optionsId: "id",
    optionsDescription: "description",
    optionsToolTip: "tooltip",
    optionsGroup: "group",
    optionsNoneSelectedValue: "",
    optionsFirstSelected: false,

    optionsLimiteDescriptionSelected: 3,
    optionsMultipleSeparatorValue: ",",
    optionsMultipleSeparatorDescription: ", ",

    // Async select (loadOptions) defaults
    pageSize: 20,
    searchDebounceMs: 300,
    minSearchLength: 0,
    loadOnOpen: true,
    fastSearchMinSearchLength: 1,
    fastSearchLoadOnOpen: false,
  },
  internationalization: {
    translateToken: "SmartRTranslationKey",
    translateText: false,
  },
};

export const sharedTableBehavior = {
  timeZone: "UTC",
  culture: "en-US",
  sourceValueProperty: "id",
  sourceDescriptionProperty: "description",
  sourceBadgeProperty: "badge",
  pageSize: 10,
  pageSizes: [10, 25, 50, 100],
};

/** Table sort / pagination icons (Font Awesome names). */
export const sharedTableIcons = {
  sortAscending: "fas fa-sort-up",
  sortDescending: "fas fa-sort-down",
  sortDefault: "fas fa-sort",
  firstPage: "fas fa-angle-double-left",
  previousPage: "fas fa-angle-left",
  nextPage: "fas fa-angle-right",
  lastPage: "fas fa-angle-double-right",
};

export const sharedTableTexts = {
  showing: "Showing from",
  to: "to",
  of: "of",
  records: "records",
  firstPage: "Go to first page",
  previousPage: "Go to previous page",
  nextPage: "Go to next page",
  lastPage: "Go to last page",
  page: "Page",
  noRecordMessage: "No records to display.",
  loadingText: "Loading...",
  searchPlaceholder: "Search...",
  paginationText: "Showing {0} to {1} of {2} entries",

  selectAll: "Select All",
  selectRow: "Select",
  checkboxHeaderTitle: "Select all rows",
  checkboxCellTitle: "Select row",
  sortAscendingTitle: "Sort ascending",
  sortDescendingTitle: "Sort descending",
  sortDefaultTitle: "Clear sort",
  groupCountSingular: "record",
  groupCountPlural: "records",
  groupHeaderCountFormat: " ({count} {label})",
  groupFooterText: "Group total: {count} records",
  groupToggleExpandTitle: "Expand group",
  groupToggleCollapseTitle: "Collapse group",
  // Card view group texts. Kept as shipped in 1.1.0 (Portuguese) in the
  // Bootstrap preset, whose markup must not change; the other presets and the
  // translation keys use `englishCardGroupTexts` (below).
  cardGroupCountFormat: " ({count} registro{plural})",
  cardGroupFooterText: "Total do grupo: {count} registros",

  exportCsvFilename: "export.csv",
  exportNoRowsWarning: "No rows selected for export.",
  detailHeaderTitle: "Details",
  tableRoleDescription: "Data table",
  cardListRoleDescription: "Card list",
};

/** English card-view group texts (Tailwind / shadcn / unstyled presets, translation keys). */
export const englishCardGroupTexts = {
  cardGroupCountFormat: " ({count} {label})",
  cardGroupFooterText: "Group total: {count} records",
};

/** Table texts of the non-Bootstrap presets (English card-view group texts). */
// (pure-annotated so bundlers drop it when unused)
export const sharedTableTextsEnglish: typeof sharedTableTexts = /*#__PURE__*/ (() => ({
  ...sharedTableTexts,
  ...englishCardGroupTexts,
}))();

export const sharedSelectTexts = {
  filterPlaceholder: "type to search...",
  multipleSelectAll: "Select all",
  multipleSelectNone: "Select none",
  multipleSelected: "Selected",
  multipleNoneSelected: "None selected",
  optionsNoneSelectedText: "None selected",
  optionsNoGroup: "Others",
  loadingText: "Loading...",
  loadingMoreText: "Loading more...",
  noResultsText: "No results found",
  loadErrorText: "Failed to load options",
  retryText: "Retry",
  minSearchText: "Type at least %s1 characters to search",
};

export const sharedEditorPlaceHolders = {
  phone: "(000) 000-0000",
  /** Default placeholder per phone country (`phoneCountry` / `mask="phone-xx"`). */
  phoneByCountry: {
    US: "(000) 000-0000",
    BR: "(00) 00000-0000",
    "BR-MOBILE": "(00) 00000-0000",
    "BR-LANDLINE": "(00) 0000-0000",
  } as Record<string, string>,
};

export const sharedTooltipWidth: number = 250;
export const sharedAlertTextAlign: string = "center";

/** Global icons (Font Awesome names), except the tooltip icon (preset-specific). */
export const sharedIcons = {
  money: "fas fa-dollar-sign",
  percent: "fas fa-percent",
  date: "fas fa-calendar",
  dateTime: "fas fa-calendar-alt",
  month: "fas fa-calendar",
  week: "fas fa-calendar-week",
  email: "fas fa-envelope",
  phone: "fas fa-phone",
  mobile: "fas fa-mobile-alt",
  fax: "fas fa-fax",
  password: "fas fa-lock",
  time: "fas fa-clock",
  url: "fas fa-link",
  fastSearch: "fas fa-search",
  note: "fas fa-info",
};

/** Icons that follow the tooltip icon in the 1.1.0 key order. */
export const sharedTrailingIcons = {
  delete: "fas fa-trash",
  download: "fas fa-cloud-download-alt",
  upload: "fas fa-cloud-upload-alt",
  showPassword: "fas fa-eye",
  hidePassword: "fas fa-eye-slash",
};

export const sharedIconsPosition = {
  money: "start",
  percent: "start",
  date: "start",
  dateTime: "start",
  month: "start",
  week: "start",
  email: "start",
  phone: "start",
  mobile: "start",
  fax: "start",
  password: "start",
  time: "start",
  url: "start",
  fastSearch: "start",
  note: "start",
};

export const sharedValidationMessages = {
  minCharacter: "Please enter at least 1 character",
  minCharacters: "Please enter at least %s1 characters",
  maxCharacter: "Please enter at most 1 character",
  maxCharacters: "Please enter at most %s1 characters",
  minMaxCharacters: "This value must be between %s1 and %s2 characters long",
  minNumber: "The value must be greater than or equal to %s1",
  maxNumber: "The value must be less than or equal to %s1",
  minMaxNumber: "This number must be between %s1 and %s2",
  email: "Please enter a valid email address",
  required: "This field is required",
  date: "Please enter a valid date",
  number: "Please enter a valid number",
  /** Message of a `validators.phone` that returns `false`. */
  phone: "Please enter a valid phone number",
  /** Message of a `validators.url` that returns `false`. */
  url: "Please enter a valid URL",
  totalFilesAllowedExceeded: "Select at most %s1 files",
  fileSizeExceededMaxAllowed: "File %s1 exceeds the maximum allowed size of %s2",
};

export const sharedFileTexts = {
  downloadTooltip: "Click here to download the file",
  deleteTooltip: "Click here to delete the file",
  uploadTooltip: "Click here to choose a file",
  totalSelectedFiles: "Selected files",
  /** Accessible name / visible text of the File buttons (used when their icon is `false` or ARIA is on). */
  uploadLabel: "Choose file",
  deleteLabel: "Remove file",
  downloadLabel: "Download file",
};

/**
 * Phone masks per country. An array is a set of alternatives chosen by the
 * number of typed characters (the shortest that fits): `BR` uses the landline
 * `(00) 0000-0000` up to 10 digits and the mobile `(00) 00000-0000` from the
 * 11th. Pick one per Editor with `phoneCountry="BR"` or `mask="phone-br"`, or
 * globally with `behavior.input.phoneCountry`.
 */
export const phoneMasks: Record<string, string | string[]> = {
  US: "(000) 000-0000",
  BR: ["(00) 0000-0000", "(00) 00000-0000"],
  "BR-MOBILE": "(00) 00000-0000",
  "BR-LANDLINE": "(00) 0000-0000",
};

export const sharedMasks = {
  phone: "(000) 000-0000",
  phonePlaceholder: "(000) 000-0000",
  phoneByCountry: phoneMasks,
};

export const sharedTags = {
  columnTag: "div",
  invalidFeedbackTag: "div",
  editorButtonTag: "span",
  /** Element of the Editor note. `label` in Bootstrap (1.1.0 markup); `p` in the other presets. */
  noteTag: "label",
};
