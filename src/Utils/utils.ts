/**
 * Util funtions
 */

import {
  CharacterCasing,
  IconPosition,
  Input,
  ScreenSize,
  TextInput,
  ValidationMessage,
  ValueType,
} from "../types";
import { EditorPropType } from "../Editor/EditorPropType";
import { ValidationResult } from "../ValidationResult";

import { configManager } from "../config/configManager";
import type {
  IconValue,
  SmartRConfig,
  SmartRValidator,
  SmartRValidatorContext,
  SmartRValidators,
} from "../config/defaultConfig";
import { resolveTranslation } from "./translate";

/** A mask: a pattern, or alternatives chosen by the typed length (`["(00) 0000-0000", "(00) 00000-0000"]`). */
export type MaskValue = string | string[];

function isPhoneType(type: Input | undefined): boolean {
  return type === Input.Phone || type === Input.Mobile || type === Input.Fax;
}

/** Number of input slots (`0`, `9`, `A`, `S`) of a mask pattern. */
function maskSlots(mask: string): number {
  let slots = 0;
  for (const char of mask) {
    if (char === "0" || char === "9" || char === "A" || char === "S") slots++;
  }
  return slots;
}

/**
 * Picks the pattern of a mask for a value: a string mask is returned as-is;
 * for alternatives, the one with the fewest slots that fits the value's
 * letters/digits (the largest when none fits).
 */
export function selectMask(
  mask: MaskValue | false | null | undefined,
  value?: any
): string | undefined {
  if (!mask) return undefined;
  if (!Array.isArray(mask)) return mask;
  const list = mask.filter((m) => typeof m === "string" && m !== "");
  if (list.length === 0) return undefined;
  const sorted = [...list].sort((a, b) => maskSlots(a) - maskSlots(b));
  const count = String(value ?? "").replace(/[^A-Za-z0-9]/g, "").length;
  return sorted.find((m) => maskSlots(m) >= count) ?? sorted[sorted.length - 1];
}

/** Length of the longest pattern of a mask (used for `maxLength`). */
export function maskMaxLength(mask: MaskValue | false | null | undefined): number {
  if (!mask) return 0;
  if (!Array.isArray(mask)) return mask.length;
  return mask.reduce((longest, m) => Math.max(longest, (m || "").length), 0);
}

/** Phone country of an Editor: `mask="phone-xx"`, then `phoneCountry`, then `behavior.input.phoneCountry`. */
function phoneCountryOf(props: EditorPropType, config: SmartRConfig): string | undefined {
  const { mask } = props;
  if (typeof mask === "string" && /^phone-/i.test(mask)) return mask.slice(6).toUpperCase();
  const country = props.phoneCountry ?? config.behavior.input.phoneCountry;
  return country ? String(country).toUpperCase() : undefined;
}

/**
 * The mask an Editor uses:
 * - `mask={false}`: none (also turns the default phone mask off);
 * - `mask=""`: none when `behavior.input.emptyDisablesDefault` (non-Bootstrap
 *   presets); in Bootstrap it falls back to the default, as in 1.1.0;
 * - `mask="phone-br"` / `"phone-us"`…: `resources.masks.phoneByCountry`;
 * - any other string / array: used as-is;
 * - phone types without a mask: the `phoneCountry` mask, else `resources.masks.phone`.
 */
export function resolveEditorMask(
  props: EditorPropType,
  config: SmartRConfig = configManager.getConfig()
): MaskValue | undefined {
  const { type = Input.Text, mask } = props;
  const byCountry = (country: string): MaskValue | undefined => {
    const masks: Record<string, MaskValue> =
      (config.resources.masks as any).phoneByCountry || {};
    const found = masks[country.toUpperCase()];
    return found && (!Array.isArray(found) || found.length) ? found : undefined;
  };
  if (mask === false) return undefined;
  if (Array.isArray(mask)) return mask.length ? mask : undefined;
  if (typeof mask === "string" && mask !== "") {
    if (/^phone-/i.test(mask)) return byCountry(mask.slice(6));
    return mask;
  }
  if (!isPhoneType(type)) return undefined;
  if (mask === "" && config.behavior.input.emptyDisablesDefault) return undefined;
  const country = props.phoneCountry ?? config.behavior.input.phoneCountry;
  if (country) {
    const countryMask = byCountry(String(country));
    if (countryMask) return countryMask;
  }
  return config.resources.masks.phone || undefined;
}

