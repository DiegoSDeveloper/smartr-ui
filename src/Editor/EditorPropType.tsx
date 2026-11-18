import { InputHTMLAttributes, FocusEvent, ChangeEvent, ReactNode } from "react";
import { ValidationResult } from "../ValidationResult";
import {
  Input,
  ColumnSize,
  IconPosition,
  CharacterCasing,
  TextInput,
  TooltipPosition,
  ValueType,
  LoadOptionsArgs,
  LoadOptionsResult,
  SmartOption,
} from "../types";
import { editorButtonPropTypes } from "../EditorButton/EditorButton";
import type {
  IconValue,
  SmartRRenderSlots,
  SmartRValidators,
} from "../config/defaultConfig";
import type { SmartRValidateMode } from "../config/sharedConfig";

/**
 * Per-instance class overrides for the Editor. Each slot is merged AFTER the
 * configured classes (through `config.mergeClasses` when set, e.g. twMerge).
 */
export interface EditorClassNames {
  /** Column wrapper (`<Column>`). */
  column?: string;
  /** Control group wrapper (`form-group`). */
  group?: string;
  /** Title label. */
  label?: string;
  /** The control itself (input / select / textarea / checkbox / radio input). */
  input?: string;
  /** Input group wrapper (`input-group`), when icons/buttons are present. */
  inputGroup?: string;
  /** Icon wrapper span (`input-group-text`). */
  icon?: string;
  /** Note label below the control. */
  note?: string;
  /** Validation message elements. */
  error?: string;
  /** Checkbox/radio option wrapper (`form-check`). */
  check?: string;
  /** Checkbox/radio option label (`form-check-label`). */
  checkLabel?: string;
  /** Tooltip bubble. */
  tooltip?: string;
  /** `layout="switch"`: row holding the text block and the control (`editor.classes.switchRow`). */
  switchRow?: string;
  /** `layout="switch"`: text block (title + note) (`editor.classes.switchText`). */
  switchText?: string;
  /** `layout="switch"`: wrapper of the control (`checkbox.classes.switchGroup`; `check` also applies). */
  switchGroup?: string;
  /** `layout="switch"`: the switch thumb, when the preset renders one (`checkbox.classes.switchThumb`). */
  switchThumb?: string;
  /** `Input.Chips`: the `role="group"` wrapper (`chips.classes.group`). */
  chipGroup?: string;
  /** `Input.Chips`: every chip (`chips.classes.chip`). */
  chip?: string;
}

/**
 * Blocks type inference for `TValue` (works on every TypeScript version):
 * `<Editor value={x} />` keeps `TValue = any` as before; only an explicit
 * `<Editor<boolean> … />` types `value` / `onChange` / `onValueChange`.
 */
type NoInferValue<T> = [T][T extends any ? 0 : never];

/** Layout of the Editor. `"switch"`: label + note on the left, the control on the right. */
export type EditorLayout = "default" | "switch";

