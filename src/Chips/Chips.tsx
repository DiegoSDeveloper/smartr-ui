import React from "react";
import { useSmartConfig } from "../hook/useSmartConfig";
import { cx, dataAttrs, withSlot } from "../Utils/styling";

export interface ChipsProps {
  /** Id of the group; each chip's checkbox gets `{id}-chip-{n}`. */
  id: string;
  /** `name` of every checkbox. */
  name?: string;
  options?: any[];
  optionsId?: string;
  optionsDescription?: string;
  optionGetDescription?: (option: any) => React.ReactNode;
  optionsToolTip?: string;
  /** Selected values: an array or a separated string (`"a,b"`), like the multiple select. */
  value?: any;
  /** Separator of a string value (`behavior.select.optionsMultipleSeparatorValue`). */
  separator?: string;
  enabled?: boolean;
  readOnly?: boolean;
  /** Called with the selected values (strings, in option order). */
  onToggle?: (values: string[]) => void;
  /** Called when the focus leaves the group, with the selected values. */
  onGroupBlur?: (values: string[]) => void;
  /** Ref of the group element (the Editor reads the checked chips from it). */
  groupRef?: React.Ref<any>;
  /** Extra attributes of the group (`aria-*`, `data-*`). */
  groupAttributes?: Record<string, any>;
  /** Per-instance classes: `group` (the `role="group"` wrapper) and `chip`. */
  classNames?: { group?: string; chip?: string };
  invalid?: boolean;
  required?: boolean;
}

/** Normalizes an array / separated string into string values. */
export function chipValues(value: any, separator = ","): string[] {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  return String(value)
    .split(separator)
    .filter((v) => v !== "");
}

/**
 * Multi-select rendered as toggle chips (`Input.Chips`): a `role="group"`
 * of native checkboxes (keyboard: Tab between chips, Space toggles), each
 * followed by its label — the chip. Classes: `components.chips.classes`
 * (`group`, `item`, `input`, `chip`, `chipChecked`, `chipDisabled`).
 */
export function Chips(props: ChipsProps) {
  const {
    id,
    name,
    options,
    optionsId = "id",
    optionsDescription = "description",
    optionGetDescription,
    optionsToolTip,
    value,
    separator = ",",
    enabled = true,
    readOnly = false,
    onToggle,
    onGroupBlur,
    groupRef,
    groupAttributes = {},
    classNames = {},
    invalid,
    required,
  } = props;
  const config = useSmartConfig();
  const classes = (config.components as any).chips?.classes || {};
  const list: any[] =
    options && typeof (options as any)[Symbol.iterator] === "function"
      ? [...options].map((option) =>
          option !== null && typeof option === "object"
            ? option
            : { [optionsId]: option, [optionsDescription]: option }
        )
      : [];
  // Controlled by `value`; without one (no state binding) the selection is kept here
  const [ownValue, setOwnValue] = React.useState<string[]>([]);
  const selected = value !== undefined ? chipValues(value, separator) : ownValue;

  const toggle = (optionValue: string, optionDisabled: boolean) => {
    if (!enabled || readOnly || optionDisabled) return;
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    const values = list
      .map((option) => String(option[optionsId]))
      .filter((v) => next.has(v));
    setOwnValue(values);
    onToggle?.(values);
  };

  return (
    <div
      role="group"
      id={id}
      ref={groupRef}
      data-smarteditor="Chips"
      className={withSlot(config, classes.group, classNames.group) || undefined}
      {...dataAttrs(config, { invalid, disabled: !enabled, required })}
      {...groupAttributes}
      onBlur={(event) => {
        // only when the focus leaves the whole group
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) return;
        onGroupBlur?.(selected);
      }}
    >
      {list.map((option, index) => {
        const optionValue = String(option[optionsId]);
        const checked = selected.includes(optionValue);
        const disabled = !enabled || !!option.disabled;
        const inputId = `${id}-chip-${index + 1}`;
        const tooltip = optionsToolTip ? option[optionsToolTip] : undefined;
        return (
          <span key={`${optionValue}-${index}`} className={classes.item || undefined}>
            <input
              type="checkbox"
              id={inputId}
              name={name}
              value={optionValue}
              checked={checked}
              disabled={disabled}
              className={classes.input || undefined}
              onChange={() => toggle(optionValue, disabled)}
            />
            <label
              htmlFor={inputId}
              title={tooltip || undefined}
              className={
                cx(
                  config,
                  classes.chip,
                  checked ? classes.chipChecked : null,
                  disabled ? classes.chipDisabled : null,
                  classNames.chip
                ) || undefined
              }
              {...dataAttrs(config, {
                disabled,
                state: checked ? "checked" : "unchecked",
              })}
            >
              {optionGetDescription
                ? optionGetDescription(option)
                : option[optionsDescription]}
            </label>
          </span>
        );
      })}
    </div>
  );
}