/**
 * The default placeholder of a phone Editor (`undefined` when the Editor
 * has its own placeholder, opted out with `placeholder={false}` — or `""`
 * with `behavior.input.emptyDisablesDefault` — or is not a phone type).
 */
export function resolveDefaultPlaceholder(
  props: EditorPropType,
  config: SmartRConfig = configManager.getConfig()
): string | undefined {
  const { type = Input.Text, placeholder } = props;
  if (!isPhoneType(type)) return undefined;
  if (placeholder === false || placeholder) return undefined;
  if (placeholder === "" && config.behavior.input.emptyDisablesDefault) return undefined;
  const placeHolders: any = config.components.editor.placeHolders;
  const country = phoneCountryOf(props, config);
  if (country && placeHolders.phoneByCountry?.[country]) {
    return placeHolders.phoneByCountry[country];
  }
  return placeHolders.phone || undefined;
}

/**
 * Resolves a validation message through `config.translate` (when configured)
 * and replaces its `%sN` placeholders. Identical to 1.1.0 without `translate`.
 */
function validationMessage(
  config: SmartRConfig,
  key: string,
  ...params: any[]
): string {
  const template = (config.resources.validationMessages as any)[key];
  // `resources.validationMessages.X` first, then the `validation.X` alias;
  // a missing translation (undefined / null / "") falls back to the template
  const text = resolveTranslation(
    config,
    `validation.${key}`,
    template,
    params.length ? params : undefined
  );
  return params.length ? parameterizedString(text, ...params) : text;
}

type ClassValue = string | number | boolean | undefined | null;
type ClassDictionary = Record<string, any>;
type ClassArray = ClassValue[];

export function getColumnSize(size: number, prefix?: ScreenSize) {
  let className = null;
  if (size) {
    if (prefix) {
      className = `col-${prefix}-${size > 0 ? size : "auto"}`;
    } else {
      className = `col-${size > 0 ? size : "auto"}`;
    }
  }
  return className;
}
export function getScreenSize() {
  const windowWidth = window.innerWidth;
  let size: ScreenSize = ScreenSize.XL;

  if (windowWidth < 576) {
    size = ScreenSize.XS;
  } else if (windowWidth >= 576 && windowWidth < 768) {
    size = ScreenSize.SM; // Small
  } else if (windowWidth >= 768 && windowWidth < 992) {
    size = ScreenSize.MD; // Medium
  } else if (windowWidth >= 992 && windowWidth < 1200) {
    size = ScreenSize.LG; // Large
  } else if (windowWidth >= 1200 && windowWidth < 1400) {
    size = ScreenSize.XL; // Extra large
  } else {
    size = ScreenSize.XXL; // Extra Extra large
  }
  return size;
}

export function bytesToHumanReadable(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

export function mapToCssModules(className = "") {
  return className
    .split(" ")
    .map((c) => c)
    .join(" ");
}

export function parameterizedString(...args: any[]) {
  const str = args[0];
  const params = args.filter((arg, index) => index !== 0);
  if (!str) return "";
  return str.replace(
    /%s[0-9]+/g,
    (matchedStr: { replace: (arg0: string, arg1: string) => number }) => {
      const variableIndex = matchedStr.replace("%s", "") - 1;
      return params[variableIndex];
    }
  );
}

export function formatNumber(
  number: number,
  thousandsSeparator: string = ".",
  decimalSeparator: string = ",",
  decimalPlaces: number = 2
) {
  const numberString = number.toFixed(decimalPlaces);

  const parts = numberString.split(".");
  let wholeNumber = parts[0];
  const decimalPart = parts[1];

  if (thousandsSeparator) {
    wholeNumber = wholeNumber.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandsSeparator
    );
  }

  return wholeNumber + decimalSeparator + decimalPart;
}

