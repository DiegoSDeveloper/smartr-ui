/**
 * Screen size preffix
 */
export enum ScreenSize {
  XS = "xs",
  SM = "sm",
  MD = "md",
  LG = "lg",
  XL = "xl",
  XXL = "xxl", 
}

export enum ColumnSize {
  Col1 = 1,
  Col2 = 2,
  Col3 = 3,
  Col4 = 4,
  Col5 = 5,
  Col6 = 6,
  Col7 = 7,
  Col8 = 8,
  Col9 = 9,
  Col10 = 10,
  Col11 = 11,
  Col12 = 12,
}

export enum Input {
  Text = 1,
  Money = 2,
  Date = 3,
  Email = 4,
  Select = 5,
  Phone = 6,
  Mobile = 7,
  Password = 8,
  CheckBox = 9,
  Percent = 10,
  LongText = 11,
  Hidden = 12,
  Integer = 13,
  Time = 14,
  Label = 15,
  Fax = 16,
  Radio = 17,
  FastSearch = 18,
  Decimal = 19,
  File = 20,
  Month = 21,
  Url = 22,
  DateTime = 23,
  Week = 24,
  Color = 25,
  Range = 26,
  /** Multi-select rendered as toggle chips (checkbox semantics). Value: array (or a separated string). */
  Chips = 27,
}
export enum YesNo {
  Yes,
  No,
}

export enum MonthDay {
  Start,
  End,
  Custom,
}

export enum Note {
  Tooltip,
  Popover,
  Label,
}

export enum CharacterCasing {
  Upper,
  Lower,
  Normal,
}
export enum OptionsSource {
  Enum,
  Values,
  DataSource,
  YesNo,
}

export enum TextInput {
  Integer,
  Decimal,
  Letter,
  AlphaNumeric,
}

export enum ValueType {
  Integer,
  Float,
  Boolean,
  String,
  Flag,
  Array,
}

export enum Hidden {
  Undefined = 0,
  XSDown = 1,
  SMDown = 2,
  MDDown = 4,
  LGDown = 8,
  XLDown = 16,

  XSUp = 32,
  SMUp = 64,
  MDUp = 128,
  LGUp = 256,
  XLUp = 512,
}
export enum IconPosition {
  Start = 1,
  End = 2,
  Both = 3,
}
export enum ValidationMessage {
  Error = 1,
  Success = 2,
  Warning = 3,
}
export enum TooltipPosition {
  Top = 1,
  Bottom = 2,
  Left = 3,
  Right = 4,
}

export enum LabelMode {
  Normal = 1,
  CheckBox = 2,
  RadioButton = 3,
}

/**
 * Option shape used by the async select engine.
 * `id`/`description` are the default keys; custom keys are supported via
 * `optionsId`/`optionsDescription` plus the index signature.
 */
export type SmartOption = {
  id: any;
  description: string;
  [key: string]: any;
};

/**
 * Arguments passed by the library to the consumer's `loadOptions` handler.
 * The library never performs I/O itself — the consumer decides how to fetch.
 */
export interface LoadOptionsArgs {
  /** Search term typed by the user (already debounced). */
  search: string;
  /** 1-based page number to load. */
  page: number;
  /** Number of items expected per page. */
  pageSize: number;
  /**
   * Aborted by the library when a newer request supersedes this one.
   * The consumer should forward it to its fetch implementation.
   */
  signal: AbortSignal;
}

/** Result returned by the consumer's `loadOptions` handler. */
export interface LoadOptionsResult {
  options: SmartOption[];
  /** When omitted, the library infers it from `options.length === pageSize`. */
  hasMore?: boolean;
  /** Optional total count, if the consumer knows it. */
  total?: number;
}
