/**
 * Util funtions
 */

import {
  CharacterCasing,
  IconPosition,
  Input,
  ScreenSize,
  TextInput,
  TooltipPosition,
  ValidationMessage,
  ValueType,
} from "../types";
import { EditorPropType } from "../Editor/EditorPropType";
import { ValidationResult } from "../ValidationResult";

import { configManager } from "../config/configManager";

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
  let decimalPart = parts[1];

  if (thousandsSeparator) {
    wholeNumber = wholeNumber.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandsSeparator
    );
  }

  return wholeNumber + decimalSeparator + decimalPart;
}

export function getDefaultHasIcon(type: Input) {
  return (
    type === Input.Mobile ||
    type === Input.Phone ||
    type === Input.Fax ||
    type === Input.Money ||
    type === Input.Percent ||
    type === Input.Password ||
    type === Input.Email ||
    type === Input.Date ||
    type === Input.Time ||
    type === Input.Card ||
    type === Input.FastSearch
  );
}

export function getDefaultIconPosition(type: Input): IconPosition {
  const config = configManager.getConfig();

  // ✅ NOVO CAMINHO: config.resources.iconsPosition
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
    case Input.Time:
      return iconsPosition.time === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.Card:
      return iconsPosition.card === "start"
        ? IconPosition.Start
        : IconPosition.End;
    case Input.FastSearch:
      return iconsPosition.fastSearch === "start"
        ? IconPosition.Start
        : IconPosition.End;
  }
  return IconPosition.Start;
}

