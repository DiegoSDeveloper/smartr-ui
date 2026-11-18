import React from "react";

import { Label } from "../Label/Label";
import { LabelMode } from "../types";
import { useSmartConfig } from "../hook/useSmartConfig";
import { withSlot } from "../Utils/styling";

interface RadioPropTypes {
  id?: string;
  options: any[];
  optionsId: string;
  optionsDescription: string;
  optionsTooltip?: string;
  optionsFirstSelected: boolean;
  optionsNoneSelectedValue: any;
  optionsNoneSelectedText: string;
  value: any;
  inline: boolean;
  inputRadioRefs: React.MutableRefObject<any[]>;
  editorAttributes: Record<string, any>;
  onBlurEvent: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  onChangeEvent: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  inputRef: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  className?: string;
  /** Per-instance class overrides (merged after the configured radio classes). */
  slotClassNames?: { list?: string; group?: string; label?: string };
}

export function Radio(props: RadioPropTypes) {
  const {
    id,
    options,
    optionsId,
    optionsDescription,
    optionsTooltip,
    optionsFirstSelected,
    optionsNoneSelectedValue,
    optionsNoneSelectedText,
    editorAttributes,
    value,
    inline,
    inputRadioRefs,
    onBlurEvent,
    onChangeEvent,
    inputRef,
    className,
    slotClassNames = {},

    ...attributes
  } = props;
  const config = useSmartConfig();
  let editorValue = value;
  const radioLabelAttributes: Record<string, string> = {};
  const dataSource =
    options && typeof options[Symbol.iterator] === "function"
      ? [...options]
      : [];
  if (!optionsFirstSelected) {
    const noneSelectOption = {};
    noneSelectOption[optionsId] = optionsNoneSelectedValue;
    noneSelectOption[optionsDescription] = optionsNoneSelectedText;
    dataSource.unshift(noneSelectOption);
    if (!editorValue) {
      editorValue = optionsNoneSelectedValue;
    }
  } else {
    if (!editorValue && dataSource.length > 0) {
      editorValue = dataSource[0][optionsId];
    }
  }

  const innerChildren = dataSource.map((option, index) => {
    if (id) {
      radioLabelAttributes["htmlFor"] = `${id}-opt-${index + 1}`;
      editorAttributes["id"] = `${id}-opt-${index + 1}`;
    }
    editorAttributes["value"] = option[optionsId];
    editorAttributes["defaultChecked"] = option[optionsId] === editorValue;
    const radioLabel = (
      <Label
        id={id}
        htmlFor={`${id}-opt-${index + 1}`}
        title={option[optionsDescription]}
        tooltip={option[optionsTooltip]}
        mode={LabelMode.CheckBox}
        className={config.components.radio.classes.label}
        labelClassName={slotClassNames.label}
      ></Label>
    );

    const radioRef = React.createRef();
    inputRadioRefs.current[index] = radioRef;

    const radioInput = React.createElement("input", {
      ...attributes,
      ...editorAttributes,
      className: className,
      onChange: onChangeEvent,
      onBlur: onBlurEvent,
      ref: radioRef,
    });

    const radioGroup = React.createElement(
      "div",
      {
        key: index,
        className: withSlot(
          config,
          !inline
            ? config.components.radio.classes.group
            : config.components.radio.classes.groupInLine,
          slotClassNames.group
        ),
      },
      radioInput,
      radioLabel
    );

    return radioGroup;
  });

  const optionsGroup = React.createElement(
    "div",
    {
      className: withSlot(
        config,
        config.components.radio.classes.groupList,
        slotClassNames.list
      ),
      ref: inputRef,
    },
    innerChildren
  );

  return optionsGroup;
}
