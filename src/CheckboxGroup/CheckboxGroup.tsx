import React from "react";

import { TooltipPosition, LabelMode } from "../types";
import { Label } from "../Label/Label";
import { useSmartConfig } from "../hook/useSmartConfig";
import { dataAttrs, withSlot } from "../Utils/styling";

interface checkboxGroupPropTypes {
  id?: string;
  checkBoxText?: React.ReactNode;
  required?: boolean;
  titleBold?: boolean;
  tooltip?: string;
  toolTipPosition?: TooltipPosition;
  children?: React.ReactNode;
  /** Per-instance classes merged after `components.checkbox.classes.group`. */
  groupClassName?: string;
  /** Per-instance classes merged after `components.checkbox.classes.label`. */
  labelClassName?: string;
  /** State used for data-attributes (only emitted when enabled in config). */
  invalid?: boolean;
  disabled?: boolean;
}

export function CheckboxGroup(props: checkboxGroupPropTypes) {
  const {
    id,
    children,
    checkBoxText,
    tooltip,
    toolTipPosition,
    required,
    titleBold,
    groupClassName,
    labelClassName,
    invalid,
    disabled,
  } = props;

  const config = useSmartConfig();

  const checkBoxLabelAttributes: Record<string, string> = {};
  if (id) {
    checkBoxLabelAttributes["htmlFor"] = id;
  }
  const checkBoxLabel = (
    <Label
      id={id}
      htmlFor={id}
      title={checkBoxText}
      titleBold={titleBold}
      required={required}
      mode={LabelMode.CheckBox}
      tooltip={tooltip}
      toolTipPosition={toolTipPosition}
      className={config.components.checkbox.classes.label}
      labelClassName={labelClassName}
    ></Label>
  );

  return React.createElement(
    "div",
    {
      key: 0,
      className: withSlot(
        config,
        config.components.checkbox.classes.group,
        groupClassName
      ),
      ...dataAttrs(config, { invalid, disabled, required }),
    },
    children,
    checkBoxLabel
  );
}
