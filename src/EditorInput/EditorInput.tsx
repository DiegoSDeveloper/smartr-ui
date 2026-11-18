import React from "react";
import { Input } from "../types";
import type { SmartRControlComponent } from "../config/defaultConfig";

interface EditorInputPropTypes {
  type: Input;
  inputType: string;
  editorAttributes: Record<string, any>;
  checked?: boolean;
  onBlurEvent?: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  onChangeEvent?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPasteEvent?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onKeyDownEvent?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /**
   * Optional custom control (render slot). When set, it is rendered instead of
   * the native element and receives the same props plus semantic state.
   */
  control?: SmartRControlComponent;
  /** Semantic state passed to custom controls only. */
  controlState?: { required?: boolean; invalid?: boolean };
  /** Extra props passed to custom controls only (select slot: `options`, `multiple`, `noneOption`). */
  controlData?: Record<string, any>;
}

export function EditorInput(props: EditorInputPropTypes) {
  const {
    inputType,
    type,
    editorAttributes,
    onBlurEvent,
    onChangeEvent,
    onPasteEvent,
    onKeyDownEvent,
    inputRef,
    className,
    checked,
    style,
    children,
    control,
    controlState,
    controlData,
    ...attributes
  } = props;

  const inputProps: Record<string, any> = {
    ...attributes,
    ...editorAttributes,
    className: type !== Input.Hidden ? className : null,
    onChange: type !== Input.Hidden ? onChangeEvent : null,
    onBlur: type !== Input.Hidden ? onBlurEvent : null,
    onPaste: type !== Input.Hidden ? onPasteEvent : null,
    onKeyDown: type !== Input.Hidden ? onKeyDownEvent : null,
    ref: inputRef,
    style: style,
  };

  if (editorAttributes?.type === "checkbox") {
    inputProps.checked = !!checked;
    delete inputProps.defaultChecked;
    delete inputProps.value;
  }

  if (control && type !== Input.Hidden) {
    return React.createElement(
      control as any,
      { ...toControlProps(inputProps, controlState), ...(controlData || {}) },
      children
    );
  }

  return React.createElement(inputType, inputProps, children);
}

/**
 * Normalizes native attributes into the documented `SmartRControlProps`
 * contract (booleans instead of HTML attribute strings, no null handlers).
 */
function toControlProps(
  inputProps: Record<string, any>,
  controlState: { required?: boolean; invalid?: boolean } = {}
): Record<string, any> {
  const props: Record<string, any> = {};
  for (const [key, value] of Object.entries(inputProps)) {
    if (value === null || value === undefined) continue;
    props[key] = value;
  }
  if ("disabled" in props) props.disabled = !!props.disabled;
  if ("readOnly" in props) props.readOnly = props.readOnly !== false;
  // numeric HTML attributes as numbers (typed `number` in SmartRControlProps)
  for (const key of ["tabIndex", "minLength", "maxLength"]) {
    if (key in props && props[key] !== "" && !isNaN(Number(props[key]))) {
      props[key] = Number(props[key]);
    }
  }
  props.required = !!controlState.required;
  props.invalid = !!controlState.invalid;
  if (controlState.invalid) props["aria-invalid"] = true;
  return props;
}