export function getDefaultIcon(type: Input) {
  const config = configManager.getConfig();

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
    case Input.Time:
      return icons.time;
    case Input.Card:
      return icons.card;
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
      return ValueType.Float;
    case Input.Integer:
      return ValueType.Integer;
    case Input.CheckBox:
      return ValueType.Boolean;
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
function getDateFormatted(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}
export function getEditorAttributes(
  props: EditorPropType,
  isInvalid: boolean,
  editorValue: any,
  showPassword: boolean
): Record<string, any> {
  const config = configManager.getConfig();
  const {
    type = Input.Text,
    className,
    sm,
    md,
    lg,
    xl,
    xxl,
    size,
    children,
    id,
    name,
    createRow = false,
    title,
    checkBoxText = "",
    required = false,
    value,
    placeholder,
    hasTitle = true,
    titleBold,
    enabled = true,
    readOnly = false,
    inline = false,
    rows,
    input,
    characterCasing = CharacterCasing.Upper,
    max,
    min,
    maxDate,
    minDate,
    mask,
    getMaskedValue = false,
    hasIcon = getDefaultHasIcon(props.type),
    iconPosition = getDefaultIconPosition(props.type),
    appendIcon = getDefaultIcon(props.type),
    prependIcon = getDefaultIcon(props.type),
    invalid,
    tooltip,
    toolTipPosition = TooltipPosition.Top,
    invalidMessage,
    requiredMessage,
    accept,
    multiple = false,
    skipSubmit = false,
    optionsId = config.behavior.select.optionsId,
    optionsDescription = config.behavior.select.optionsDescription,
    optionsFirstSelected = config.behavior.select.optionsFirstSelected,
    optionsNoneSelectedValue = config.behavior.select.optionsNoneSelectedValue,
    optionsNoneSelectedText = config.components.select.texts
      .optionsNoneSelectedText,
    options,
    thousandsSeparator = config.behavior.input.thousandsSeparator,
    decimalSeparator = config.behavior.input.decimalSeparator,
    formState,
    dispatchFormState,
    validateOnBlur = config.behavior.validation.validateOnBlur,
    validateOnChange = false,
    validateDefaultOnBlur = true,
    validateDefaultOnChange = true,
    validateDefaultOnSubmit = config.behavior.validation.validateOnSubmit,
    customValidationOnBlur,
    customValidationOnChange,
    customValidationOnSubmit,
    onChange,
    onBlur,
    showValidationResultOnSubmit = config.behavior.validation.validateOnSubmit,
    ...attributes
  } = props;
  let editorMask = mask;
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
    case Input.Time:
      {
        editorAttributes["type"] = "text";
        editorAttributes["data-autoclose"] = "true";
        editorAttributes["readOnly"] = "";
        editorAttributes["data-time"] = "true";
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
        if (!placeholder && config.components.editor.placeHolders.phone) {
          editorAttributes["placeholder"] =
            config.components.editor.placeHolders.phone;
        }
        if (!editorMask && config.resources.masks.phone) {
          editorMask = config.resources.masks.phone;
        }
      }
      break;
    case Input.Select:
      {
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
    editorAttributes["data-mask"] = editorMask;
  }
  if (type !== Input.File) {
    if (min && min > 0) {
      if (type !== Input.Integer) {
        editorAttributes["minLength"] = String(min);
      } else {
        editorAttributes["min"] = String(min);
      }
    }
    if (max && max > 0) {
      let maskLength = (editorMask ?? "").length;
      if (type !== Input.Integer) {
        editorAttributes["maxLength"] = String(Math.max(max, maskLength));
      } else {
        editorAttributes["max"] = String(Math.max(max, maskLength));
      }
    }
    if (placeholder) {
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
  editorMask: string,
  maskedValue,
  thousandsSeparator: string,
  decimalSeparator: string
) {
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
  editorMask: string,
  input: any,
  thousandsSeparator: string,
  decimalSeparator: string,
  decimalPlaces: number
) {
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
    let numericValue = parseFloat(input);
    let wholeNumber = 0;
    let decimalNumber = 0;
    if (numericValue >= Math.pow(10, decimalPlaces)) {
      wholeNumber = parseInt(numericValue.toString().slice(0, -decimalPlaces));
      decimalNumber = parseInt(numericValue.toString().slice(-decimalPlaces));
    } else {
      decimalNumber = numericValue;
    }
    var number = parseFloat(
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
export function validateEditorInputValue(
  currentValue: any,
  props: EditorPropType,
  editorMask?: string
) {
  const config = configManager.getConfig();
  const {
    type = Input.Text,
    id,
    name,
    title,
    required = false,
    max,
    min,
    maxFiles,
    multiple,
    maxFileSize,
    requiredMessage,
  } = props;
  const editorName = name || id;
  let list: ValidationResult[] = [];

  if (
    !currentValue ||
    (currentValue instanceof FileList && currentValue.length === 0)
  ) {
    if (required) {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          requiredMessage || config.resources.validationMessages.required, // ✅ CAMINHO ATUALIZADO
          currentValue
        )
      );
    }
  } else if (
    (type === Input.Text || type === Input.LongText) &&
    ((min && min > 0) || (max && max > 0))
  ) {
    const currentValueString = String(currentValue);
    let maskLength = (editorMask ?? "").length;
    let minCharacter = Number(min);
    let maxCharacter = Math.max(max, maskLength);
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
            parameterizedString(
              config.resources.validationMessages.minMaxCharacters, // ✅ CAMINHO ATUALIZADO
              minCharacter,
              maxCharacter
            ),
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
            ? parameterizedString(
                config.resources.validationMessages.minCharacters,
                minCharacter
              ) // ✅ CAMINHO ATUALIZADO
            : config.resources.validationMessages.minCharacter, // ✅ CAMINHO ATUALIZADO
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
            ? parameterizedString(
                config.resources.validationMessages.maxCharacters,
                maxCharacter
              ) // ✅ CAMINHO ATUALIZADO
            : config.resources.validationMessages.maxCharacter, // ✅ CAMINHO ATUALIZADO
          currentValue
        )
      );
    }
  } else if (type === Input.Integer && ((min && min > 0) || (max && max > 0))) {
    let currentValueNumber = parseInt(currentValue, 10);
    if (!isNaN(currentValueNumber)) {
      let minNumber = Number(min);
      let maxNumber = Number(max);
      if (min && min > 0 && max && max > 0) {
        if (currentValueNumber < minNumber || currentValueNumber > maxNumber) {
          list.push(
            new ValidationResult(
              editorName,
              title,
              ValidationMessage.Error,
              parameterizedString(
                config.resources.validationMessages.minMaxNumber, // ✅ CAMINHO ATUALIZADO
                minNumber,
                maxNumber
              ),
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
            parameterizedString(
              config.resources.validationMessages.minNumber,
              minNumber
            ), // ✅ CAMINHO ATUALIZADO
            currentValue
          )
        );
      } else if (maxNumber > 0 && currentValueNumber > maxNumber) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            parameterizedString(
              config.resources.validationMessages.maxNumber,
              maxNumber
            ), // ✅ CAMINHO ATUALIZADO
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
          requiredMessage || config.resources.validationMessages.number, // ✅ CAMINHO ATUALIZADO
          currentValue
        )
      );
    }
  } else if (type === Input.Decimal && ((min && min > 0) || (max && max > 0))) {
    let currentValueNumber = parseFloat(currentValue);
    if (!isNaN(currentValueNumber)) {
      let minNumber = Number(min);
      let maxNumber = Number(max);
      if (min && min > 0 && max && max > 0) {
        if (currentValueNumber < minNumber || currentValueNumber > maxNumber) {
          list.push(
            new ValidationResult(
              editorName,
              title,
              ValidationMessage.Error,
              parameterizedString(
                config.resources.validationMessages.minMaxNumber, // ✅ CAMINHO ATUALIZADO
                minNumber,
                maxNumber
              ),
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
            parameterizedString(
              config.resources.validationMessages.minNumber,
              minNumber
            ), // ✅ CAMINHO ATUALIZADO
            currentValue
          )
        );
      } else if (maxNumber > 0 && currentValueNumber > maxNumber) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            parameterizedString(
              config.resources.validationMessages.maxNumber,
              maxNumber
            ), // ✅ CAMINHO ATUALIZADO
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
          requiredMessage || config.resources.validationMessages.number, // ✅ CAMINHO ATUALIZADO
          currentValue
        )
      );
    }
  } else if (type === Input.Email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(String(currentValue))) {
      list.push(
        new ValidationResult(
          editorName,
          title,
          ValidationMessage.Error,
          config.resources.validationMessages.email, // ✅ CAMINHO ATUALIZADO
          currentValue
        )
      );
    }
  } else if (type === Input.File) {
    if (currentValue) {
      if (multiple && currentValue.length > maxFiles) {
        list.push(
          new ValidationResult(
            editorName,
            title,
            ValidationMessage.Error,
            parameterizedString(
              config.resources.validationMessages.totalFilesAllowedExceeded, // ✅ CAMINHO ATUALIZADO
              maxFiles
            ),
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
              parameterizedString(
                config.resources.validationMessages.fileSizeExceededMaxAllowed, // ✅ CAMINHO ATUALIZADO
                file.name,
                bytesToHumanReadable(maxFileSize)
              ),
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
          if (arg.hasOwnProperty(key) && arg[key]) {
            classes.push(key);
          }
        }
      }
    }
  }

  return classes.join(" ");
}
