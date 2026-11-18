/**
 * Type-level tests of the render-slot contract (compiled by `npm run type-check`,
 * never executed). Each `@ts-expect-error` proves that props stay typed: if
 * `SmartRControlProps` turned into `any` again (e.g. a string index signature
 * swallowed by `forwardRef`'s `PropsWithoutRef`), the directive would be unused
 * and tsc would fail.
 */
import React from "react";
import {
  Editor,
  FormMessage,
  Input,
  ValueType,
  type SmartRControlComponent,
  type SmartRControlProps,
  type SmartRControlPropsWithRef,
  type SmartRSelectOption,
  type SmartRValidators,
} from "../../src";

// ---------------------------------------------------------------------------
// Pattern 1 — React.forwardRef (React 16.8 – 19)
// ---------------------------------------------------------------------------
export const ForwardInput = React.forwardRef<HTMLInputElement, SmartRControlProps>(
  function ForwardInput({ invalid, required, className, options, noneOption, multiple, ...props }, ref) {
    const isInvalid: boolean | undefined = invalid;
    const isRequired: boolean | undefined = required;
    const opts: SmartRSelectOption[] | undefined = options;
    // @ts-expect-error `invalid` is a boolean, not a string
    const wrong: string = invalid;
    // @ts-expect-error unknown props are rejected (no string index signature)
    void props.notAProp;
    const dataMarker = props["data-smarteditor"];
    void [isInvalid, isRequired, opts, wrong, dataMarker, noneOption, multiple];
    return <input ref={ref} {...props} className={className} />;
  }
);

type ForwardProps = React.ComponentProps<typeof ForwardInput>;
export const invalidProp: ForwardProps["invalid"] = true;
// @ts-expect-error the forwardRef component keeps `invalid: boolean`
export const invalidPropWrong: ForwardProps["invalid"] = "yes";

export const asSlot: SmartRControlComponent = ForwardInput;

// A select adapter receives the options as data
export const SelectAdapter = React.forwardRef<{ value: string }, SmartRControlProps>(
  function SelectAdapter({ value, onChange, options = [], noneOption }, ref) {
    React.useImperativeHandle(ref, () => ({ value: String(value ?? "") }), [value]);
    return (
      <select value={String(value ?? "")} onChange={(e) => onChange?.(e)}>
        {noneOption ? <option value="">{noneOption.label}</option> : null}
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
);

// ---------------------------------------------------------------------------
// Pattern 2 — React 19: `ref` as a regular prop
// ---------------------------------------------------------------------------
export function RefPropInput({ ref, invalid, options, noneOption, multiple, ...props }: SmartRControlPropsWithRef<HTMLInputElement>) {
  const isInvalid: boolean | undefined = invalid;
  // @ts-expect-error `invalid` is a boolean, not a number
  const wrong: number = invalid;
  void [isInvalid, wrong, options, noneOption, multiple];
  return <input ref={ref} {...props} />;
}

// Both patterns plug into the render slots (per instance and globally)
export const usage = (
  <>
    <Editor id="a" render={{ input: ForwardInput, select: SelectAdapter }} />
    <Editor id="b" render={{ input: RefPropInput }} />
  </>
);

// ---------------------------------------------------------------------------
// Round-3 Editor props
// ---------------------------------------------------------------------------
const validators: SmartRValidators = {
  email: (value) => String(value).endsWith("@corp.com") || "Use your corporate address",
  phone: (value, { type }) => type === Input.Phone && String(value).length >= 10,
  url: false,
  required: null,
};

export const editors = (
  <>
    <Editor id="p" type={Input.Phone} mask={false} placeholder={false} />
    <Editor id="q" type={Input.Phone} mask="phone-br" phoneCountry="BR" />
    <Editor id="r" type={Input.Phone} mask={["(00) 0000-0000", "(00) 00000-0000"]} />
    <Editor id="e" type={Input.Email} validateMode="afterSubmit" validators={validators} />
    <Editor<string[]>
      id="c"
      type={Input.Chips}
      valueType={ValueType.Array}
      options={[{ id: "email", description: "E-mail" }]}
      onValueChange={(channels) => channels.includes("email")}
      classNames={{ chip: "px-2", chipGroup: "gap-1", switchRow: "p-3", switchText: "min-w-0", switchThumb: "x" }}
    />
    <FormMessage id="err" type="warning" messages={["a", null]} />
  </>
);

// @ts-expect-error validateMode is a closed set
export const badMode = <Editor id="x" validateMode="sometimes" />;