export function getDefaultHasIcon(type: Input, isAsyncSelect: boolean = false) {
  // Em modo assíncrono o FastSearch é renderizado como dropdown (AsyncSelect),
  // não como input de texto — sem o input-group com ícone de lupa
  if (type === Input.FastSearch && isAsyncSelect) {
    return false;
  }
  return (
    type === Input.Mobile ||
    type === Input.Phone ||
    type === Input.Fax ||
    type === Input.Money ||
    type === Input.Percent ||
    type === Input.Password ||
    type === Input.Email ||
    type === Input.Date ||
    type === Input.DateTime ||
    type === Input.Month ||
    type === Input.Week ||
    type === Input.Time ||
    type === Input.Url ||
    type === Input.FastSearch
  );
}

export function getDefaultIconPosition(
  type: Input,
  config: SmartRConfig = configManager.getConfig()
): IconPosition {

  // Positions come from config.resources.iconsPosition
  const iconsPosition = config.resources.iconsPosition;

  switch (type) {
    case Input.Mobile:
      return iconsPosition.mobile === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Phone:
      return iconsPosition.phone === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Fax:
      return iconsPosition.fax === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Money:
      return iconsPosition.money === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Percent:
      return iconsPosition.percent === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Password:
      return iconsPosition.password === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Email:
      return iconsPosition.email === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Date:
      return iconsPosition.date === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.DateTime:
      return iconsPosition.dateTime === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Month:
      return iconsPosition.month === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Week:
      return iconsPosition.week === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Time:
      return iconsPosition.time === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Url:
      return iconsPosition.url === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.FastSearch:
      return iconsPosition.fastSearch === "start"
        ? IconPosition.Start
        : IconPosition.End;
  }
  return IconPosition.Start;
}

export function getDefaultIcon(
  type: Input,
  config: SmartRConfig = configManager.getConfig()
): IconValue {

  const icons = config.resources.icons;

  switch (type) {
    case Input.Mobile:
      return icons.mobile;
    case Input.Phone:
      return icons.phone;
    case Input.Fax:
      return icons.fax;
    case Input.Money:
      return icons.money;
    case Input.Percent:
      return icons.percent;
    case Input.Password:
      return icons.password;
    case Input.Email:
      return icons.email;
    case Input.Date:
      return icons.date;
    case Input.DateTime:
      return icons.dateTime;
    case Input.Month:
      return icons.month;
    case Input.Week:
      return icons.week;
    case Input.Time:
      return icons.time;
    case Input.Url:
      return icons.url;
    case Input.FastSearch:
      return icons.fastSearch;
  }
  return "";
}

export function getValueType(type: Input) {
  switch (type) {
    case Input.Money:
    case Input.Percent:
    case Input.Decimal:
    case Input.Range:
      return ValueType.Float;
    case Input.Integer:
      return ValueType.Integer;
    case Input.CheckBox:
      return ValueType.Boolean;
    case Input.Chips:
      return ValueType.Array;
    default:
      return ValueType.String;
  }
}

