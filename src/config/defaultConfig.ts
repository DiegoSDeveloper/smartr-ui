// defaultConfig.ts - Default (Bootstrap 5) configuration.
//
// The values below are exactly the values shipped with smartr-ui 1.1.0, plus the
// new keys listed in the CHANGELOG (whose defaults reproduce the 1.1.0 output).
// This object is also exported as `bootstrapPreset`.
import type { ComponentType, CSSProperties, InputHTMLAttributes, ReactNode, Ref } from "react";
import type { Input, ScreenSize } from "../types";
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
  sharedTableTexts,
  sharedTags,
  sharedTooltipWidth,
  sharedTrailingIcons,
  sharedValidationMessages,
} from "./sharedConfig";

// ============================================================================
// PUBLIC CONFIG TYPES
// ============================================================================

/**
 * An icon can be:
 * - a `string`: rendered as `<i className={icon}></i>` (Font Awesome style, 1.1.0 behavior)
 * - a React node (e.g. `<Mail size={16} />`): rendered as-is
 * - a React component (e.g. `Mail` from lucide-react): rendered as `<Mail aria-hidden />`
 * - `false`: nothing is rendered
 * - `null` / `undefined`: an empty `<i></i>` (as in 1.1.0)
 */
export type IconValue = string | ReactNode | ComponentType<any>;

/** Builds the class of a grid column. `screen` is undefined for the unprefixed size. */
export type GridColumnClassFn = (
  size: number,
  screen?: ScreenSize
) => string | null | undefined;

export interface SmartRGridConfig {
  /** Classes of `<Row>` (Bootstrap: `"row"`). */
  row: string;
  /** Column class builder (Bootstrap: `col-{n}` / `col-{screen}-{n}` / `auto`). */
  column: GridColumnClassFn;
  /**
   * Class applied to a column that has no unprefixed size (`size`/`xs`).
   * Empty in Bootstrap (a `.row > *` is already full width); `col-span-12` in Tailwind.
   */
  columnDefault?: string;
}

/** Pluggable class merger, e.g. `twMerge` from `tailwind-merge`. */
export type MergeClassesFn = (...classes: string[]) => string;

/**
 * Translation hook used for every built-in text and validation message.
 * - `key`: the text's configuration path, e.g. `"resources.validationMessages.required"`
 *   or `"components.table.texts.showing"`. When the result is missing (nothing,
 *   the key itself or the fallback) it is called again with the short alias
 *   (`"validation.required"`, `"table.texts.showing"`). Full list: `smartrTranslationKeys`.
 * - `fallback`: the configured text (may contain `%s1`, `%s2`… placeholders)
 * - `params`: placeholder values, when the text has any
 * The returned string may keep the `%sN` placeholders; they are replaced afterwards.
 */
export type TranslateFn = (
  key: string,
  fallback: string,
  params?: any[]
) => string;

/**
 * Props passed to a custom control rendered through a render slot
 * (`<Editor render={{ input: MyInput }} />` or `config.render.input`).
 *
 * The component MUST forward `ref` to the native element (or to an object
 * exposing `value` / `checked` / `files`), because the Editor reads the
 * current value from it on validation.
 *
 * Checkbox slot: non-native checkboxes (e.g. Radix/shadcn `Checkbox`, whose
 * `onCheckedChange` passes a boolean) are supported. `onChange` may be called
 * with a boolean (`onCheckedChange={props.onChange}`), with
 * `{ target: { checked } }` (no `type` needed) or with a native change event.
 * On validation the value is read from `ref.current.checked` (any object that
 * exposes `checked`), then from its `aria-checked` attribute, then from the
 * last value reported through `onChange`.
 */
/**
 * One option of the `select` render slot (`SmartRControlProps.options`).
 * Built by the Editor from `options` + `optionsId` / `optionsDescription` /
 * `optionsGroup` / `optionsToolTip` / `optionGetDescription`, in display order.
 */