export interface EditorPropType<TValue = any>
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | "type"
    | "value"
    | "min"
    | "max"
    | "minDate"
    | "title"
    | "onChange"
    | "onBlur"
    | "placeholder"
  > {
  type?: Input;
  id?: string;
  name?: string;
  className?: string;
  sm?: ColumnSize;
  md?: ColumnSize;
  lg?: ColumnSize;
  xl?: ColumnSize;
  xxl?: ColumnSize;
  size?: ColumnSize;

  labelSm?: ColumnSize;
  labelMd?: ColumnSize;
  labelLg?: ColumnSize;
  labelXl?: ColumnSize;
  labelXxl?: ColumnSize;
  labelSize?: ColumnSize;
  createColumn?: boolean;
  createRow?: boolean;
  /** Label text. Strings render exactly as before; React nodes are rendered as-is. */
  title?: ReactNode;
  /** Text of the checkbox label. Strings render exactly as before; React nodes are rendered as-is. */
  checkBoxText?: ReactNode;
  /**
   * `"switch"`: the title (or `checkBoxText`) and the note on the left, the
   * control on the right (settings-style rows). Classes:
   * `editor.classes.switchRow` / `switchText`, `checkbox.classes.switchGroup` / `switch`.
   */
  layout?: EditorLayout;
  hasIcon?: boolean;
  iconPosition?: IconPosition;
  /** Icon class (`"fas fa-user"`), React node or React component. */
  appendIcon?: IconValue;
  /** Icon class (`"fas fa-user"`), React node or React component. */
  prependIcon?: IconValue;
  enableShowPassword?: boolean;
  showPasswordIconPosition?: IconPosition;
  showPasswordIcon?: IconValue;
  hidePasswordIcon?: IconValue;
  /** Per-instance class overrides (merged after the configured classes). */
  classNames?: EditorClassNames;
  /**
   * Replaces the rendered native control while keeping label, validation,
   * masks, state binding and grid. Overrides `config.render`.
   * See `SmartRControlProps` for the props contract.
   */
  render?: SmartRRenderSlots;
  required?: boolean;
  value?: NoInferValue<TValue>;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFilesPlaceholder?: number;
  maxFileSize?: number;
  fileUrlDownload?: string;
  fileDownloadName?: string;
  /**
   * Placeholder. `false` renders none (also turns the default phone placeholder
   * off); `""` does the same when `behavior.input.emptyDisablesDefault` is on
   * (non-Bootstrap presets).
   */
  placeholder?: string | false;
  hasTitle?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
  inline?: boolean;
  horizontal?: boolean;
  rows?: number;
  characterCasing?: CharacterCasing;
  max?: number;
  min?: number;
  step?: number;
  maxDate?: string | Date;
  minDate?: string | Date;
  /**
   * Input mask (`0`/`9` digit, `A` alphanumeric, `S` letter, anything else
   * literal), alternatives chosen by length (`["(00) 0000-0000", "(00) 00000-0000"]`),
   * a phone country preset (`"phone-us"`, `"phone-br"`, `"phone-br-mobile"`,
   * `"phone-br-landline"`), or `false` for no mask — which also turns the
   * global phone mask off for this Editor (`""` does the same when
   * `behavior.input.emptyDisablesDefault` is on).
   */
  mask?: string | string[] | false;
  /**
   * Phone types: country of the default mask and placeholder (`"US"`, `"BR"`,
   * `"BR-MOBILE"`, `"BR-LANDLINE"`, or a key of `resources.masks.phoneByCountry`).
   * Default: `behavior.input.phoneCountry`.
   */
  phoneCountry?: string;
  getMaskedValue?: boolean;
  titleBold?: boolean;
  /** Invalid state. Re-synced when the parent changes it after mount. */
  invalid?: boolean;
  invalidMessage?: string;
  /**
   * External error messages (server / cross-field validation). When non-empty
   * the Editor is invalid and the messages are rendered like validation
   * errors (after them). They are also returned by `validate()` (one Error
   * result each) unless `behavior.validation.includeExternalErrors` is false —
   * clear them from the parent (e.g. on change) so a resubmission can pass.
   */
  errors?: ReactNode | ReactNode[] | null;
  requiredMessage?: string;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validateDefaultOnBlur?: boolean;
  validateDefaultOnChange?: boolean;
  validateDefaultOnSubmit?: boolean;
  /**
   * When this Editor validates: `"blur"`, `"change"`, `"submit"` (only on
   * `validate()` / Container submit) or `"afterSubmit"` (nothing until the
   * first `validate()`, then live on change and blur). Default:
   * `behavior.validation.validateMode` (unset: the `validateOnBlur` /
   * `validateOnChange` props, as in 1.1.0). Explicit `validateOnBlur` /
   * `validateOnChange` props win over the mode.
   */
  validateMode?: SmartRValidateMode;
  /**
   * Pluggable rules for this Editor (`email`, `phone`, `url`, `required`),
   * over `config.validators`. A rule returns `true` (valid), `false` (default
   * message) or a message; `false` instead of a function turns the rule off.
   */
  validators?: SmartRValidators;
  showValidationResultOnSubmit?: boolean;
  optionsId?: string;
  optionsDescription?: string;
  optionsToolTip?: string;
  optionsGroup?: string;
  optionGetDescription?: (option: any) => string;
  optionGetGroup?: (option: any) => string;
  options?: any[];
  optionsNoneSelectedText?: string;
  optionsNoneSelectedValue?: any;
  optionsFirstSelected?: boolean;
  optionsFilter?: boolean;
  optionsGrouped?: boolean;
  optionsMultiple?: boolean;
  optionsMultipleSeparatorValue?: string;
  optionsMultipleSeparatorDescription?: string;
  optionsFilterPlaceholder?: string;
  optionsLimiteDescriptionSelected?: number;
  optionRenderer?: (
    option: any,
    isSelected: boolean,
    searchText: string
  ) => React.ReactNode;

  // --- Modo assíncrono (Input.Select com loadOptions, ou Input.FastSearch) ---
  /**
   * ATIVA o modo assíncrono do dropdown. A lib decide quando chamar
   * (debounce, paginação, cancelamento); o consumidor decide como buscar.
   */
  loadOptions?: (args: LoadOptionsArgs) => Promise<LoadOptionsResult>;
  /** Resolve o rótulo do valor já selecionado quando ele está fora das páginas carregadas. */
  loadSelectedOption?: (
    value: any,
    signal: AbortSignal
  ) => Promise<SmartOption | null>;
  /** Alternativa a loadSelectedOption: item selecionado já resolvido pelo consumidor. */
  selectedOption?: SmartOption | null;
  pageSize?: number;
  searchDebounceMs?: number;
  minSearchLength?: number;
  loadOnOpen?: boolean;
  /**
   * Invalida o cache por termo e recarrega (ex.: Date.now() depois de cadastrar
   * um registro novo, para que ele apareça na busca).
   */
  reloadToken?: any;
  /**
   * Exibe a linha "nenhum selecionado". Default: `!optionsFirstSelected`.
   * No modo assíncrono `optionsFirstSelected` NÃO auto-seleciona a primeira opção
   * (isso escolheria um item arbitrário da página carregada) — use este prop para
   * controlar a linha "nenhum" de forma explícita.
   */
  showNoneOption?: boolean;
  onSearchChange?: (search: string) => void;
  onOpen?: () => void;
  renderEmpty?: (search: string) => React.ReactNode;
  renderError?: (error: unknown, retry: () => void) => React.ReactNode;
  renderLoading?: () => React.ReactNode;

  input?: TextInput;
  valueType?: ValueType;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  decimalPlaces?: number;
  tooltip?: string;
  toolTipPosition?: TooltipPosition;
  /** Note below the control. Strings render exactly as before; React nodes are rendered as-is. */
  note?: ReactNode;
  noteClassName?: string;
  skipSubmit?: boolean;
  prependButtons?: editorButtonPropTypes[];
  appendButtons?: editorButtonPropTypes[];
  state?: any;
  dispatchState?: any;
  formState?: any;
  dispatchFormState?: any;
  listFormState?: any[];
  listFormIndex?: number;
  dispatchListFormState?: any;
  onDownloadFileClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDeleteFileClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  customValidationOnBlur?: (currentValue: any) => Promise<ValidationResult[]>;
  customValidationOnChange?: (currentValue: any) => Promise<ValidationResult[]>;
  customValidationOnSubmit?: (currentValue: any) => Promise<ValidationResult[]>;
  children?: React.ReactNode;
  onChange?: (
    event?: ChangeEvent<HTMLInputElement>,
    value?: NoInferValue<TValue>,
    id?: string,
    name?: string,
    type?: Input
  ) => void;
  /**
   * Typed change handler: the converted value first (`ValueType` applied,
   * mask removed), then the (normalized) change event. Called after `onChange`.
   */
  onValueChange?: (value: NoInferValue<TValue>, event?: any) => void;
  onBlur?: (
    event?: FocusEvent<HTMLInputElement>,
    value?: any,
    id?: string,
    name?: string,
    type?: Input
  ) => void;
}
