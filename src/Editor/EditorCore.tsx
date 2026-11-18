import React, {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  ariaEnabled,
  cx,
  dataAttrs,
  instanceClassesLast,
  nodeToText,
  renderIcon,
  shouldRenderIconSlot,
  translateText,
  withSlot,
} from "../Utils/styling";

import {
  IconPosition,
  Input,
  TextInput,
  TooltipPosition,
  ValidationMessage,
  ValueType,
} from "../types";
import { ValidationResult } from "../ValidationResult";
import {
  applyMask,
  getDefaultHasIcon,
  getDefaultIcon,
  getDefaultIconPosition,
  getEditorAttributes,
  getValueAsType,
  getValueType,
  mapToCssModules,
  removeMask,
  resolveEditorMask,
  validateEditorInputValue,
} from "../Utils/utils";
import { Chips } from "../Chips/Chips";
import { Column } from "../Column/Column";
import { Row } from "../Row/Row";
import { EditorPropType } from "./EditorPropType";
import { Label } from "../Label/Label";
import { CheckboxGroup } from "../CheckboxGroup/CheckboxGroup";
import { EditorInput } from "../EditorInput/EditorInput";
import { Radio } from "../Radio/Radio";
import Select from "../Select/Select";
import { EditorButton } from "../EditorButton/EditorButton";
import { useSmartConfig } from "../hook/useSmartConfig";
import { useContainerContext } from "../Container/ContainerContext";
import type {
  SmartRRenderSlots,
  SmartRSelectOption,
} from "../config/defaultConfig";
import type { SmartRValidateMode } from "../config/sharedConfig";

/** True for a change/blur event coming from a native `<input type="checkbox">`. */
function isNativeCheckboxEvent(event: any): boolean {
  return (
    !!event &&
    typeof event === "object" &&
    !!event.target &&
    event.target.type === "checkbox"
  );
}

export interface EditorRef {
  validate: () => Promise<ValidationResult[]>;
  getId: () => string;
  getName: () => string;
  getTitle: () => string;
  getValue: () => any;
  getSubmit: () => boolean;
  setErrorList: (list: ValidationResult[]) => void;
  /** Clears the validation messages (and the `afterSubmit` submitted state). */
  resetValidation?: () => void;
  forwardRef?: (ref: EditorRef | null) => void;
}

/**
 * Heavy controls the Editor renders for some types. The main entry passes the
 * real components (static imports, synchronous render — 1.1.0 behavior);
 * `smartr-ui/core` passes lazy wrappers so they are code-split.
 */
export interface EditorControls {
  /** `Input.Select` / `Input.FastSearch` with `loadOptions`. */
  AsyncSelect: React.ComponentType<any>;
  /** `Input.File`. */
  File: React.ComponentType<any>;
}

/**
 * The Editor component type: generic over the value type, so
 * `<Editor<boolean> onValueChange={(v) => …} />` is typed. Without a type
 * argument `TValue` is `any` (it is never inferred from the props), exactly
 * as before.
 */
export type EditorComponent = (<TValue = any>(
  props: EditorPropType<TValue> & React.RefAttributes<EditorRef>
) => React.ReactElement | null) & { displayName?: string };

let autoIdCounter = 0;

/**
 * Returns a stable function that always runs the latest `fn` (no stale
 * closures, no dependency list to keep in sync).
 */
function useLatestCallback<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback(((...args: any[]) => fnRef.current(...args)) as T, []);
}

/** Normalizes the `errors` prop into a list of non-empty messages. */
function toErrorList(errors: any): React.ReactNode[] {
  const list = Array.isArray(errors) ? errors : [errors];
  return list.filter(
    (e) => e !== undefined && e !== null && e !== false && e !== ""
  );
}

