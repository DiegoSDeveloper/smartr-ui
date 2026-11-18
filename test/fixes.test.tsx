/**
 * Regression tests for the review fixes of the 1.2.0 framework-agnostic refactor.
 */
import React from "react";
import fs from "fs";
import path from "path";
import { render, fireEvent, act, screen } from "@testing-library/react";
import {
  Column,
  ColumnSize,
  Container,
  Editor,
  Input,
  SmartRProvider,
  Table,
  createConfig,
  defaultConfig,
  renderIcon,
  tailwindPreset,
  unstyledPreset,
  useSmartConfig,
  SmartRControlProps,
} from "../src";
import { configEquals } from "../src/context/SmartRProvider";
import * as sharedConfig from "../src/config/sharedConfig";
import { getGridColumnClasses } from "../src/Utils/styling";

// ---------------------------------------------------------------------------
// 1. Checkbox render slot contract
// ---------------------------------------------------------------------------
describe("checkbox render slot (non-native controls)", () => {
  /** Radix/shadcn-like checkbox: a <button role="checkbox"> + onCheckedChange(boolean). */
  const RadixLikeCheckbox = React.forwardRef<HTMLButtonElement, any>(
    ({ checked, onCheckedChange, invalid, required, ...rest }, ref) => (
      <button
        type="button"
        role="checkbox"
        aria-checked={!!checked}
        data-state={checked ? "checked" : "unchecked"}
        ref={ref}
        id={rest.id}
        onClick={() => onCheckedChange?.(!checked)}
        onBlur={rest.onBlur}
      />
    )
  );
  // Adapter as documented: onCheckedChange={props.onChange}
  const BooleanSlot = React.forwardRef<HTMLButtonElement, SmartRControlProps>(
    (props, ref) => (
      <RadixLikeCheckbox
        ref={ref}
        id={props.id}
        checked={props.checked}
        onCheckedChange={props.onChange}
        onBlur={props.onBlur}
      />
    )
  );
  // Reports `{ target: { checked } }` without `type`/`name`
  const TargetSlot = React.forwardRef<HTMLButtonElement, SmartRControlProps>(
    (props, ref) => (
      <RadixLikeCheckbox
        ref={ref}
        id={props.id}
        checked={props.checked}
        onCheckedChange={(checked: boolean) => props.onChange?.({ target: { checked } })}
      />
    )
  );
  // Ref exposing `checked` (no DOM element at all)
  const ImperativeSlot = React.forwardRef<any, SmartRControlProps>((props, ref) => {
    const [checked, setChecked] = React.useState(!!props.checked);
    React.useImperativeHandle(ref, () => ({ checked }), [checked]);
    return (
      <span
        data-testid={`imp-${props.id}`}
        onClick={() => {
          setChecked(!checked);
          props.onChange?.(!checked);
        }}
      />
    );
  });

  function Form({ slot, onState }: { slot: any; onState: (s: any) => void }) {
    const [form, setForm] = React.useState<any>({ agree: false });
    onState(form);
    return (
      <Editor
        id="agree"
        type={Input.CheckBox}
        checkBoxText="Agree"
        formState={form}
        dispatchFormState={setForm}
        render={{ checkbox: slot }}
      />
    );
  }

  it("onChange(boolean) updates formState and the checked prop", async () => {
    let state: any;
    const onChange = vi.fn();
    const { container } = render(<Form slot={BooleanSlot} onState={(s) => (state = s)} />);
    const button = container.querySelector("button[role=checkbox]") as HTMLElement;
    expect(button.getAttribute("aria-checked")).toBe("false");
    await act(async () => {
      fireEvent.click(button);
    });
    expect(state.agree).toBe(true);
    expect(button.getAttribute("aria-checked")).toBe("true");
    await act(async () => {
      fireEvent.click(button);
    });
    expect(state.agree).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onChange({ target: { checked } }) without type/name works", async () => {
    let state: any;
    const { container } = render(<Form slot={TargetSlot} onState={(s) => (state = s)} />);
    await act(async () => {
      fireEvent.click(container.querySelector("button[role=checkbox]") as HTMLElement);
    });
    expect(state.agree).toBe(true);
  });

  it("user onChange receives a normalized event and the boolean value", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Editor id="c" type={Input.CheckBox} checkBoxText="C" onChange={onChange} render={{ checkbox: BooleanSlot }} />
    );
    await act(async () => {
      fireEvent.click(container.querySelector("button[role=checkbox]") as HTMLElement);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    const [event, value, id, name] = onChange.mock.calls[0];
    expect(event.target.checked).toBe(true);
    expect(value).toBe(true);
    expect(id).toBe("c");
    expect(name).toBe("c");
  });

  it("getValue reads aria-checked / ref.checked duck-typed", async () => {
    const editorA = React.createRef<any>();
    const editorB = React.createRef<any>();
    render(
      <>
        <Editor ref={editorA} id="a" type={Input.CheckBox} checkBoxText="A" value={true} render={{ checkbox: BooleanSlot }} />
        <Editor ref={editorB} id="b" type={Input.CheckBox} checkBoxText="B" render={{ checkbox: ImperativeSlot }} />
      </>
    );
    expect(editorA.current.getValue()).toBe(true); // aria-checked="true" on a <button>
    expect(editorB.current.getValue()).toBe(false); // ref exposing { checked }
    await act(async () => {
      fireEvent.click(screen.getByTestId("imp-b"));
    });
    expect(editorB.current.getValue()).toBe(true);
  });

  it("required validation through Container uses the custom checked state", async () => {
    const ref = React.createRef<any>();
    let state: any;
    function Form() {
      const [form, setForm] = React.useState<any>({ agree: false });
      state = form;
      return (
        <Container ref={ref}>
          <Editor id="agree" type={Input.CheckBox} checkBoxText="Agree" required formState={form} dispatchFormState={setForm} render={{ checkbox: BooleanSlot }} />
        </Container>
      );
    }
    const { container } = render(<Form />);
    let results: any[] = [];
    await act(async () => {
      results = await ref.current.validate();
    });
    expect(results).toHaveLength(1);
    await act(async () => {
      fireEvent.click(container.querySelector("button[role=checkbox]") as HTMLElement);
    });
    expect(state.agree).toBe(true);
    await act(async () => {
      results = await ref.current.validate();
    });
    expect(results).toHaveLength(0);
  });

  it("onBlur without a native event does not throw", async () => {
    const onBlur = vi.fn();
    const Slot = React.forwardRef<HTMLButtonElement, SmartRControlProps>((props, ref) => (
      <button ref={ref} role="checkbox" aria-checked={!!props.checked} onBlur={() => props.onBlur?.(undefined)} />
    ));
    const { container } = render(
      <Editor id="z" type={Input.CheckBox} checkBoxText="Z" value={true} onBlur={onBlur} render={{ checkbox: Slot }} />
    );
    await act(async () => {
      fireEvent.blur(container.querySelector("button") as HTMLElement);
    });
    expect(onBlur).toHaveBeenCalled();
    expect(onBlur.mock.calls[0][1]).toBe(true);
  });

  it("native checkbox behavior is unchanged", async () => {
    let state: any;
    const { container } = render(<Form slot={undefined} onState={(s) => (state = s)} />);
    const input = container.querySelector("input[type=checkbox]") as HTMLInputElement;
    await act(async () => {
      fireEvent.click(input);
    });
    expect(state.agree).toBe(true);
    expect(input.checked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Horizontal layout under non-Bootstrap grids
// ---------------------------------------------------------------------------
describe("horizontal layout", () => {
  const horizontal = (
    <Editor
      id="h"
      title="H"
      note="a note"
      horizontal
      invalid
      invalidMessage="bad"
      labelSize={ColumnSize.Col4}
      size={ColumnSize.Col8}
    />
  );

  it("tailwind: note and messages are full-width grid items", () => {
    const { container } = render(<SmartRProvider config={tailwindPreset}>{horizontal}</SmartRProvider>);
    const row = container.firstElementChild as HTMLElement;
    const children = Array.from(row.children) as HTMLElement[];
    const note = children.find((c) => c.textContent === "a note")!;
    const error = children.find((c) => c.textContent === "bad")!;
    expect(note.className.split(" ")).toContain("col-span-12");
    expect(error.className.split(" ")).toContain("col-span-12");
    // label keeps its own size
    expect(container.querySelector("label[for=h]")!.className).toContain("col-span-4");
  });

  it("bootstrap: note and messages get no extra class", () => {
    const { container } = render(horizontal);
    expect(container.querySelector(".note")!.className).toBe("form-text text-muted note");
    expect(container.querySelector(".error-validation-message")!.className).toBe(
      "error-validation-message"
    );
  });

  it("non-horizontal tailwind editors are unaffected", () => {
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Editor id="v" title="V" note="n" invalid invalidMessage="bad" />
      </SmartRProvider>
    );
    expect(container.innerHTML).not.toMatch(/class="col-span-12 text-xs/);
  });
});

// ---------------------------------------------------------------------------
// 3. SmartRProvider memoization
// ---------------------------------------------------------------------------
describe("SmartRProvider memoization", () => {
  it("inline config literal with the same content keeps the same merged config", () => {
    const seen: any[] = [];
    function Probe() {
      seen.push(useSmartConfig());
      return null;
    }
    const MemoProbe = React.memo(Probe);
    const translate = (k: string, f: string) => f;
    const Icon = () => <svg />;
    function App({ tick }: { tick: number }) {
      return (
        <SmartRProvider
          config={{
            translate,
            components: { editor: { classes: { input: "x" } } },
            resources: { icons: { email: Icon, note: <b data-x="1" /> } },
            grid: { row: "r", column: () => "c" } as any, // inline fn → new config
          }}
        >
          <span>{tick}</span>
          <MemoProbe />
        </SmartRProvider>
      );
    }
    function StableApp({ tick }: { tick: number }) {
      return (
        <SmartRProvider
          config={{
            translate,
            components: { editor: { classes: { input: "x" } } },
            resources: { icons: { email: Icon, note: <b data-x="1" /> } },
          }}
        >
          <span>{tick}</span>
          <MemoProbe />
        </SmartRProvider>
      );
    }
    const { rerender } = render(<StableApp tick={1} />);
    rerender(<StableApp tick={2} />);
    rerender(<StableApp tick={3} />);
    expect(seen.length).toBe(1); // memoized consumer never re-rendered
    expect(seen[0].components.editor.classes.input).toBe("x");
    expect(seen[0].translate).toBe(translate);

    seen.length = 0;
    const r2 = render(<App tick={1} />);
    r2.rerender(<App tick={2} />);
    expect(seen.length).toBe(2); // inline function → content differs → new config
  });

  it("content change produces a new configuration", () => {
    const seen: string[] = [];
    function Probe() {
      seen.push(useSmartConfig().components.editor.classes.input);
      return null;
    }
    const MemoProbe = React.memo(Probe);
    const App = ({ cls }: { cls: string }) => (
      <SmartRProvider config={{ components: { editor: { classes: { input: cls } } } }}>
        <MemoProbe />
      </SmartRProvider>
    );
    const { rerender } = render(<App cls="a" />);
    rerender(<App cls="a" />);
    rerender(<App cls="b" />);
    expect(seen).toEqual(["a", "b"]);
  });

  it("configEquals compares functions/components by reference, elements structurally", () => {
    const f = () => 1;
    expect(configEquals({ a: [1, { b: f }] }, { a: [1, { b: f }] })).toBe(true);
    expect(configEquals({ a: f }, { a: () => 1 })).toBe(false);
    expect(configEquals({ i: <b x="1" /> }, { i: <b x="1" /> })).toBe(true);
    expect(configEquals({ i: <b x="1" /> }, { i: <b x="2" /> })).toBe(false);
    expect(configEquals({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(configEquals(tailwindPreset, { ...tailwindPreset })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. translate fallback
// ---------------------------------------------------------------------------
describe("translate fallback", () => {
  it.each([undefined, null, ""])("translate returning %p uses the fallback text", async (ret) => {
    const translate = (() => ret) as any;
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Editor id="a" title="A" min={5} value="ab" />
        <Table columns={[{ header: "N", accessor: "n" }]} data={[]} />
      </SmartRProvider>
    );
    await act(async () => {
      fireEvent.blur(container.querySelector("input") as HTMLInputElement);
    });
    const html = container.innerHTML;
    expect(html).toContain("Please enter at least 5 characters");
    expect(html).toContain("No records to display.");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain(">null<");
  });

  it("validation messages with undefined Message never render 'undefined'", async () => {
    const { container } = render(
      <Editor
        id="m"
        title="M"
        validateOnChange
        customValidationOnChange={async () => [{ Type: 1, Message: undefined } as any]}
      />
    );
    await act(async () => {
      fireEvent.change(container.querySelector("input") as HTMLInputElement, {
        target: { value: "x" },
      });
    });
    expect(container.innerHTML).not.toContain("undefined");
  });
});

// ---------------------------------------------------------------------------
// 5. Explicit null icon → empty <i> (1.1.0), false → nothing
// ---------------------------------------------------------------------------
describe("null / false icons", () => {
  it("renderIcon(null) renders an empty <i>, renderIcon(false) nothing", () => {
    const { container } = render(
      <>
        <span data-testid="n">{renderIcon(null)}</span>
        <span data-testid="f">{renderIcon(false)}</span>
        <span data-testid="u">{renderIcon(undefined)}</span>
      </>
    );
    expect(screen.getByTestId("n").innerHTML).toBe("<i></i>");
    expect(screen.getByTestId("u").innerHTML).toBe("<i></i>");
    expect(screen.getByTestId("f").innerHTML).toBe("");
    expect(container).toBeTruthy();
  });

  it("explicit null icon props render like 1.1.0 (empty <i> in the wrapper)", () => {
    const { container } = render(
      <Editor id="e" title="E" type={Input.Email} prependIcon={null} />
    );
    expect(container.querySelector(".input-group-text")!.innerHTML).toBe("<i></i>");
  });

  it("explicit null tooltip icon renders an empty <i> trigger", () => {
    const { container } = render(
      <SmartRProvider config={{ resources: { icons: { tooltip: null } } }}>
        <Editor id="t" title="T" tooltip="tip" />
      </SmartRProvider>
    );
    expect(container.querySelector("label")!.innerHTML).toBe("T <i></i>");
  });
});

// ---------------------------------------------------------------------------
// 6. Unstyled preset: tooltip trigger + no empty icon wrappers
// ---------------------------------------------------------------------------
describe("unstyled preset", () => {
  it("tooltip stays reachable through an accessible button", async () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="t" title="T" tooltip="Helpful text" />
      </SmartRProvider>
    );
    const trigger = container.querySelector("label button") as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    expect(trigger.getAttribute("type")).toBe("button");
    expect(trigger.getAttribute("aria-label")).toBe("Helpful text");
    expect(trigger.textContent).toBe("?");
    expect(trigger.hasAttribute("class")).toBe(false);

    await act(async () => {
      fireEvent.focus(trigger);
    });
    const bubble = container.querySelector("[role=tooltip]") as HTMLElement;
    expect(bubble.textContent).toBe("Helpful text");
    expect(trigger.getAttribute("aria-describedby")).toBe(bubble.id);
    await act(async () => {
      fireEvent.keyDown(trigger, { key: "Escape" });
    });
    expect(container.querySelector("[role=tooltip]")).toBeNull();
    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });
    expect(container.innerHTML).toContain("Helpful text");
  });

  it("checkbox tooltip also gets the trigger", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="c" type={Input.CheckBox} checkBoxText="C" tooltip="tip" />
      </SmartRProvider>
    );
    expect(container.querySelector("label[for=c] button[aria-label=tip]")).not.toBeNull();
  });

  it("no empty icon wrappers", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="e" title="E" type={Input.Email} />
        <Editor id="p" title="P" type={Input.Password} />
        <Editor id="x" title="X" hasIcon />
      </SmartRProvider>
    );
    expect(container.querySelectorAll("span").length).toBe(0);
    // inputs are not wrapped in an (empty) input group either
    container.querySelectorAll("input").forEach((input) => {
      expect(input.parentElement!.tagName).toBe("DIV");
      expect(input.parentElement!.querySelector("label")).not.toBeNull();
    });
  });

  it("bootstrap keeps the empty wrapper for an empty icon (1.1.0)", () => {
    const { container } = render(<Editor id="x" title="X" hasIcon />);
    expect(container.querySelector(".input-group-prepend")!.innerHTML).toBe(
      '<span class="input-group-text inside-input"><i class=""></i></span>'
    );
  });

  it("false icons skip the slot in any preset", () => {
    const { container } = render(<Editor id="e" title="E" type={Input.Email} prependIcon={false} />);
    expect(container.querySelector(".input-group-prepend")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Tailwind preset
// ---------------------------------------------------------------------------
describe("tailwind preset fixes", () => {
  /**
   * Without tailwind-merge, two plain utilities setting the same property with
   * the same variant conflict (CSS order decides). The invalid class must win:
   * within each (variant, property) group at most one class may be non-important,
   * and if there are several, an important one must exist.
   */
  function conflicts(className: string): string[] {
    const groups = new Map<string, { important: boolean; cls: string }[]>();
    for (const cls of className.split(/\s+/).filter(Boolean)) {
      const m = cls.match(/^((?:[a-z0-9-]+:)*)(!?)(border|ring)-(red|gray|blue|green|amber)-\d+(\/\d+)?$/);
      if (!m) continue;
      const key = `${m[1]}${m[3]}-color`;
      const list = groups.get(key) || [];
      list.push({ important: m[2] === "!", cls });
      groups.set(key, list);
    }
    const bad: string[] = [];
    groups.forEach((list, key) => {
      if (list.length > 1 && list.filter((c) => c.important).length !== 1) bad.push(key);
    });
    return bad;
  }

  it("invalid state wins without tailwind-merge", () => {
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Editor id="i" title="I" invalid invalidMessage="bad" />
        <Editor id="s" title="S" type={Input.Select} options={["a"]} invalid invalidMessage="bad" />
      </SmartRProvider>
    );
    const input = container.querySelector("input#i") as HTMLElement;
    expect(input.className).toContain("!border-red-500");
    expect(conflicts(input.className)).toEqual([]);
    expect(conflicts((container.querySelector("select#s") as HTMLElement).className)).toEqual([]);
    // the helper does detect the old, conflicting classes
    expect(conflicts("border-gray-300 border-red-500")).toEqual(["border-color"]);
  });

  it("xs overrides size (no two unprefixed col-span classes)", () => {
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Column size={ColumnSize.Col6} xs={ColumnSize.Col4} md={ColumnSize.Col3} />
        <Column size={ColumnSize.Col6} />
        <Column xs={ColumnSize.Col4} />
      </SmartRProvider>
    );
    const cols = container.querySelectorAll("div");
    expect(cols[0].className).toBe("col-span-4 md:col-span-3");
    expect(cols[1].className).toBe("col-span-6");
    expect(cols[2].className.trim()).toBe("col-span-4");
    // Bootstrap keeps both classes, as in 1.1.0
    expect(getGridColumnClasses(defaultConfig, { size: 6 as any, xs: 4 as any })).toBe(
      "col-6 col-xs-4"
    );
  });

  it("does not require Tailwind 3.4 utilities (min-w-8)", () => {
    expect(JSON.stringify(tailwindPreset)).not.toMatch(/\bmin-w-8\b/);
  });

  it("subpath sources contain no Bootstrap classes", () => {
    // tailwind.ts may only import (non-type) from sharedConfig
    const source = fs.readFileSync(path.join(__dirname, "../src/presets/tailwind.ts"), "utf8");
    const runtimeImports = source
      .split("\n")
      .filter((l) => /^import\s/.test(l) && !/^import type\s/.test(l));
    expect(runtimeImports.join("\n")).not.toMatch(/defaultConfig|merge|configManager/);
    // sharedConfig holds no class maps
    const json = JSON.stringify(sharedConfig);
    expect(json).not.toMatch(/"classes"/);
    const tokens = new Set(json.match(/[a-z0-9-]+/gi));
    for (const token of [
      "form-control",
      "form-group",
      "input-group",
      "input-group-text",
      "table-bordered",
      "table-hover",
      "alert-info",
      "col-form-label",
      "is-invalid",
      "me-2",
      "transition-all",
      "d-flex",
      "smart-tooltip",
      "tooltip-icon",
    ]) {
      expect(tokens.has(token)).toBe(false);
    }
  });

  it("tailwind preset keeps every non-class value of the default config", () => {
    const strip = (cfg: any) => {
      const { grid, behavior, components, resources, ...rest } = cfg;
      const comps: any = {};
      for (const [name, c] of Object.entries<any>(components)) {
        const { classes, icons, ...other } = c;
        comps[name] = other;
      }
      // card-view group texts: Portuguese (1.1.0) in Bootstrap, English elsewhere
      const { cardGroupCountFormat, cardGroupFooterText, ...tableTexts } = comps.table.texts;
      comps.table = { ...comps.table, texts: tableTexts };
      const { icons, ...res } = resources;
      const {
        emitDataAttributes,
        hideEmptyIcons,
        instanceClassesLast,
        accessibility,
        ...behRest
      } = behavior;
      // non-Bootstrap opt-ins: `mask=""` opt-out and the unicode e-mail rule
      const { emptyDisablesDefault, ...input } = behRest.input;
      const { emailRule, ...validation } = behRest.validation;
      const beh = { ...behRest, input, validation };
      // the note element is a presentational tag (<label> in Bootstrap, <p> elsewhere)
      const { tags, ...restNoTags } = rest;
      const { noteTag, ...otherTags } = tags;
      return { rest: { ...restNoTags, tags: otherTags }, comps, res, beh };
    };
    expect(strip(tailwindPreset)).toEqual(strip(defaultConfig));
    expect(Object.keys(tailwindPreset.resources.icons)).toEqual(
      Object.keys(defaultConfig.resources.icons)
    );
    expect(Object.keys(tailwindPreset.components.table.icons)).toEqual(
      Object.keys(defaultConfig.components.table.icons)
    );
    expect(createConfig(tailwindPreset).behavior.hideEmptyIcons).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Package exports map
// ---------------------------------------------------------------------------
describe("package.json exports", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));

  it("keeps the legacy fields and exposes the tailwind subpath", () => {
    expect(pkg.main).toBe("dist/index.js");
    expect(pkg.module).toBe("dist/index.esm.js");
    expect(pkg.types).toBe("dist/index.d.ts");
    expect(pkg.exports["."].types).toBe("./dist/index.d.ts");
    expect(pkg.exports["."].default).toBe("./dist/index.js");
    const tw = pkg.exports["./presets/tailwind"];
    expect(tw.import.default).toBe("./dist/presets/tailwind.mjs");
    expect(tw.import.types).toBe("./dist/presets/tailwind.d.mts");
    expect(tw.require.default).toBe("./dist/presets/tailwind.js");
    expect(pkg.exports["./package.json"]).toBe("./package.json");
    const nested = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../presets/tailwind/package.json"), "utf8")
    );
    expect(nested.main).toBe("../../dist/presets/tailwind.js");
    expect(nested.types).toBe("../../dist/presets/tailwind.d.ts");
  });
});