export function getValueAsType(
  type: ValueType,
  value: any,
  separator: string = ","
) {
  switch (type) {
    case ValueType.Float: {
      if (value) {
        try {
          let cleanValueString = String(value);

          if (
            cleanValueString.includes(",") &&
            cleanValueString.includes(".")
          ) {
            const periodIndex = cleanValueString.indexOf(".");
            const comaIndex = cleanValueString.indexOf(",");
            if (comaIndex < periodIndex) {
              cleanValueString = cleanValueString.replace(/,/g, "");
            } else {
              cleanValueString = cleanValueString.replace(".", "");
              cleanValueString = cleanValueString.replace(",", ".");
            }
          } else if (cleanValueString.includes(",")) {
            cleanValueString = cleanValueString.replace(",", ".");
          }
          return parseFloat(cleanValueString);
        } catch (error) {
          return 0;
        }
      } else {
        return 0.0;
      }
    }
    case ValueType.Integer: {
      if (value) {
        try {
          const integerString = String(value);
          if (integerString.includes(".") || integerString.includes(",")) {
            return parseInt(integerString.split(/[.,]/)[0]);
          } else {
            return parseInt(value);
          }
        } catch (error) {
          return 0;
        }
      } else {
        return 0;
      }
    }
    case ValueType.Flag: {
      if (value) {
        try {
          const values = String(value).split(separator);
          return values.reduce(function (total, flagValue) {
            return total + parseInt(flagValue, 10);
          }, 0);
        } catch (error) {
          return 0;
        }
      } else {
        return 0;
      }
    }
    case ValueType.Array: {
      if (value) {
        try {
          return String(value).split(separator);
        } catch (error) {
          return 0;
        }
      } else {
        return 0;
      }
    }
    case ValueType.Boolean: {
      if (value) {
        try {
          const boolValue = value.toString().toLowerCase();
          return (
            boolValue === "true" ||
            boolValue === "1" ||
            boolValue === "yes" ||
            boolValue === "y"
          );
        } catch (error) {
          return false;
        }
      } else {
        return false;
      }
    }
    default: {
      // return (value ?? "").toString(); // or treat file input
      return value;
    }
  }
}
export function getDateFormatted(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

export function getMonthFormatted(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getDateTimeFormatted(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
export function getEditorAttributes(
  props: EditorPropType,
  isInvalid: boolean,
  editorValue: any,
  showPassword: boolean,
  config: SmartRConfig = configManager.getConfig()
): Record<string, any> {
  const {
    type = Input.Text,
    id,
    name,
    placeholder,
    enabled = true,
    readOnly = false,
    rows,
    input,
    characterCasing = CharacterCasing.Upper,
    max,
    min,
    maxDate,
    minDate,
    accept,
    multiple = false,
    skipSubmit = false,
  } = props;
  // `mask={false}` / `phoneCountry` / `mask="phone-br"`… (see resolveEditorMask)
  const editorMask = resolveEditorMask(props, config);
  const editorName = name || id;
  const editorAttributes: Record<string, any> = {};

  editorAttributes["data-smarteditor"] = Input[type];

  if (id) {
    editorAttributes["id"] = id;
  }
  if (editorName) {
    editorAttributes["name"] = editorName;
  }

  switch (input) {
    case TextInput.Decimal:
      {
        editorAttributes["data-input"] = "number";
      }
      break;
    case TextInput.Integer:
      {
        editorAttributes["data-input"] = "integer";
      }
      break;
    case TextInput.Letter:
      {
        editorAttributes["data-input"] = "letter";
      }
      break;
  }
  switch (type) {
    case Input.Hidden:
      {
        editorAttributes["type"] = "hidden";
      }
      break;
    case Input.Radio:
      {
        editorAttributes["type"] = "radio";
        if (!editorName && !id) {
          const generatedName = `radio-${Date.now()}-${Math.floor(
            Math.random() * 10000
          )}`;
          editorAttributes["name"] = generatedName;
        }
      }
      break;
    case Input.CheckBox:
      {
        editorAttributes["type"] = "checkbox";
        editorAttributes["value"] = "true";
      }
      break;
    case Input.Text:
      {
        editorAttributes["type"] = "text";

        switch (characterCasing) {
          case CharacterCasing.Upper:
            {
              editorAttributes["data-text"] = "upper";
            }
            break;
          case CharacterCasing.Lower:
            {
              editorAttributes["data-text"] = "lower";
            }
            break;
          case CharacterCasing.Normal:
            {
              editorAttributes["data-text"] = "normal";
            }
            break;
        }
      }
      break;
    case Input.Integer:
      {
        editorAttributes["type"] = "number";
      }
      break;
    case Input.Date:
      {
        editorAttributes["type"] = "date";
        if (minDate) {
          editorAttributes["min"] =
            typeof minDate === "string" ? minDate : getDateFormatted(minDate);
        }
        if (maxDate) {
          editorAttributes["max"] =
            typeof maxDate === "string" ? maxDate : getDateFormatted(maxDate);
        }
      }
      break;
    case Input.DateTime:
      {
        editorAttributes["type"] = "datetime-local";
        if (minDate) {
          editorAttributes["min"] =
            typeof minDate === "string"
              ? minDate
              : getDateTimeFormatted(minDate);
        }
        if (maxDate) {
          editorAttributes["max"] =
            typeof maxDate === "string"
              ? maxDate
              : getDateTimeFormatted(maxDate);
        }
      }
      break;
    case Input.Month:
      {
        editorAttributes["type"] = "month";
        if (minDate) {
          editorAttributes["min"] =
            typeof minDate === "string" ? minDate : getMonthFormatted(minDate);
        }
        if (maxDate) {
          editorAttributes["max"] =
            typeof maxDate === "string" ? maxDate : getMonthFormatted(maxDate);
        }
      }
      break;
    case Input.Week:
      {
        editorAttributes["type"] = "week";
        if (minDate && typeof minDate === "string") {
          editorAttributes["min"] = minDate;
        }
        if (maxDate && typeof maxDate === "string") {
          editorAttributes["max"] = maxDate;
        }
      }
      break;
    case Input.Time:
      {
        editorAttributes["type"] = "text";
        editorAttributes["data-autoclose"] = "true";
        editorAttributes["readOnly"] = "";
        editorAttributes["data-time"] = "true";
      }
      break;
    case Input.Url:
      {
        editorAttributes["type"] = "url";
      }
      break;
    case Input.Color:
      {
        editorAttributes["type"] = "color";
      }
      break;
    case Input.Range:
      {
        editorAttributes["type"] = "range";
        if (props.step !== undefined && props.step !== null) {
          editorAttributes["step"] = String(props.step);
        }
      }
      break;
    case Input.Password:
      {
        if (!showPassword) {
          editorAttributes["type"] = "password";
        } else {
          editorAttributes["type"] = "text";
        }
      }
      break;
    case Input.Email:
      {
        editorAttributes["type"] = "email";
      }
      break;
    case Input.File:
      {
        editorAttributes["type"] = "file";
        if (accept) {
          editorAttributes["accept"] = accept;
        }
        if (multiple) {
          editorAttributes["multiple"] = "multiple";
        }
      }
      break;
    case Input.LongText:
      {
        editorAttributes["rows"] = String(rows);
      }
      break;
    case Input.Mobile:
    case Input.Phone:
    case Input.Fax:
      {
        editorAttributes["type"] = "tel";
        // default (or per-country) placeholder, unless opted out
        const defaultPlaceholder = resolveDefaultPlaceholder(props, config);
        if (defaultPlaceholder) {
          editorAttributes["placeholder"] = defaultPlaceholder;
        }
      }
      break;
    case Input.Select:
      {
        // no type attribute
      }
      break;
    default:
      {
        editorAttributes["type"] = "text";
      }
      break;
  }

  if (readOnly) {
    editorAttributes["readOnly"] = "";
    editorAttributes["tabIndex"] = "-1";
  }
  if (!enabled) {
    editorAttributes["disabled"] = "disabled";
  }

  if (editorMask) {
    editorAttributes["data-mask"] = selectMask(editorMask, editorValue);
  }
  const isNumericInput = type === Input.Integer || type === Input.Range;
  if (type !== Input.File) {
    if (min !== undefined && min !== null && (isNumericInput || min > 0)) {
      if (isNumericInput) {
        editorAttributes["min"] = String(min);
      } else {
        editorAttributes["minLength"] = String(min);
      }
    }
    if (max !== undefined && max !== null && (isNumericInput || max > 0)) {
      const maskLength = maskMaxLength(editorMask);
      if (isNumericInput) {
        editorAttributes["max"] = String(max);
      } else {
        editorAttributes["maxLength"] = String(Math.max(max, maskLength));
      }
    }
    if (placeholder) {
      // `placeholder={false}` renders none
      editorAttributes["placeholder"] = placeholder;
    }
  }
  if (skipSubmit) {
    editorAttributes["data-skip-submit"] = "true";
  }

  // if (String(editorValue)) {
  //   switch (type) {
  //     case Input.CheckBox:
  //       {
  //         editorAttributes["defaultChecked"] =
  //           String(editorValue) === "true" || String(editorValue) === "1";
  //       }
  //       break;
  //     case Input.Select:
  //       {
  //         //     editorAttributes["defaultValue"] = editorValue;
  //       }
  //       break;
  //     default: {
  //       //  editorAttributes["defaultValue"] = editorValue;
  //       break;
  //     }
  //   }
  // }

  if (editorValue !== undefined && editorValue !== null) {
    editorAttributes["value"] = editorValue;
  } else {
    editorAttributes["value"] = "";
  }

  if (isInvalid) {
    editorAttributes["aria-invalid"] = "true";
  }
  return editorAttributes;
}

export function removeMask(
  type: Input,
  mask: MaskValue,
  maskedValue,
  thousandsSeparator: string,
  decimalSeparator: string
) {
  // alternatives (`["(00) 0000-0000", "(00) 00000-0000"]`): the one that fits
  const editorMask = Array.isArray(mask) ? selectMask(mask, maskedValue) : mask;
  if (
    !editorMask &&
    type !== Input.Money &&
    type !== Input.Decimal &&
    type !== Input.Percent
  )
    return maskedValue;
  if (
    type !== Input.Money &&
    type !== Input.Decimal &&
    type !== Input.Percent &&
    !editorMask
  ) {
    return maskedValue;
  }
  let unmaskedValue = "";
  if (
    type !== Input.Money &&
    type !== Input.Decimal &&
    type !== Input.Percent
  ) {
    let maskIndex = 0;
    for (let i = 0; i < maskedValue.length; i++) {
      if (maskIndex >= editorMask.length) break;

      const maskChar = editorMask[maskIndex];

      if (
        maskChar === "0" ||
        maskChar === "9" ||
        maskChar === "A" ||
        maskChar === "S"
      ) {
        unmaskedValue += maskedValue[i];
      }
      maskIndex++;
    }
  } else {
    const sanitizedString = maskedValue
      .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
      .replace(new RegExp(`\\${decimalSeparator}`), ".");

    const floatValue = parseFloat(sanitizedString);

    unmaskedValue = isNaN(floatValue) ? "0.00" : floatValue.toString();
  }
  return unmaskedValue;
}

export function applyMask(
  type: Input,
  mask: MaskValue,
  input: any,
  thousandsSeparator: string,
  decimalSeparator: string,
  decimalPlaces: number
) {
  // alternatives (`["(00) 0000-0000", "(00) 00000-0000"]`): the one that fits
  const editorMask = Array.isArray(mask) ? selectMask(mask, input) : mask;
  if (
    !input ||
    (type !== Input.Text &&
      type !== Input.Phone &&
      type !== Input.Mobile &&
      type !== Input.Fax &&
      type !== Input.Money &&
      type !== Input.Decimal &&
      type !== Input.Percent)
  )
    return "";
  if (
    (type === Input.Text ||
      type === Input.Mobile ||
      type === Input.Fax ||
      type === Input.Phone) &&
    !editorMask
  ) {
    return "";
  }
  let maskedValue = "";
  if (
    type === Input.Text ||
    type === Input.Mobile ||
    type === Input.Fax ||
    type === Input.Phone
  ) {
    let maskIndex = 0;

    for (let i = 0; i < input.length; i++) {
      if (maskIndex >= editorMask.length) break;

      const maskChar = editorMask[maskIndex];

      if (maskChar === "0") {
        if (/\d/.test(input[i])) {
          maskedValue += input[i];
          maskIndex++;
        }
      } else if (maskChar === "9") {
        if (/\d/.test(input[i])) {
          maskedValue += input[i];
          maskIndex++;
        }
      } else if (maskChar === "A") {
        if (/[a-zA-Z0-9]/.test(input[i])) {
          maskedValue += input[i];
          maskIndex++;
        }
      } else if (maskChar === "S") {
        if (/[a-zA-Z]/.test(input[i])) {
          maskedValue += input[i];
          maskIndex++;
        }
      } else {
        maskedValue += maskChar;
        maskIndex++;
        if (input[i] !== maskChar) {
          i--;
        }
      }
    }
  } else if (
    type === Input.Money ||
    type === Input.Decimal ||
    type === Input.Percent
  ) {
    if (typeof input === "number") {
      input = formatNumber(
        input,
        thousandsSeparator,
        decimalSeparator,
        decimalPlaces
      );
    }
    input = input.replace(/[^\d]/g, "");
    input = input.replace(/,+/g, ",");
    const numericValue = parseFloat(input);
    let wholeNumber = 0;
    let decimalNumber = 0;
    if (numericValue >= Math.pow(10, decimalPlaces)) {
      wholeNumber = parseInt(numericValue.toString().slice(0, -decimalPlaces));
      decimalNumber = parseInt(numericValue.toString().slice(-decimalPlaces));
    } else {
      decimalNumber = numericValue;
    }
    const number = parseFloat(
      `${wholeNumber}.${decimalNumber.toString().padStart(decimalPlaces, "0")}`
    );

    maskedValue = formatNumber(
      number,
      thousandsSeparator,
      decimalSeparator,
      decimalPlaces
    );
  }
  return maskedValue;
}
/** The 1.1.0 e-mail rule (Bootstrap, `behavior.validation.emailRule: "legacy"`). */
const legacyEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
/**
 * `emailRule: "unicode"`: any non-space local part, unicode (IDN) or punycode
 * domain labels, a letter TLD of 2+ characters (or a punycode TLD).
 */
const unicodeEmailRegex =
  /^[^\s@]+@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+(?:\p{L}{2,}|xn--[a-z0-9-]{2,})$/iu;

/** The built-in e-mail rule of a configuration (see `behavior.validation.emailRule`). */
export function isValidEmail(
  value: any,
  config: SmartRConfig = configManager.getConfig()
): boolean {
  if ((config.behavior.validation as any).emailRule === "unicode") {
    return unicodeEmailRegex.test(String(value ?? "").trim());
  }
  return legacyEmailRegex.test(String(value));
}

/**
 * The rule configured for `key`: the Editor's `validators` prop first, then
 * `config.validators`. `false` turns the rule off; `undefined` keeps the built-in one.
 */
function resolveValidator(
  props: EditorPropType,
  config: SmartRConfig,
  key: keyof SmartRValidators
): SmartRValidator | false | undefined {
  const own = props.validators?.[key];
  if (own !== undefined) return own === null ? undefined : own;
  const global = config.validators?.[key];
  return global === null ? undefined : global;
}

/** `true` when valid, `false` to use the default message, or the message. */
function runValidator(
  validator: SmartRValidator,
  value: any,
  context: SmartRValidatorContext
): true | false | string {
  const result = validator(value, context);
  if (result === false) return false;
  if (typeof result === "string" && result !== "") return result;
  return true;
}

export function validateEditorInputValue(
  currentValue: any,
  props: EditorPropType,
  editorMask?: MaskValue,
  config: SmartRConfig = configManager.getConfig()
) {
  const {
    type = Input.Text,
    id,
    name,
    required = false,
    max,
    min,
    maxFiles,
    multiple,
    maxFileSize,
    requiredMessage,
  } = props;
  // The Editor passes a plain-text title (React-node titles are converted)
  const title = props.title as string;
  const editorName = name || id;
  const list: ValidationResult[] = [];
  const context: SmartRValidatorContext = { type, id, name: editorName, title, config };
  const fail = (message: string) =>
    list.push(
      new ValidationResult(editorName, title, ValidationMessage.Error, message, currentValue)
    );

  const isEmpty =
    !currentValue ||
    (currentValue instanceof FileList && currentValue.length === 0) ||
    (Array.isArray(currentValue) && currentValue.length === 0);

  // Pluggable `required` rule (`validators.required`): decides whether the value is present
  const requiredRule = resolveValidator(props, config, "required");
  if (required && typeof requiredRule === "function") {
    const result = runValidator(requiredRule, currentValue, context);
    if (result !== true) {
      fail(result === false ? requiredMessage || validationMessage(config, "required") : result);
      return list;
    }
    if (isEmpty) return list;
  }

  if (isEmpty) {
    if (required && requiredRule !== false) {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          requiredMessage || validationMessage(config, "required"),
          currentValue
        )
      );
    }
  } else if (
    (type === Input.Text || type === Input.LongText) &&
    ((min && min > 0) || (max && max > 0))
  ) {
    const currentValueString = String(currentValue);
    const maskLength = maskMaxLength(editorMask);
    const minCharacter = Number(min);
    const maxCharacter = Math.max(max, maskLength);
    if (min && min > 0 && max && max > 0) {
      if (
        currentValueString.length < minCharacter ||
        currentValueString.length > maxCharacter
      ) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            validationMessage(config, "minMaxCharacters", minCharacter,
              maxCharacter),
            currentValue
          )
        );
      }
    } else if (minCharacter > 0 && currentValueString.length < minCharacter) {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          minCharacter > 1
            ? validationMessage(config, "minCharacters", minCharacter)
            : validationMessage(config, "minCharacter"),
          currentValue
        )
      );
    } else if (maxCharacter > 0 && currentValueString.length > maxCharacter) {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          maxCharacter > 1
            ? validationMessage(config, "maxCharacters", maxCharacter)
            : validationMessage(config, "maxCharacter"),
          currentValue
        )
      );
    }
  } else if (type === Input.Integer && ((min && min > 0) || (max && max > 0))) {
    const currentValueNumber = parseInt(currentValue, 10);
    if (!isNaN(currentValueNumber)) {
      const minNumber = Number(min);
      const maxNumber = Number(max);
      if (min && min > 0 && max && max > 0) {
        if (currentValueNumber < minNumber || currentValueNumber > maxNumber) {
          list.push(
            new ValidationResult(
              editorName,
              title,
              ValidationMessage.Error,
              validationMessage(config, "minMaxNumber", minNumber,
                maxNumber),
              currentValue
            )
          );
        }
      } else if (minNumber > 0 && currentValueNumber < minNumber) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            validationMessage(config, "minNumber", minNumber),
            currentValue
          )
        );
      } else if (maxNumber > 0 && currentValueNumber > maxNumber) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            validationMessage(config, "maxNumber", maxNumber),
            currentValue
          )
        );
      }
    } else {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          requiredMessage || validationMessage(config, "number"),
          currentValue
        )
      );
    }
  } else if (type === Input.Decimal && ((min && min > 0) || (max && max > 0))) {
    const currentValueNumber = parseFloat(currentValue);
    if (!isNaN(currentValueNumber)) {
      const minNumber = Number(min);
      const maxNumber = Number(max);
      if (min && min > 0 && max && max > 0) {
        if (currentValueNumber < minNumber || currentValueNumber > maxNumber) {
          list.push(
            new ValidationResult(
              editorName,
              title,
              ValidationMessage.Error,
              validationMessage(config, "minMaxNumber", minNumber,
                maxNumber),
              currentValue
            )
          );
        }
      } else if (minNumber > 0 && currentValueNumber < minNumber) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            validationMessage(config, "minNumber", minNumber),
            currentValue
          )
        );
      } else if (maxNumber > 0 && currentValueNumber > maxNumber) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            validationMessage(config, "maxNumber", maxNumber),
            currentValue
          )
        );
      }
    } else {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          requiredMessage || validationMessage(config, "number"),
          currentValue
        )
      );
    }
  } else if (type === Input.Email) {
    const rule = resolveValidator(props, config, "email");
    if (typeof rule === "function") {
      const result = runValidator(rule, currentValue, context);
      if (result !== true) fail(result === false ? validationMessage(config, "email") : result);
    } else if (rule !== false && !isValidEmail(currentValue, config)) {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          validationMessage(config, "email"),
          currentValue
        )
      );
    }
  } else if (isPhoneType(type) || type === Input.Url) {
    // no built-in rule: only a configured `validators.phone` / `validators.url`
    const key = type === Input.Url ? "url" : "phone";
    const rule = resolveValidator(props, config, key);
    if (typeof rule === "function") {
      const result = runValidator(rule, currentValue, context);
      if (result !== true) fail(result === false ? validationMessage(config, key) : result);
    }
  } else if (type === Input.File) {
    if (currentValue) {
      if (multiple && currentValue.length > maxFiles) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            validationMessage(config, "totalFilesAllowedExceeded", maxFiles),
            currentValue
          )
        );
      }
      for (let i = 0; i < currentValue.length; i++) {
        const file = currentValue[i];
        if (file.size > maxFileSize) {
          list.push(
            new ValidationResult(
              editorName,
              title,
              ValidationMessage.Error,
              validationMessage(config, "fileSizeExceededMaxAllowed", file.name,
                bytesToHumanReadable(maxFileSize)),
              currentValue
            )
          );
        }
      }
    }
  }
  return list;
}

export function classNames(
  ...args: (ClassValue | ClassDictionary | ClassArray)[]
): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "string" || typeof arg === "number") {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = classNames(...arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (typeof arg === "object") {
      if (arg.toString !== Object.prototype.toString) {
        classes.push(arg.toString());
      } else {
        for (const key in arg) {
          if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
            classes.push(key);
          }
        }
      }
    }
  }

  return classes.join(" ");
}