/** Builds an Editor bound to the given heavy controls. */
export function createEditor(controls: EditorControls): EditorComponent {
  const { AsyncSelect, File } = controls;
  const EditorImpl = forwardRef<EditorRef, EditorPropType>((props, ref) => {
  const config = useSmartConfig();
  const { registerEditor, unregisterEditor, isSubmitted } = useContainerContext();
  const {
    type = Input.Text,
    className,
    sm,
    md,
    lg,
    xl,
    xxl,
    size,

    labelSm,
    labelMd,
    labelLg,
    labelXl,
    labelXxl,
    labelSize,

    children,
    id,
    name,
    createRow = false,
    createColumn = true,
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
    horizontal = false,
    rows,
    input,
    valueType = getValueType(props.type),
    // destructured to keep them out of `attributes` (used by the helpers)
    characterCasing,
    maxFileSize,
    phoneCountry,
    validators,
    maxFilesPlaceholder = config.behavior.file.maxFilesPlaceholder,
    max,
    min,
    minDate,
    maxDate,
    mask,
    getMaskedValue = false,
    enableShowPassword = config.behavior.input.showPasswordIcon,
    showPasswordIconPosition = IconPosition.End,
    showPasswordIcon = config.resources.icons.showPassword,
    hidePasswordIcon = config.resources.icons.hidePassword,
    hasIcon = getDefaultHasIcon(
      props.type,
      typeof props.loadOptions === "function"
    ),
    iconPosition = getDefaultIconPosition(props.type, config),
    appendIcon = getDefaultIcon(props.type, config),
    prependIcon = getDefaultIcon(props.type, config),
    classNames: slots = {},
    render: renderProp,
    invalid,
    tooltip,
    toolTipPosition = TooltipPosition.Top,
    note,
    noteClassName,
    invalidMessage,
    requiredMessage,
    accept,
    fileUrlDownload,
    fileDownloadName,
    prependButtons,
    appendButtons,
    optionsId = config.behavior.select.optionsId,
    optionsDescription = config.behavior.select.optionsDescription,
    optionsToolTip = config.behavior.select.optionsToolTip,
    optionsGroup = config.behavior.select.optionsGroup,
    optionGetDescription,
    optionGetGroup,
    optionsFirstSelected = config.behavior.select.optionsFirstSelected,
    optionsNoneSelectedValue = config.behavior.select.optionsNoneSelectedValue,
    optionsNoneSelectedText = translateText(
      config,
      "select.texts.optionsNoneSelectedText",
      config.components.select.texts.optionsNoneSelectedText
    ),
    options,
    optionsFilter = false,
    optionsGrouped = false,
    optionsMultiple = false,
    optionsMultipleSeparatorValue = config.behavior.select
      .optionsMultipleSeparatorValue,
    optionsMultipleSeparatorDescription = config.behavior.select
      .optionsMultipleSeparatorDescription,
    optionsLimiteDescriptionSelected = config.behavior.select
      .optionsLimiteDescriptionSelected,
    optionsFilterPlaceholder = translateText(
      config,
      "select.texts.filterPlaceholder",
      config.components.select.texts.filterPlaceholder
    ),
    optionRenderer,
    loadOptions,
    loadSelectedOption,
    selectedOption,
    pageSize = config.behavior.select.pageSize,
    searchDebounceMs = config.behavior.select.searchDebounceMs,
    minSearchLength,
    loadOnOpen,
    reloadToken,
    showNoneOption,
    onSearchChange,
    onOpen,
    renderEmpty,
    renderError,
    renderLoading,
    thousandsSeparator = config.behavior.input.thousandsSeparator,
    decimalSeparator = config.behavior.input.decimalSeparator,
    decimalPlaces = config.behavior.input.decimalPlaces,
    skipSubmit = false,
    state,
    dispatchState,
    formState,
    dispatchFormState,
    listFormState,
    listFormIndex,
    dispatchListFormState,
    validateOnBlur = config.behavior.validation.validateOnBlur,
    validateOnChange = false,
    validateMode,
    validateDefaultOnBlur = true,
    validateDefaultOnChange = true,
    validateDefaultOnSubmit = config.behavior.validation.validateOnSubmit,
    customValidationOnBlur,
    customValidationOnChange,
    customValidationOnSubmit,
    onDownloadFileClick,
    onDeleteFileClick,
    onChange,
    onValueChange,
    onBlur,
    showValidationResultOnSubmit = config.behavior.validation.validateOnSubmit,
    errors,
    layout = "default",
    ...attributes
  } = props;
  const isSwitchLayout = layout === "switch";
  const isChips = type === Input.Chips;

  // Modo assíncrono: ativado quando o consumidor informa loadOptions.
  // FastSearch tem defaults de autocomplete (só busca depois de digitar).
  const isAsyncSelect = typeof loadOptions === "function";
  const isFastSearch = type === Input.FastSearch;
  const asyncMinSearchLength =
    minSearchLength ??
    (isFastSearch
      ? config.behavior.select.fastSearchMinSearchLength
      : config.behavior.select.minSearchLength);
  const asyncLoadOnOpen =
    loadOnOpen ??
    (isFastSearch
      ? config.behavior.select.fastSearchLoadOnOpen
      : config.behavior.select.loadOnOpen);

  const inputRadioRefs = useRef([]);
  const inputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);
  const [validationList, setValidationList] = useState<ValidationResult[]>();
  const [isInvalid, setIsInvalid] = useState(invalid);
  // Re-sync with the `invalid` prop when the parent changes it after mount
  // (server / cross-field errors). Same-render update: no flash.
  const [prevInvalidProp, setPrevInvalidProp] = useState(invalid);
  if (prevInvalidProp !== invalid) {
    setPrevInvalidProp(invalid);
    setIsInvalid(invalid);
  }
  // External error messages (`errors` prop) also drive the invalid state
  const externalErrors = toErrorList(errors);
  const invalidState = !!isInvalid || externalErrors.length > 0;
  const autoIdRef = useRef<string | undefined>(undefined);
  if (!autoIdRef.current) autoIdRef.current = `smartr-editor-${++autoIdCounter}`;
  const [showPassword, setShowPassword] = useState(false);
  // Last checked state reported by a (custom) checkbox control
  const lastCheckedRef = useRef<boolean | undefined>(undefined);
  const editorName = name || id;
  let editorValue = value;
  // `mask={false}`, `phoneCountry`, `mask="phone-br"`, the global phone mask…
  const editorMask = resolveEditorMask(props, config);

  // Validation mode (`validateMode` prop / `behavior.validation.validateMode`).
  // Unset: the 1.1.0 `validateOnBlur` / `validateOnChange` behavior.
  const [submittedSelf, setSubmittedSelf] = useState(false);
  const mode: SmartRValidateMode | undefined =
    validateMode ?? (config.behavior.validation as any).validateMode;
  const submitted = submittedSelf || !!isSubmitted?.();
  const liveAfterSubmit = mode === "afterSubmit" && submitted;
  let blurValidation = validateOnBlur;
  let changeValidation = validateOnChange;
  if (mode) {
    blurValidation = mode === "blur" || liveAfterSubmit;
    changeValidation = mode === "change" || liveAfterSubmit;
    // explicit props win over the mode
    if (props.validateOnBlur !== undefined) blurValidation = props.validateOnBlur;
    if (props.validateOnChange !== undefined) changeValidation = props.validateOnChange;
  }

  /** Value conversion; `Input.Chips` with `ValueType.Array` yields `[]` when empty. */
  function convertValue(rawValue: any) {
    if (
      isChips &&
      valueType === ValueType.Array &&
      (rawValue === undefined || rawValue === null || rawValue === "")
    ) {
      return [];
    }
    return getValueAsType(valueType, rawValue, optionsMultipleSeparatorValue);
  }

  if (!editorValue) {
    editorValue = getStateValue();
  }
  if (type === Input.CheckBox && editorValue !== undefined) {
    lastCheckedRef.current = !!editorValue;
  }
  function getStateValue() {
    let value;
    if (editorName) {
      if (formState) {
        value = formState[editorName];
      } else if (
        listFormState &&
        listFormIndex !== undefined &&
        listFormIndex < listFormState.length
      ) {
        value = listFormState[listFormIndex][editorName];
      }
    } else if (state && state !== null && state !== undefined) {
      value = state;
    }
    return value;
  }
  function setStateValue(inputName: string, value: any) {
    // Atualização de um único formulário
    if (inputName && formState && dispatchFormState) {
      dispatchFormState((prevState) => {
        const newState = {
          ...prevState,
          [inputName]: value,
        };
        return newState;
      });
    }
    // Atualização de uma lista de formulários
    else if (
      listFormState &&
      dispatchListFormState &&
      listFormIndex !== undefined &&
      listFormIndex < listFormState.length
    ) {
      const newState = listFormState.map((item, index) => {
        if (index === listFormIndex) {
          const updatedItem = {
            ...item,
            [inputName]: value,
          };
          return updatedItem;
        }
        return item;
      });
      dispatchListFormState(newState);
    }
    // Atualização de estado genérico
    else if (dispatchState) {
      dispatchState((prevState) => {
        return value;
      });
    }
  }

  // Plain-text title (validation results, getTitle) when `title` is a React node
  const titleIsText = title === undefined || title === null || typeof title === "string";
  const titleText: any = titleIsText ? title : nodeToText(title);

  function validateInput(currentValue: any) {
    const list: ValidationResult[] = validateEditorInputValue(
      currentValue,
      titleIsText ? props : ({ ...props, title: titleText } as any),
      editorMask,
      config
    );
    setIsInvalid(list.length > 0);
    return list;
  }
  function getName() {
    return editorName;
  }
  function getId() {
    return id;
  }
  function getSubmit() {
    return !skipSubmit;
  }
  function getTitle() {
    return titleText;
  }

  /**
   * Reads the checked state of the checkbox control. Native inputs behave as
   * in 1.1.0; custom controls (render slot) are duck-typed: any ref exposing
   * `checked`, then an element with `aria-checked` (e.g. a Radix/shadcn
   * `<button role="checkbox">`), then the last value reported via onChange.
   */
  function readCheckedFromRef(current: any) {
    if (current instanceof HTMLInputElement) {
      return current.checked;
    }
    if (current && "checked" in current && current.checked !== undefined) {
      return current.checked === true;
    }
    if (current && typeof current.getAttribute === "function") {
      const ariaChecked = current.getAttribute("aria-checked");
      if (ariaChecked !== null) return ariaChecked === "true";
    }
    return lastCheckedRef.current;
  }

  function setErrorList(list: ValidationResult[]) {
    setValidationList(list);
    setIsInvalid(list.length > 0);
  }
  function resetValidation() {
    setValidationList(undefined);
    setIsInvalid(invalid);
    setSubmittedSelf(false);
  }
  function getValue() {
    let currentValue;

    if (inputRef?.current) {
      switch (type) {
        case Input.Radio:
          {
            for (const ref of inputRadioRefs.current) {
              if (ref.current instanceof HTMLInputElement) {
                if (ref.current.checked) {
                  currentValue = ref.current.value;
                }
              }
            }
          }
          break;
        case Input.CheckBox:
          {
            currentValue = readCheckedFromRef(inputRef.current);
          }
          break;
        case Input.File:
          {
            if (inputRef.current instanceof HTMLInputElement) {
              currentValue = inputRef?.current?.files;
            }
          }
          break;
        case Input.Chips:
          {
            // the checked chips of the group
            const group: any = inputRef.current;
            currentValue =
              typeof group.querySelectorAll === "function"
                ? Array.from(
                    group.querySelectorAll('input[type="checkbox"]:checked') as ArrayLike<HTMLInputElement>
                  )
                    .map((input) => input.value)
                    .join(optionsMultipleSeparatorValue)
                : getStateValue();
          }
          break;
        default:
          {
            currentValue = inputRef?.current?.value;
          }
          break;
      }
    } else {
      currentValue = getStateValue();
    }

    if (
      (editorMask ||
        type === Input.Money ||
        type === Input.Decimal ||
        type === Input.Percent) &&
      currentValue &&
      !getMaskedValue
    ) {
      currentValue = removeMask(
        type,
        editorMask,
        currentValue,
        thousandsSeparator,
        decimalSeparator
      );
    }

    return convertValue(currentValue);
  }
  async function validate(): Promise<ValidationResult[]> {
    let list: ValidationResult[] = [];
    // `afterSubmit`: from now on this Editor validates live
    if (mode === "afterSubmit" && !submittedSelf) setSubmittedSelf(true);
    const currentValue = getValue();
    if (validateDefaultOnSubmit) {
      list = validateInput(currentValue);
    }
    if (customValidationOnSubmit) {
      const customValidationResults = await customValidationOnSubmit(
        currentValue
      );
      list = [...list, ...customValidationResults];
    }
    if (showValidationResultOnSubmit) {
      setValidationList(list);
      setIsInvalid(list.length > 0);
    }
    // External `errors` are part of the result (not of the rendered list,
    // which shows them separately) unless turned off in the configuration
    if (
      (config.behavior.validation as any).includeExternalErrors !== false &&
      externalErrors.length > 0
    ) {
      return [
        ...list,
        ...externalErrors.map(
          (error) =>
            new ValidationResult(
              editorName,
              titleText,
              ValidationMessage.Error,
              nodeToText(error),
              currentValue
            )
        ),
      ];
    }
    return Promise.resolve(list);
  }

  // The instance registered in a Container always calls the latest functions
  // (latest props: min/max, messages, `errors`…), whatever render registered it.
  const selfRef = useRef<EditorRef>(null as any);
  selfRef.current = {
    validate,
    getName,
    getId,
    getTitle,
    getValue,
    getSubmit,
    setErrorList,
    resetValidation,
  };
  useEffect(() => {
    if (editorName) {
      const editorInstance: EditorRef = {
        validate: () => selfRef.current.validate(),
        getName: () => selfRef.current.getName(),
        getId: () => selfRef.current.getId(),
        getTitle: () => selfRef.current.getTitle(),
        getValue: () => selfRef.current.getValue(),
        getSubmit: () => selfRef.current.getSubmit(),
        setErrorList: (list) => selfRef.current.setErrorList(list),
        resetValidation: () => selfRef.current.resetValidation?.(),
      };

      registerEditor(editorInstance);

      return () => {
        unregisterEditor(editorInstance);
      };
    }
  }, [
    editorName,
    title,
    options,
    skipSubmit,
    required,
    tooltip,
    mask,
    valueType,
    type,
    validateDefaultOnSubmit,
    customValidationOnSubmit,
  ]);
  useImperativeHandle(ref, () => ({
    validate,
    getName,
    getId,
    getTitle,
    getValue,
    getSubmit,
    setErrorList,
    resetValidation,
  }));

  // Handlers: stable identity, always the latest props (no stale closures)
  const handleInputChange = useLatestCallback(
    async (eventOrChecked: React.ChangeEvent<HTMLInputElement> | any) => {
      let event: any = eventOrChecked;
      // Custom checkbox controls (render slot) may report a bare boolean
      // (e.g. Radix/shadcn `onCheckedChange`) or `{ target: { checked } }`
      // without a native `type`: normalize them into a change-event shape.
      if (type === Input.CheckBox && !isNativeCheckboxEvent(eventOrChecked)) {
        const rawChecked =
          eventOrChecked && typeof eventOrChecked === "object"
            ? eventOrChecked.target
              ? eventOrChecked.target.checked
              : eventOrChecked.checked
            : eventOrChecked;
        const target = {
          ...(eventOrChecked?.target || {}),
          name: eventOrChecked?.target?.name || editorName,
          id: eventOrChecked?.target?.id || id,
          type: "checkbox",
          checked: rawChecked === true,
          value: rawChecked === true,
        };
        event = { ...(typeof eventOrChecked === "object" ? eventOrChecked : {}), target };
      }

      const {
        name: targetName,
        value,
        files,
        type: inputCheckedType,
        checked,
      } = event.target;
      // Custom controls may omit `name` in the reported target
      const name = targetName || editorName;

      let newValue: any = files ?? value;
      // Se o tipo for checkbox ou radio, usa o valor de "checked"
      if (inputCheckedType === "checkbox") {
        newValue = checked;
        if (type === Input.CheckBox) lastCheckedRef.current = !!checked;
      }

      // Aplica máscara se for necessário e o tipo for diferente de file, checkbox ou radio
      if (
        (editorMask ||
          type === Input.Money ||
          type === Input.Decimal ||
          type === Input.Percent) &&
        type !== Input.File &&
        type !== Input.CheckBox &&
        type !== Input.Radio
      ) {
        newValue = applyMask(
          type,
          editorMask,
          newValue,
          thousandsSeparator,
          decimalSeparator,
          decimalPlaces
        );
      }

      // Seta o valor no input ref, exceto se for file, checkbox ou radio
      if (
        inputRef.current &&
        type !== Input.File &&
        type !== Input.CheckBox &&
        type !== Input.Radio &&
        type !== Input.Chips
      ) {
        inputRef.current.value = newValue || "";
      }

      // Conversão de valor conforme o tipo
      const changedValueType = convertValue(newValue);

      // Validação, se necessário
      if (changeValidation) {
        // `afterSubmit` (after the first submit): the submit rules, live
        const runDefault = liveAfterSubmit
          ? validateDefaultOnSubmit
          : validateDefaultOnChange;
        const customValidation = liveAfterSubmit
          ? customValidationOnChange ?? customValidationOnSubmit
          : customValidationOnChange;
        let list: ValidationResult[] = [];
        if (runDefault) {
          list = validateInput(changedValueType);
        }
        if (customValidation) {
          const customValidationResults = await customValidation(
            changedValueType
          );
          list = [...list, ...customValidationResults];
        }
        setValidationList(list);
        setIsInvalid(list.length > 0);
      }

      // Remove a máscara se necessário
      if (
        editorMask &&
        newValue &&
        !getMaskedValue &&
        type !== Input.File &&
        type !== Input.CheckBox &&
        type !== Input.Radio
      ) {
        newValue = removeMask(
          type,
          editorMask,
          newValue,
          thousandsSeparator,
          decimalSeparator
        );
      }

      const stateValue = convertValue(newValue);
      setStateValue(name, stateValue);

      if (onChange) {
        onChange(event, convertValue(newValue), id, name, type);
      }
      if (onValueChange) {
        onValueChange(convertValue(newValue), event);
      }
    }
  );

  const handleInputBlur = useLatestCallback(
    async (event: React.FocusEvent<HTMLInputElement>) => {
      // Custom controls may call onBlur() without an event
      const { name, value, files } = (event?.target || {}) as any;
      let newValue: any = files ?? value;
      // Custom (non-native) checkbox: validate the checked state
      if (type === Input.CheckBox && !isNativeCheckboxEvent(event)) {
        newValue = readCheckedFromRef(inputRef.current);
      }
      let validationValue = newValue;
      if (blurValidation) {
        if (editorMask && validationValue && !getMaskedValue) {
          validationValue = removeMask(
            type,
            editorMask,
            validationValue,
            thousandsSeparator,
            decimalSeparator
          );
        }
        validationValue = convertValue(validationValue);
        // `afterSubmit` (after the first submit): the submit rules, live
        const runDefault = liveAfterSubmit
          ? validateDefaultOnSubmit
          : validateDefaultOnBlur;
        const customValidation = liveAfterSubmit
          ? customValidationOnBlur ?? customValidationOnSubmit
          : customValidationOnBlur;
        let list: ValidationResult[] = [];
        if (runDefault) {
          list = validateInput(validationValue);
        }
        if (customValidation) {
          const customValidationResults = await customValidation(
            validationValue
          );
          list = [...list, ...customValidationResults];
        }
        setValidationList(list);
        setIsInvalid(list.length > 0);
      }
      if (onBlur) {
        onBlur(event, validationValue, id, name, type);
      }
    }
  );

  // Callback for handling key down events on text inputs.
  // This method validates the key pressed based on the expected input type.
  const handleInputKeyDown = useLatestCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Only process if the input is of type 'Input.Text' and a specific text input type is defined.
      if (type !== Input.Text || input === undefined) return;

      // Define allowed control keys that should always be permitted (e.g., navigation and editing keys).
      const allowedControlKeys = [
        "Backspace",
        "ArrowLeft",
        "ArrowRight",
        "Delete",
        "Tab",
        "Enter",
        "Escape",
        "Home",
        "End",
      ];

      // If CTRL is pressed, allow the key combination (this enables CTRL+V, CTRL+C, etc.)
      if (event.ctrlKey) return;

      // Switch based on the specific text input type to enforce different validation rules.
      switch (input) {
        case TextInput.Integer: {
          // For Integer input: allow only digits (0-9).
          if (allowedControlKeys.includes(event.key)) return;
          if (!/^[0-9]$/.test(event.key)) {
            event.preventDefault();
          }
          break;
        }
        case TextInput.Decimal: {
          // For Decimal input: allow only digits and one decimal point.
          if (allowedControlKeys.includes(event.key)) return;
          if (event.key === ".") {
            // Prevent multiple decimal points.
            if (event.currentTarget.value.includes(".")) {
              event.preventDefault();
            }
            return;
          }
          if (!/^[0-9]$/.test(event.key)) {
            event.preventDefault();
          }
          break;
        }
        case TextInput.Letter: {
          // For Letter input: allow only alphabet characters (A-Z and a-z).
          if (allowedControlKeys.includes(event.key)) return;
          if (!/^[a-zA-Z]$/.test(event.key)) {
            event.preventDefault();
          }
          break;
        }
        case TextInput.AlphaNumeric: {
          // For AlphaNumeric input: allow only letters and digits.
          if (allowedControlKeys.includes(event.key)) return;
          if (!/^[a-zA-Z0-9]$/.test(event.key)) {
            event.preventDefault();
          }
          break;
        }
        default:
          break;
      }
    }
  );

  // Callback for handling paste events on text inputs.
  // This method validates the pasted text based on the expected input type before it is inserted.
  const handleInputPaste = useLatestCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      // Only process if the input is of type 'Input.Text' and a specific text input type is defined.
      if (type !== Input.Text || input === undefined) return;

      // Retrieve the text being pasted from the clipboard.
      const pastedText = event.clipboardData.getData("text");

      // Switch based on the specific text input type to enforce different validation rules for pasted content.
      switch (input) {
        case TextInput.Integer: {
          // For Integer input: allow only pasted text containing digits (0-9).
          if (!/^[0-9]+$/.test(pastedText)) {
            event.preventDefault();
          }
          break;
        }
        case TextInput.Decimal: {
          // For Decimal input: allow only pasted text that is a valid decimal number.
          // This regex allows an optional sequence of digits, an optional decimal point, and one or more digits.
          if (!/^(?:[0-9]*\.?[0-9]+)$/.test(pastedText)) {
            event.preventDefault();
          }
          break;
        }
        case TextInput.Letter: {
          // For Letter input: allow only pasted text containing alphabet characters.
          if (!/^[a-zA-Z]+$/.test(pastedText)) {
            event.preventDefault();
          }
          break;
        }
        case TextInput.AlphaNumeric: {
          // For AlphaNumeric input: allow only pasted text containing letters and digits.
          if (!/^[a-zA-Z0-9]+$/.test(pastedText)) {
            event.preventDefault();
          }
          break;
        }
        default:
          break;
      }
    }
  );

  const onShowPasswordHandler = () => {
    setShowPassword(!showPassword);
  };

  let editorInput = null;
  let titleLabel = null;
  let noteLabel = null;

  let inputType = "input";
  const editorClassMap = config.components.editor.classes;
  let classes = editorClassMap.input;

  // `layout="switch"`: the checkbox text becomes the title on the left
  const labelTitle =
    isSwitchLayout && type === Input.CheckBox && !title ? checkBoxText : title;
  if (hasTitle && labelTitle) {
    titleLabel = (
      <Label
        id={id}
        htmlFor={id}
        title={labelTitle}
        titleBold={titleBold}
        required={required}
        tooltip={tooltip}
        toolTipPosition={toolTipPosition}
        horizontal={horizontal}
        size={horizontal ? labelSize : null}
        sm={horizontal ? labelSm : null}
        md={horizontal ? labelMd : null}
        lg={horizontal ? labelLg : null}
        xl={horizontal ? labelXl : null}
        xxl={horizontal ? labelXxl : null}
        labelClassName={slots.label}
        tooltipClassName={slots.tooltip}
      ></Label>
    );
  }

  switch (type) {
    case Input.Select:
      {
        inputType = "select";
        // per-control class (falls back to `input`, the 1.1.0 class)
        classes = editorClassMap.select ?? classes;
      }
      break;
    case Input.Radio:
      {
        classes = `${config.components.radio.classes.input}`;
      }
      break;
    case Input.CheckBox:
      {
        const checkboxClasses = config.components.checkbox.classes;
        classes = isSwitchLayout
          ? `${checkboxClasses.switch ?? checkboxClasses.input}`
          : `${checkboxClasses.input}`;
      }
      break;
    case Input.LongText:
      {
        inputType = "textarea";
        classes = editorClassMap.textarea ?? classes;
      }
      break;
    case Input.File:
      {
        classes = editorClassMap.file ?? classes;
      }
      break;
  }

  let innerChildren = null;
  let dataSource = [];
  if (type !== Input.Select) {
    if (editorValue) {
      const isNativeDateType =
        type === Input.Date ||
        type === Input.DateTime ||
        type === Input.Month;
      if (!isNativeDateType || !(editorValue instanceof Date)) {
        if (
          editorValue &&
          type !== Input.Label &&
          (editorMask ||
            type === Input.Money ||
            type === Input.Decimal ||
            type === Input.Percent)
        ) {
          editorValue = applyMask(
            type,
            editorMask,
            editorValue,
            thousandsSeparator,
            decimalSeparator,
            decimalPlaces
          );
        }
      } else {
        try {
          const year = editorValue.getFullYear();
          const month = ("0" + (editorValue.getMonth() + 1)).slice(-2);
          const day = ("0" + editorValue.getDate()).slice(-2);
          if (type === Input.Month) {
            editorValue = `${year}-${month}`;
          } else if (type === Input.DateTime) {
            const hours = ("0" + editorValue.getHours()).slice(-2);
            const minutes = ("0" + editorValue.getMinutes()).slice(-2);
            editorValue = `${year}-${month}-${day}T${hours}:${minutes}`;
          } else {
            editorValue = `${year}-${month}-${day}`;
          }
        } catch {
          // not a valid Date: keep the value as-is
        }
      }
    }
  } else if (options) {
    dataSource =
      options && typeof options[Symbol.iterator] === "function"
        ? [...options]
        : [];

    if (
      dataSource.every((element) => {
        const type = typeof element;
        return type !== "object" && type !== "function";
      })
    ) {
      dataSource = dataSource.map((value, index) => {
        const obj = {};
        obj[optionsId] = value;
        obj[optionsDescription] = value;
        return obj;
      });
    }
    if (!optionsFirstSelected) {
      const noneSelectOption = {};
      noneSelectOption[optionsId] = optionsNoneSelectedValue;
      noneSelectOption[optionsDescription] = optionsNoneSelectedText;
      dataSource.unshift(noneSelectOption);
      if (!editorValue && (editorValue === undefined || editorValue === null)) {
        editorValue = optionsNoneSelectedValue;
      }
    } else {
      if (!String(editorValue) && dataSource.length > 0) {
        editorValue = dataSource[0][optionsId];
      }
    }
  }

  if (type === Input.Select && !optionsFilter) {
    if (optionsGrouped) {
      // Lógica para opções agrupadas
      const groupedOptions = new Map<string, any[]>();

      // Agrupar as opções
      dataSource.forEach((option) => {
        const group = optionsGroup
          ? option[optionsGroup]
          : optionGetGroup
          ? optionGetGroup(option)
          : translateText(
              config,
              "select.texts.optionsNoGroup",
              config.components.select.texts.optionsNoGroup
            );

        if (!groupedOptions.has(group)) {
          groupedOptions.set(group, []);
        }
        groupedOptions.get(group)!.push(option);
      });

      // Criar elementos React agrupados
      innerChildren = Array.from(groupedOptions.entries()).map(
        ([groupName, groupOptions], groupIndex) => {
          const optionElements = groupOptions.map((option, optionIndex) => {
            return React.createElement(
              "option",
              {
                value: option[optionsId],
                key: `group-${groupIndex}-option-${optionIndex}`,
              },
              !optionGetDescription
                ? option[optionsDescription]
                : optionGetDescription(option)
            );
          });

          return React.createElement(
            "optgroup",
            {
              label: groupName,
              key: `group-${groupIndex}`,
            },
            optionElements
          );
        }
      );
    } else {
      // Lógica original para opções não agrupadas
      innerChildren = dataSource.map((option, index) => {
        return React.createElement(
          "option",
          { value: option[optionsId], key: index },
          !optionGetDescription ||
            (index === 0 && optionGetDescription && !optionsFirstSelected)
            ? option[optionsDescription]
            : optionGetDescription(option)
        );
      });
    }
  }

  // Select render slot: the options as data (same order/labels as the
  // native <option>s), so adapters don't have to parse `children`.
  let selectControlData: Record<string, any> | undefined;
  if (type === Input.Select) {
    const selectOptions: SmartRSelectOption[] = dataSource.map(
      (option, index) => {
        const isNone = !optionsFirstSelected && index === 0;
        const item: SmartRSelectOption = {
          value: option[optionsId],
          label:
            !optionGetDescription || isNone
              ? option[optionsDescription]
              : optionGetDescription(option),
        };
        if (isNone) {
          item.none = true;
        } else {
          item.source = option;
          if (option.disabled) item.disabled = true;
          const group = optionsGroup
            ? option[optionsGroup]
            : optionGetGroup
            ? optionGetGroup(option)
            : undefined;
          if (group !== undefined && group !== null && group !== "") {
            item.group = group;
          }
          const tip = optionsToolTip ? option[optionsToolTip] : undefined;
          if (tip !== undefined && tip !== null && tip !== "") {
            item.tooltip = tip;
          }
        }
        return item;
      }
    );
    selectControlData = {
      options: selectOptions,
      multiple: false,
      noneOption: !optionsFirstSelected
        ? { value: optionsNoneSelectedValue, label: optionsNoneSelectedText }
        : null,
    };
  }

  // Instance classes: legacy order (className first) for Bootstrap; after the
  // configured classes with `instanceClassesLast` / `mergeClasses`.
  const invalidClass = invalidState ? editorClassMap.invalid : null;
  classes = mapToCssModules(
    instanceClassesLast(config)
      ? cx(config, classes, className, invalidClass, slots.input)
      : cx(config, className, classes, invalidClass, slots.input)
  );

  // Validation / error messages (rendered below the control)
  const messages: { text: React.ReactNode; state: string; className: any }[] =
    [];
  const validationClasses = config.components.validation.classes;
  if (
    (invalid && invalidMessage) ||
    (validationList && validationList.length > 0)
  ) {
    if (invalidMessage) {
      messages.push({
        text: String(invalidMessage),
        state: "error",
        className: validationClasses.messageError,
      });
    }
    validationList?.forEach((item) => {
      let messageClassName = null;
      let messageState: string | undefined;
      switch (item.Type) {
        case ValidationMessage.Error:
          messageClassName = validationClasses.messageError;
          messageState = "error";
          break;
        case ValidationMessage.Success:
          messageClassName = validationClasses.messageSuccess;
          messageState = "success";
          break;
        case ValidationMessage.Warning:
          messageClassName = validationClasses.messageWarning;
          messageState = "warning";
          break;
      }
      messages.push({
        // never render the string "undefined" / "null"
        text:
          item.Message === undefined || item.Message === null
            ? ""
            : String(item.Message),
        state: messageState,
        className: messageClassName,
      });
    });
  }
  externalErrors.forEach((text) => {
    messages.push({
      text,
      state: "error",
      className: validationClasses.messageError,
    });
  });

  // ARIA wiring (non-Bootstrap presets, or `behavior.accessibility.aria`)
  const aria = ariaEnabled(config);
  const ariaBaseId = id || editorName || autoIdRef.current;
  const noteId = `${ariaBaseId}-note`;
  const messageId = (index: number) =>
    index === 0 ? `${ariaBaseId}-error` : `${ariaBaseId}-error-${index + 1}`;

  const editorAttributes = getEditorAttributes(
    props,
    invalidState,
    editorValue,
    showPassword,
    config
  );
  if (aria) {
    const describedBy = [
      (attributes as any)["aria-describedby"] || null,
      note ? noteId : null,
      ...messages.map((_, index) => messageId(index)),
    ]
      .filter(Boolean)
      .join(" ");
    if (describedBy) editorAttributes["aria-describedby"] = describedBy;
  }
  // State data-attributes on the control (only when enabled in config)
  Object.assign(
    editorAttributes,
    dataAttrs(config, {
      invalid: invalidState,
      disabled: !enabled,
      required,
    })
  );

  // Render slots: per-instance `render` prop over the global `config.render`
  const renderSlots: SmartRRenderSlots = { ...(config.render || {}) };
  if (renderProp) {
    for (const [slot, component] of Object.entries(renderProp)) {
      if (component) renderSlots[slot] = component;
    }
  }
  const controlState = { required, invalid: invalidState };
  const defaultControl =
    inputType === "textarea"
      ? renderSlots.textarea
      : inputType === "select"
      ? renderSlots.select
      : renderSlots.input;

  if (isAsyncSelect && (type === Input.Select || isFastSearch)) {
    // Dropdown assíncrono: a lib orquestra a UI; o consumidor busca os dados
    editorInput = (
      <AsyncSelect
        loadOptions={loadOptions}
        loadSelectedOption={loadSelectedOption}
        selectedOption={selectedOption}
        pageSize={pageSize}
        searchDebounceMs={searchDebounceMs}
        minSearchLength={asyncMinSearchLength}
        loadOnOpen={asyncLoadOnOpen}
        reloadToken={reloadToken}
        showNoneOption={showNoneOption}
        onSearchChange={onSearchChange}
        onOpen={onOpen}
        optionRenderer={optionRenderer}
        renderEmpty={renderEmpty}
        renderError={renderError}
        renderLoading={renderLoading}
        optionsId={optionsId}
        optionsDescription={optionsDescription}
        optionsNoneSelectedValue={optionsNoneSelectedValue}
        optionsNoneSelectedText={optionsNoneSelectedText}
        optionsFirstSelected={optionsFirstSelected}
        placeholder={placeholder === false ? undefined : placeholder}
        searchPlaceholder={optionsFilterPlaceholder}
        value={editorValue}
        enabled={enabled}
        readOnly={readOnly}
        editorAttributes={editorAttributes}
        onBlurEvent={handleInputBlur}
        onChangeEvent={handleInputChange}
        inputRef={inputRef}
        className={classes}
        controlState={controlState}
      />
    );
  } else
  switch (type) {
    case Input.CheckBox:
      if (isSwitchLayout) {
        // Label + note on the left (titleLabel), the control on the right
        const checkboxClasses = config.components.checkbox.classes as Record<string, any>;
        // Thumb drawn by a sibling <span> (presets that style the native
        // checkbox as a switch, e.g. shadcn); not for custom controls.
        const thumbClass = withSlot(config, checkboxClasses.switchThumb, slots.switchThumb);
        editorInput = (
          <div
            className={withSlot(
              config,
              withSlot(config, checkboxClasses.switchGroup, slots.check),
              slots.switchGroup
            )}
            {...dataAttrs(config, {
              invalid: invalidState,
              disabled: !enabled,
              required,
            })}
          >
            <EditorInput
              type={type}
              inputType={inputType}
              editorAttributes={editorAttributes}
              checked={editorValue}
              onBlurEvent={handleInputBlur}
              onChangeEvent={handleInputChange}
              inputRef={inputRef}
              className={classes}
              control={renderSlots.checkbox}
              controlState={controlState}
            ></EditorInput>
            {thumbClass && !renderSlots.checkbox ? (
              <span aria-hidden="true" className={thumbClass} data-smartr-switch-thumb="" />
            ) : null}
          </div>
        );
      } else {
        editorInput = (
          <CheckboxGroup
            id={id}
            checkBoxText={checkBoxText}
            required={required}
            titleBold={titleBold}
            tooltip={tooltip}
            toolTipPosition={toolTipPosition}
            groupClassName={slots.check}
            labelClassName={slots.checkLabel}
            invalid={invalidState}
            disabled={!enabled}
            children={
              <EditorInput
                type={type}
                inputType={inputType}
                editorAttributes={editorAttributes}
                checked={editorValue}
                onBlurEvent={handleInputBlur}
                onChangeEvent={handleInputChange}
                inputRef={inputRef}
                children={innerChildren}
                className={classes}
                control={renderSlots.checkbox}
                controlState={controlState}
              ></EditorInput>
            }
          ></CheckboxGroup>
        );
      }
      break;
    case Input.Chips:
      {
        // Multi-select as toggle chips: a role="group" of native checkboxes
        const groupAttributes: Record<string, any> = {};
        if (id && titleLabel) groupAttributes["aria-labelledby"] = `lbl${id}`;
        if (editorAttributes["aria-invalid"]) groupAttributes["aria-invalid"] = "true";
        if (editorAttributes["aria-describedby"]) {
          groupAttributes["aria-describedby"] = editorAttributes["aria-describedby"];
        }
        const separator = optionsMultipleSeparatorValue;
        editorInput = (
          <Chips
            id={id || editorName || autoIdRef.current}
            name={editorName}
            options={options}
            optionsId={optionsId}
            optionsDescription={optionsDescription}
            optionGetDescription={optionGetDescription}
            optionsToolTip={optionsToolTip}
            value={editorValue}
            separator={separator}
            enabled={enabled}
            readOnly={readOnly}
            groupRef={inputRef}
            groupAttributes={groupAttributes}
            classNames={{ group: slots.chipGroup, chip: slots.chip }}
            invalid={invalidState}
            required={required}
            onToggle={(values) =>
              handleInputChange({
                target: { name: editorName, value: values.join(separator) },
              })
            }
            onGroupBlur={(values) =>
              handleInputBlur({
                target: { name: editorName, value: values.join(separator) },
              } as any)
            }
          />
        );
      }
      break;
    case Input.Radio:
      {
        editorInput = (
          <Radio
            inline={inline}
            id={id}
            editorAttributes={editorAttributes}
            inputRadioRefs={inputRadioRefs}
            onBlurEvent={handleInputBlur}
            onChangeEvent={handleInputChange}
            options={options}
            optionsDescription={optionsDescription}
            optionsTooltip={optionsToolTip}
            optionsFirstSelected={optionsFirstSelected}
            optionsId={optionsId}
            optionsNoneSelectedValue={optionsNoneSelectedValue}
            value={editorValue}
            optionsNoneSelectedText={optionsNoneSelectedText}
            className={classes}
            inputRef={inputRef}
            slotClassNames={{ group: slots.check, label: slots.checkLabel }}
          ></Radio>
        );
      }
      break;
    case Input.Select:
      {
        editorInput = (
          <Select
            placeholder={placeholder === false ? undefined : placeholder}
            searchPlaceholder={optionsFilterPlaceholder}
            editorAttributes={editorAttributes}
            onBlurEvent={handleInputBlur}
            onChangeEvent={handleInputChange}
            options={options}
            optionsGrouped={optionsGrouped}
            optionsDescription={optionsDescription}
            optionGetDescription={optionGetDescription}
            optionGetGroup={optionGetGroup}
            optionsGroup={optionsGroup}
            optionsFirstSelected={optionsFirstSelected}
            optionsFilter={optionsFilter}
            optionsMultiple={optionsMultiple}
            enabled={enabled}
            readOnly={readOnly}
            optionsMultipleSeparatorValue={optionsMultipleSeparatorValue}
            optionsMultipleSeparatorDescription={
              optionsMultipleSeparatorDescription
            }
            children={innerChildren}
            optionsLimiteDescriptionSelected={optionsLimiteDescriptionSelected}
            optionsId={optionsId}
            optionsNoneSelectedValue={optionsNoneSelectedValue}
            value={editorValue}
            optionRenderer={optionRenderer}
            optionsNoneSelectedText={optionsNoneSelectedText}
            className={classes}
            inputRef={inputRef}
            control={renderSlots.select}
            controlState={controlState}
            controlData={selectControlData}
          />
        );
      }
      break;
    case Input.Label:
      {
        // Campo somente-exibição: renderiza o valor como texto estático,
        // mantendo título, layout de coluna e vínculo com o formState
        let labelValue: React.ReactNode = "";
        if (editorValue !== undefined && editorValue !== null) {
          labelValue =
            editorValue instanceof Date
              ? editorValue.toLocaleString()
              : String(editorValue);
        }
        editorInput = (
          <span
            data-smarteditor="Label"
            id={id}
            className={mapToCssModules(
              instanceClassesLast(config)
                ? cx(config, editorClassMap.inputLabel, className, slots.input)
                : cx(config, className, editorClassMap.inputLabel, slots.input)
            )}
          >
            {labelValue}
          </span>
        );
      }
      break;
    case Input.File:
      {
        editorInput = (
          <File
            id={id}
            name={editorName}
            editorAttributes={editorAttributes}
            onDownloadFileClick={onDownloadFileClick}
            onDeleteFileClick={onDeleteFileClick}
            fileUrlDownload={fileUrlDownload}
            fileDownloadName={fileDownloadName}
            placeholder={placeholder === false ? "" : placeholder}
            maxFilesPlaceholder={maxFilesPlaceholder}
            onBlurEvent={handleInputBlur}
            onChangeEvent={handleInputChange}
            inputRef={inputRef}
            className={classes}
            slotClassNames={{
              inputGroup: slots.inputGroup,
              icon: slots.icon,
            }}
            accessible={aria}
          ></File>
        );
      }
      break;

    default:
      {
        editorInput = (
          <EditorInput
            type={type}
            inputType={inputType}
            editorAttributes={editorAttributes}
            onBlurEvent={handleInputBlur}
            onChangeEvent={handleInputChange}
            onKeyDownEvent={type === Input.Text ? handleInputKeyDown : null}
            onPasteEvent={type === Input.Text ? handleInputPaste : null}
            inputRef={inputRef}
            children={innerChildren}
            className={classes}
            control={defaultControl}
            controlState={controlState}
            {...attributes}
          ></EditorInput>
        );
      }
      break;
  }

  if (type === Input.Hidden) {
    return editorInput;
  }

  const editorClasses = config.components.editor.classes;

  // Horizontal layout: the note and the validation messages are direct
  // children of the grid row. Grids that need an explicit full-width class
  // (e.g. Tailwind `col-span-12`) get `grid.columnDefault`; Bootstrap's is
  // empty (`.row > *` is already full width), so its output is unchanged.
  const rowItemClass =
    horizontal && config.grid.columnDefault ? config.grid.columnDefault : "";
  const messageClass = (base: string | null | undefined) =>
    rowItemClass
      ? cx(config, rowItemClass, base, slots.error)
      : withSlot(config, base, slots.error);

  if (note) {
    const noteClasses = mapToCssModules(
      cx(
        config,
        rowItemClass || null,
        editorClasses.labelNote,
        noteClassName,
        slots.note
      )
    );
    // `label` in Bootstrap (1.1.0 markup), `p` in the other presets
    noteLabel = React.createElement(
      config.tags.noteTag || "label",
      aria ? { className: noteClasses, id: noteId } : { className: noteClasses },
      note
    );
  }

  const invalidElementList = messages.map((message, index) =>
    React.createElement(
      config.tags.invalidFeedbackTag,
      {
        key: index,
        className: messageClass(message.className),
        ...dataAttrs(config, { state: message.state }),
        ...(aria
          ? {
              id: messageId(index),
              role: message.state === "error" ? "alert" : "status",
            }
          : {}),
      },
      message.text
    )
  );
  const iconWrapperClass = withSlot(
    config,
    editorClasses.inputGroupIcon,
    slots.icon
  );
  const prependIconComponent =
    hasIcon &&
    shouldRenderIconSlot(config, prependIcon) &&
    (iconPosition === IconPosition.Both ||
      iconPosition === IconPosition.Start) ? (
      <div className={editorClasses.inputGroupPrependIcon}>
        <span className={iconWrapperClass}>{renderIcon(prependIcon)}</span>
      </div>
    ) : null;

  const appendIconComponent =
    hasIcon &&
    shouldRenderIconSlot(config, appendIcon) &&
    (iconPosition === IconPosition.Both ||
      iconPosition === IconPosition.End) ? (
      <div className={editorClasses.inputGroupAppendIcon}>
        <span className={iconWrapperClass}>{renderIcon(appendIcon)}</span>
      </div>
    ) : null;

  const showPasswordIconComponent =
    type === Input.Password &&
    enableShowPassword &&
    (shouldRenderIconSlot(config, showPasswordIcon) ||
      shouldRenderIconSlot(config, hidePasswordIcon)) ? (
      <div
        className={
          showPasswordIconPosition === IconPosition.Start
            ? editorClasses.inputGroupPrependIcon
            : editorClasses.inputGroupAppendIcon
        }
      >
        <span
          className={withSlot(
            config,
            editorClasses.inputGroupShowPasswordIcon,
            slots.icon
          )}
          onClick={onShowPasswordHandler}
          {...dataAttrs(config, { state: showPassword ? "open" : "closed" })}
        >
          {renderIcon(showPassword ? hidePasswordIcon : showPasswordIcon)}
        </span>
      </div>
    ) : null;

  const prependButtonElements = prependButtons?.map((button, index) => (
    <EditorButton key={index} {...button} />
  ));

  const appendButtonElements = appendButtons?.map((button, index) => (
    <EditorButton key={index} {...button} />
  ));

  let inputGroup = (
    <div className={withSlot(config, editorClasses.inputGroup, slots.inputGroup)}>
      {prependButtonElements}
      {config.behavior.input.prependIconAfterInput && prependIconComponent}
      {(showPasswordIconPosition === IconPosition.Start ||
        showPasswordIconPosition === IconPosition.Both) &&
        showPasswordIconComponent}
      {editorInput}
      {!config.behavior.input.prependIconAfterInput && prependIconComponent}
      {appendIconComponent}
      {(showPasswordIconPosition === IconPosition.End ||
        showPasswordIconPosition === IconPosition.Both) &&
        showPasswordIconComponent}
      {appendButtonElements}
    </div>
  );

  if (!hasIcon && !(prependButtonElements || appendButtonElements)) {
    inputGroup = editorInput;
  } else if (
    config.behavior.hideEmptyIcons &&
    !prependIconComponent &&
    !appendIconComponent &&
    !showPasswordIconComponent &&
    !(prependButtonElements || appendButtonElements)
  ) {
    // Every icon slot was skipped (empty icons): no empty input-group wrapper
    inputGroup = editorInput;
  }

  const isDisabledGroup = !(enabled && type !== Input.File);
  const classControlGroup = mapToCssModules(
    cx(
      config,
      editorClasses.controlGroup,
      invalidState
        ? editorClasses.controlGroupInvalid ?? editorClasses.invalid
        : "",
      isDisabledGroup ? editorClasses.controlGroupDisabledControl : "",
      slots.group
    )
  );
  const groupDataAttributes = dataAttrs(config, {
    invalid: invalidState,
    disabled: !enabled,
    required,
  });
  if (!horizontal || isSwitchLayout) {
    const section = isSwitchLayout
      ? React.createElement(
          "div",
          { className: classControlGroup, ...groupDataAttributes },
          <div className={withSlot(config, editorClasses.switchRow, slots.switchRow) || undefined}>
            <div className={withSlot(config, editorClasses.switchText, slots.switchText) || undefined}>
              {titleLabel}
              {noteLabel}
            </div>
            {inputGroup}
          </div>,
          invalidElementList
        )
      : React.createElement(
          "div",
          { className: classControlGroup, ...groupDataAttributes },
          titleLabel,
          inputGroup,
          noteLabel,
          invalidElementList
        );
    const column = (
      <Column
        size={size}
        sm={sm}
        md={md}
        lg={lg}
        xl={xl}
        xxl={xxl}
        className={slots.column}
      >
        {section}
      </Column>
    );

    if (createRow) {
      return <Row>{column}</Row>;
    } else if (createColumn) {
      return column;
    } else {
      return section;
    }
  } else {
    inputGroup = (
      <Column
        size={size}
        sm={sm}
        md={md}
        lg={lg}
        xl={xl}
        xxl={xxl}
        className={slots.column}
      >
        {inputGroup}
      </Column>
    );
    return (
      <Row
        className={withSlot(config, editorClasses.horizontalFormRow, slots.group)}
        {...groupDataAttributes}
      >
        {titleLabel} {inputGroup} {noteLabel} {invalidElementList}
      </Row>
    );
  }
  });
  EditorImpl.displayName = "Editor";
  return EditorImpl as unknown as EditorComponent;
}