export interface SmartRSelectOption {
  /**
   * The option value as configured (not stringified). For the "none selected"
   * option it is `optionsNoneSelectedValue` (`""` by default) — note that
   * Radix/shadcn `<SelectItem>` forbids `""`: map it to a sentinel.
   */
  value: any;
  /** Display text (`optionGetDescription(option)` or `option[optionsDescription]`). */
  label: any;
  /** `option.disabled`, when the source object has it. */
  disabled?: boolean;
  /** `option[optionsGroup]`, when present. */
  group?: string;
  /** `option[optionsToolTip]`, when present. */
  tooltip?: string;
  /** True for the "none selected" option added when `optionsFirstSelected` is false. */
  none?: boolean;
  /** The source item from `options`. */
  source?: any;
}

/**
 * HTML attributes the Editor may pass to a custom control besides the
 * documented ones (`min`, `max`, `maxLength`, `tabIndex`, `autoFocus`,
 * `autoComplete`, `accept`, `step`, `aria-*`, event handlers…).
 */
type SmartRControlHTMLAttributes = Omit<
  InputHTMLAttributes<HTMLElement>,
  | "type"
  | "id"
  | "name"
  | "value"
  | "checked"
  | "onChange"
  | "onBlur"
  | "onKeyDown"
  | "onPaste"
  | "disabled"
  | "readOnly"
  | "required"
  | "placeholder"
  | "aria-invalid"
  | "aria-describedby"
  | "className"
  | "style"
  | "children"
  | "multiple"
>;

/**
 * Props of a custom control rendered through a render slot. No string index
 * signature (only `data-*`), so `React.forwardRef<HTMLInputElement,
 * SmartRControlProps>` keeps every prop typed.
 */
export interface SmartRControlProps extends SmartRControlHTMLAttributes {
  /** Native `type` attribute (`text`, `email`, `checkbox`…). Undefined for select/textarea. */
  type?: string;
  id?: string;
  name?: string;
  value?: any;
  checked?: boolean;
  /**
   * Call with a change event (or an object shaped like
   * `{ target: { name, value, checked, files } }`). For the checkbox slot it
   * may also be called with a boolean (`checked`), e.g. from `onCheckedChange`.
   */
  onChange?: (eventOrChecked: any) => void;
  /** Call with a blur event (or an object shaped like `{ target: { name, value } }`). */
  onBlur?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onPaste?: (event: any) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean | "true" | "false";
  /** Already merged classes (config + per-instance overrides). */
  className?: string;
  style?: CSSProperties;
  /** `Input.LongText`: number of rows. */
  rows?: number | string;
  /** `<option>`/`<optgroup>` elements for a native select. */
  children?: ReactNode;
  /**
   * Select slot only: the options as data, in display order (including the
   * "none selected" option, flagged `none: true`, when `optionsFirstSelected`
   * is false). Use it instead of parsing `children`.
   */
  options?: SmartRSelectOption[];
  /** Select slot only: always `false` (multiple selects use the built-in dropdown). */
  multiple?: boolean;
  /**
   * Select slot only: the "none selected" option (`{ value, label }`), or
   * `null` when `optionsFirstSelected` is set (no empty choice).
   */
  noneOption?: { value: any; label: any } | null;
  /** Ids of the note / validation messages describing the control (ARIA mode). */
  "aria-describedby"?: string;
  /** Semantic state, handy for styling custom controls. */
  invalid?: boolean;
  /** State / marker attributes (`data-smarteditor`, `data-invalid`, `data-mask`…). */
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * `SmartRControlProps` plus the `ref` prop, for React 19 components that take
 * `ref` as a regular prop: `function MyInput({ ref, ...props }: SmartRControlPropsWithRef<HTMLInputElement>)`.
 */
export type SmartRControlPropsWithRef<T = unknown> = SmartRControlProps & { ref?: Ref<T> };

export type SmartRControlComponent = ComponentType<SmartRControlProps & { ref?: any }>;

/** Context passed to a validator. */
export interface SmartRValidatorContext {
  /** The Editor's `Input` type. */
  type: Input;
  id?: string;
  name?: string;
  /** Plain-text title of the Editor. */
  title?: string;
  /** The effective configuration. */
  config: SmartRConfig;
}

/**
 * A pluggable validation rule. Return `true` (or `undefined` / `null`) when
 * the value is valid, `false` to fail with the default message, or a string
 * to fail with that message.
 */
export type SmartRValidator = (
  value: any,
  context: SmartRValidatorContext
) => boolean | string | null | undefined | void;

/**
 * Pluggable rules (`config.validators`, overridden per Editor by the
 * `validators` prop). A rule set to `false` is turned off (no built-in rule
 * either); `undefined` / `null` keeps the built-in rule.
 * - `required`: runs for `required` Editors (instead of the "empty value" check)
 * - `email`: `Input.Email` values (instead of the built-in e-mail regex)
 * - `phone`: `Input.Phone` / `Mobile` / `Fax` values (unmasked; no built-in rule)
 * - `url`: `Input.Url` values (no built-in rule)
 * Non-empty values only, except `required`.
 */
export interface SmartRValidators {
  required?: SmartRValidator | false | null;
  email?: SmartRValidator | false | null;
  phone?: SmartRValidator | false | null;
  url?: SmartRValidator | false | null;
}

export interface SmartRRenderSlots {
  input?: SmartRControlComponent;
  select?: SmartRControlComponent;
  textarea?: SmartRControlComponent;
  checkbox?: SmartRControlComponent;
}

/**
 * Bootstrap column builder — identical to the 1.1.0 `getColumnSize` output.
 */
export const bootstrapColumnClass: GridColumnClassFn = (size, screen) => {
  let className = null;
  if (size) {
    if (screen) {
      className = `col-${screen}-${size > 0 ? size : "auto"}`;
    } else {
      className = `col-${size > 0 ? size : "auto"}`;
    }
  }
  return className;
};

// ============================================================================
// DEFAULT VALUES (Bootstrap)
// ============================================================================
// Framework-independent values (behavior, texts, messages, Font Awesome icon
// names…) live in `sharedConfig.ts`; this object adds the Bootstrap classes.
// The resulting values (and key order) are exactly those of smartr-ui 1.1.0.
const rawDefaultConfig = {
  // ============================================================================
  // CORE BEHAVIOR CONFIGURATION
  // ============================================================================
  behavior: sharedBehavior,

  // ============================================================================
  // COMPONENT-SPECIFIC CONFIGURATION
  // ============================================================================
  components: {
    // TABLE COMPONENT
    table: {
      behavior: sharedTableBehavior,

      classes: {
        badge: "badge bg-link rounded-pill font-size-12",
        // Structure
        container: "smart-table-container",
        responsiveWrapper: "table-responsive react-table",
        table: "table table-bordered",
        tableHover: "table-hover",
        thead: "table-light table-nowrap",
        headerFilter: "header-filter",
        headerCheckbox: "header-checkbox text-center",
        cellCheckbox: "cell-checkbox text-center",
        emptyMessage: "alert alert-info text-center",
        emptyMessageCard: "alert alert-info text-center my-3",
        // Alignment (AlignType)
        alignStart: "text-start",
        alignCenter: "text-center",
        alignEnd: "text-end",
        // Row footers / details
        rowFooter: "tr-row-footer",
        rowFooterCell: "td-row-footer",
        detailRow: "tr-detail",
        detailRowFooter: "tr-row-detail-footer",
        detailRowFooterCell: "td-row-detail-footer",
        // Grouping
        groupHeader: "group-header",
        groupLevelPrefix: "group-level-",
        groupClickable: "cursor-pointer",
        groupExpanded: "group-expanded",
        groupCollapsed: "group-collapsed",
        groupHeaderContent: "d-flex align-items-center",
        groupHeaderRow: "group-header-row",
        groupHeaderCell: "group-header-cell p-0",
        groupFooter: "group-footer",
        groupFooterRow: "group-footer-row",
        groupFooterCell: "group-footer-cell p-0",
        // Card view
        cardList: "card-list",
        card: "card mb-3 p-3 shadow-sm",
        groupHeaderCard: "group-header-card",
        groupFooterCard: "group-footer-card",
        cardField: "row gx-2 border-bottom py-2",
        cardLabel: "col-4",
        cardValue: "col-8",
        cardValueFull: "col-12",
        cardRowFooter: "card-row-footer pt-2",
        cardDetails: "mt-3",
        detailCard: "card mb-2 p-2 bg-light-subtle",
        cardRowDetailFooter: "card-row-detail-footer pt-2",
        // Table Pagination specific classes
        pagination: {
          container:
            "table-pagination d-flex justify-content-between align-items-center flex-wrap",
          info: "pagination-info",
          controls: "pagination-controls",
          pagination: "pagination pagination-rounded mb-sm-0 mb-0",
          pageItem: "page-item",
          pageLink: "page-link",
          pageInfo: "page-info bg-transparent border-0 text-dark fw-semibold",
          pageIndicatorBadge: "page-indicator-badge",
          activePage: "active",
          disabledPage: "disabled",
        },
      },

      icons: {
        ...sharedTableIcons,
        groupExpanded: "fas me-2 transition-all fa-chevron-down",
        groupCollapsed: "fas me-2 transition-all fa-chevron-right",
      },

      texts: sharedTableTexts,
    },

    // LOADING COMPONENT
    loading: {
      classes: {
        container: "smart-loading",
        containerSm: "smart-loading-sm",
        containerMd: "smart-loading-md",
        containerLg: "smart-loading-lg",
        spinner: "smart-loading-spinner",
        text: "smart-loading-text",
      },
    },

    // SELECT COMPONENT
    select: {
      classes: {
        container: "select-filter form-control",
        innerContainer: "select-box",
        open: "open",
        groupHeader: "group-header",
        optionsContainer: "options-container",
        optionSelectedInput: "options-selected-input",
        optionDisabled: "option-disabled",
        dropdown: "options",
        option: "option",
        optionActive: "option-active",
        optionsMessage: "options-message",
        optionsError: "options-error",
        optionsRetry: "options-retry",
        optionsSentinel: "options-sentinel",
        searchInput: "search-input",
        selectAll: "options-select-label",
      },
      texts: sharedSelectTexts,
    },

    // EDITOR COMPONENT (Main form component)
    editor: {
      classes: {
        controlGroup: "form-group",
        controlGroupDisabledControl: "disabled",
        horizontalFormRow: "mb-1",
        horizontalLabel: "col-form-label",
        input: "form-control",
        inputLabel: "form-control-plaintext",
        label: "form-label float-label",
        required: "required",
        titleBold: "title-bold",
        inputGroup: "input-group",
        inputGroupAppendFile: "input-group-append file",
        inputGroupAppendButton: "input-group-append button",
        inputGroupAppendIcon: "input-group-append",
        inputGroupPrependIcon: "input-group-prepend",
        inputGroupIcon: "input-group-text inside-input",
        inputGroupButton: "input-group-text",
        inputGroupFileUploadIcon: "input-group-text upload",
        inputGroupFileDeleteIcon: "input-group-text delete",
        inputGroupFileDownloadIcon: "input-group-text download",
        inputGroupShowPasswordIcon:
          "input-group-text inside-input show-password",
        labelNote: "form-text text-muted note",
        invalid: "is-invalid",
        /** Invalid class of the control group. Falls back to `invalid` when undefined (1.1.0 behavior). */
        controlGroupInvalid: undefined as string | undefined,
        /** Class of `Input.Select` controls. Falls back to `input` when undefined (1.1.0 behavior). */
        select: undefined as string | undefined,
        /** Class of `Input.LongText` controls. Falls back to `input` when undefined (1.1.0 behavior). */
        textarea: undefined as string | undefined,
        /** Class of the `Input.File` text box. Falls back to `input` when undefined (1.1.0 behavior). */
        file: undefined as string | undefined,
        /** `layout="switch"`: row holding the text block (label + note) and the control. */
        switchRow: "d-flex justify-content-between align-items-start gap-3",
        /** `layout="switch"`: text block (label + note) on the left. */
        switchText: "flex-grow-1",
      },
      placeHolders: sharedEditorPlaceHolders,
    },

    // RADIO & CHECKBOX COMPONENTS
    radio: {
      classes: {
        groupList: "radio-group",
        group: "form-check",
        groupInLine: "form-check form-check-inline",
        input: "form-check-input",
        label: "form-check-label",
        optionsGroup: "radio-options-group",
      },
    },

    checkbox: {
      classes: {
        group: "form-check",
        input: "form-check-input",
        label: "form-check-label",
        /** `layout="switch"`: wrapper of the control. */
        switchGroup: "form-check form-switch",
        /** `layout="switch"`: class of the checkbox. Falls back to `input` when undefined. */
        switch: undefined as string | undefined,
        /**
         * `layout="switch"`: when set, a `<span aria-hidden>` thumb is rendered
         * right after the native checkbox (draw it with `peer-checked:`). Empty:
         * no thumb (Bootstrap's `form-switch` draws its own).
         */
        switchThumb: "",
      },
    },

    // CHIPS (Input.Chips: multi-select as toggle chips, checkbox semantics)
    chips: {
      classes: {
        /** `role="group"` wrapper of the chips. */
        group: "d-flex flex-wrap gap-2",
        /** Wrapper of one chip (its checkbox + label). */
        item: "",
        /** The (visually hidden) native checkbox. */
        input: "btn-check",
        /** The chip itself (the checkbox label). */
        chip: "btn btn-sm btn-outline-primary rounded-pill",
        /** Added to a selected chip. */
        chipChecked: "",
        /** Added to a disabled chip. */
        chipDisabled: "",
      },
    },

    // VALIDATION COMPONENTS
    validation: {
      classes: {
        messageError: "error-validation-message",
        messageSuccess: "success-validation-message",
        messageWarning: "warning-validation-message",
        /** Extra class of `<FormMessage>` (form-level messages). */
        formMessage: "",
      },
    },

    // TOOLTIP COMPONENT
    tooltip: {
      width: sharedTooltipWidth,
      classes: {
        top: "smart-tooltip top",
        bottom: "smart-tooltip bottom",
        left: "smart-tooltip left",
        right: "smart-tooltip right",
        overlay: "tooltip-overlay",
        /** Accessible `?` trigger rendered when the tooltip icon is `false`. */
        trigger: "",
      },
    },

    alert: {
      textAlig: sharedAlertTextAlign,
      classes: {
        container: "alert",
        success: "alert-success",
        warning: "alert-warning",
        danger: "alert-danger",
        info: "alert-info",
        textCenter: "text-center",
        textLeft: "text-left",
        textRight: "text-right",
      },
    },
  },

  // ============================================================================
  // GLOBAL RESOURCES
  // ============================================================================
  resources: {
    // ICONS LIBRARY
    icons: {
      ...sharedIcons,
      tooltip: "tooltip-icon fas fa-info-circle",
      ...sharedTrailingIcons,
    },

    // ICONS POSITION CONFIGURATION
    iconsPosition: sharedIconsPosition,

    // VALIDATION MESSAGES
    validationMessages: sharedValidationMessages,

    // FILE MANAGEMENT TEXTS
    fileTexts: sharedFileTexts,

    // MASKS AND FORMATS
    masks: sharedMasks,
  },

  // ============================================================================
  // HTML TAGS CONFIGURATION (Legacy - consider moving to components)
  // ============================================================================
  tags: sharedTags,
};

type RawConfig = typeof rawDefaultConfig;
type RawComponents = RawConfig["components"];
type IconMap<T> = { [K in keyof T]: IconValue };

/** Full smartr-ui configuration. */
export type SmartRConfig = Omit<RawConfig, "components" | "resources"> & {
  components: Omit<RawComponents, "table"> & {
    table: Omit<RawComponents["table"], "icons"> & {
      icons: IconMap<RawComponents["table"]["icons"]>;
    };
  };
  resources: Omit<RawConfig["resources"], "icons"> & {
    icons: IconMap<RawConfig["resources"]["icons"]>;
  };
  /** Grid (Row/Column) class strategy. */
  grid: SmartRGridConfig;
  /** Optional class merger (e.g. `twMerge`). Default: plain concatenation (1.1.0 behavior). */
  mergeClasses?: MergeClassesFn;
  /** Optional translation function for built-in texts and validation messages. */
  translate?: TranslateFn;
  /** Global default render slots for the Editor control. */
  render?: SmartRRenderSlots;
  /** Pluggable validation rules (`email`, `phone`, `url`, `required`). */
  validators?: SmartRValidators;
};

export const defaultConfig: SmartRConfig = {
  ...rawDefaultConfig,
  grid: {
    row: "row",
    column: bootstrapColumnClass,
    columnDefault: "",
  },
};

// Functions and components are configuration leaves (never deep-partialized).
type ConfigLeaf =
  | ((...args: any[]) => any)
  | (abstract new (...args: any[]) => any);

// Deep partial type for nested configuration objects.
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends ConfigLeaf
    ? T[P]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export type PartialSmartRConfig = DeepPartial<SmartRConfig>;
