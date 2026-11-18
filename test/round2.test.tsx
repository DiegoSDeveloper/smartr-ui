/**
 * Second round: shadcn preset, class precedence, invalid/errors sync + ARIA,
 * select slot data, per-control classes, ReactNode texts + switch layout,
 * typed values, core entry (lazy controls), translation keys, File labels,
 * fresh handlers.
 */
import React from "react";
import fs from "fs";
import path from "path";
import { render, fireEvent, act, screen, waitFor } from "@testing-library/react";
import {
  Column,
  ColumnSize,
  Container,
  ContainerRef,
  Editor,
  EditorRef,
  Input,
  Row,
  SmartRControlProps,
  SmartRProvider,
  SmartRSelectOption,
  Table,
  Tooltip,
  ValueType,
  createConfig,
  defaultConfig,
  defaultTexts,
  defaultTextsTree,
  getTranslationKeys,
  shadcnPreset,
  smartrTranslationKeys,
  tailwindPreset,
  translationKeyAliases,
  unstyledPreset,
} from "../src";
import * as core from "../src/core";
import * as shadcnEntry from "../src/presets/shadcn";
import * as sharedConfig from "../src/config/sharedConfig";

const root = path.join(__dirname, "..");

/** Minimal tailwind-merge stand-in: the last class of a "group" wins. */
const fakeTwMerge = (...classes: string[]) => {
  const map = new Map<string, string>();
  for (const cls of classes.join(" ").split(/\s+/).filter(Boolean)) {
    const group = cls.replace(/-[^-]+$/, "");
    map.delete(group);
    map.set(group, cls);
  }
  return Array.from(map.values()).join(" ");
};

// ---------------------------------------------------------------------------
// 1. shadcn (theme-token) preset
// ---------------------------------------------------------------------------
describe("shadcn preset", () => {
  const fixedPalette = /\b(?:bg|text|border|ring|from|to|via)-(?:gray|slate|zinc|neutral|stone|red|blue|white|black)(?:-\d+)?\b/;

  it("uses CSS-variable tokens, no fixed palette in controls", () => {
    const e = shadcnPreset.components.editor.classes;
    expect(e.input).toContain("h-10");
    expect(e.input).toContain("rounded-md");
    expect(e.input).toContain("border-input");
    expect(e.input).toContain("bg-background");
    expect(e.input).toContain("ring-offset-background");
    expect(e.input).toContain("focus-visible:ring-ring");
    expect(e.input).toContain("placeholder:text-muted-foreground");
    expect(e.input).toContain("md:text-sm");
    expect(e.select).toContain("h-10");
    expect(e.textarea).toContain("min-h-[80px]");
    expect(e.label).toContain("text-sm font-medium leading-none");
    expect(e.labelNote).toContain("text-muted-foreground");
    expect(e.invalid).toContain("!border-destructive");
    expect(shadcnPreset.components.validation.classes.messageError).toContain("text-destructive");
    expect(shadcnPreset.components.select.classes.optionsContainer).toContain(
      "bg-popover text-popover-foreground"
    );
    expect(shadcnPreset.components.select.classes.optionActive).toBe(
      "bg-accent text-accent-foreground"
    );
    expect(shadcnPreset.components.loading.classes.spinner).toContain("border-t-primary");
    // dark mode with zero overrides: no fixed colors anywhere but the
    // success/warning states (which have explicit dark: variants)
    const json = JSON.stringify({
      ...shadcnPreset,
      components: {
        ...shadcnPreset.components,
        validation: undefined,
        alert: undefined,
      },
    });
    expect(json).not.toMatch(fixedPalette);
    expect(shadcnPreset.components.validation.classes.messageSuccess).toContain("dark:");
  });

  it("keeps every non-class value of the default config and enables the new flags", () => {
    expect(shadcnPreset.resources.validationMessages).toEqual(
      defaultConfig.resources.validationMessages
    );
    expect(shadcnPreset.components.table.texts).toEqual({
      ...defaultConfig.components.table.texts,
      ...sharedConfig.englishCardGroupTexts,
    });
    expect(Object.keys(shadcnPreset.resources.icons)).toEqual(
      Object.keys(defaultConfig.resources.icons)
    );
    expect(Object.values(shadcnPreset.resources.icons).every((i) => i === false)).toBe(true);
    expect(shadcnPreset.behavior).toMatchObject({
      emitDataAttributes: true,
      hideEmptyIcons: true,
      instanceClassesLast: true,
      accessibility: { aria: true },
    });
    expect(shadcnPreset.tags.noteTag).toBe("p");
  });

  it("renders shadcn controls with ARIA wiring", () => {
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <Editor id="name" title="Name" note="Your full name" required />
        <Editor id="kind" title="Kind" type={Input.Select} options={["a", "b"]} />
        <Editor id="bio" title="Bio" type={Input.LongText} rows={3} />
        <Editor id="mail" title="Mail" type={Input.Email} />
      </SmartRProvider>
    );
    const name = container.querySelector("input#name")!;
    expect(name.className).toContain("border-input");
    expect(name.getAttribute("aria-describedby")).toBe("name-note");
    const note = container.querySelector("#name-note")!;
    expect(note.tagName).toBe("P");
    expect(note.textContent).toBe("Your full name");
    expect(container.querySelector("select#kind")!.className).toContain("justify-between");
    expect(container.querySelector("textarea#bio")!.className).toContain("min-h-[80px]");
    // icons are false: no input-group wrapper, no Font Awesome
    expect(container.innerHTML).not.toContain("fa-");
    expect(container.querySelector("input#mail")!.parentElement!.className).toContain("space-y-2");
  });

  it("subpath entry is class-free of Bootstrap and only imports shared data", () => {
    const source = fs.readFileSync(path.join(root, "src/presets/shadcn.ts"), "utf8");
    const runtimeImports = source
      .split("\n")
      .filter((l) => /^import\s/.test(l) && !/^import type\s/.test(l));
    expect(runtimeImports.join("\n")).not.toMatch(/defaultConfig|merge|configManager|"\.\/tailwind"/);
    const tokens = new Set(JSON.stringify(shadcnPreset).match(/[a-z0-9-]+/gi));
    for (const token of [
      "form-control",
      "form-group",
      "input-group",
      "input-group-text",
      "table-bordered",
      "alert-info",
      "col-form-label",
      "is-invalid",
      "d-flex",
      "smart-tooltip",
    ]) {
      expect(tokens.has(token)).toBe(false);
    }
    expect(shadcnEntry.shadcnPreset).toBe(shadcnPreset);
    expect(shadcnEntry.shadcnSafelist).toContain("md:col-span-6");
    expect(shadcnEntry.shadcnSafelist).toContain("2xl:col-auto");
  });

  it("package.json exposes presets/shadcn and core like the other subpaths", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const sh = pkg.exports["./presets/shadcn"];
    expect(sh.import.default).toBe("./dist/presets/shadcn.mjs");
    expect(sh.import.types).toBe("./dist/presets/shadcn.d.mts");
    expect(sh.module).toBe("./dist/presets/shadcn.esm.js");
    expect(sh.require.default).toBe("./dist/presets/shadcn.js");
    expect(sh.require.types).toBe("./dist/presets/shadcn.d.ts");
    expect(pkg.exports["./core"]).toEqual({
      types: "./dist/core.d.ts",
      module: "./dist/core.esm.js",
      default: "./dist/core.js",
    });
    expect(pkg.files).toEqual(expect.arrayContaining(["dist", "core", "presets"]));
    const nested = JSON.parse(
      fs.readFileSync(path.join(root, "presets/shadcn/package.json"), "utf8")
    );
    expect(nested.main).toBe("../../dist/presets/shadcn.js");
    expect(nested.types).toBe("../../dist/presets/shadcn.d.ts");
    const nestedCore = JSON.parse(fs.readFileSync(path.join(root, "core/package.json"), "utf8"));
    expect(nestedCore.main).toBe("../dist/core.js");
    expect(nestedCore.types).toBe("../dist/core.d.ts");
  });

  it("extensionless deep imports resolve types (smartr-ui/dist/Container/Container)", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    // pre-exports apps deep-import declaration files without an extension
    expect(pkg.exports["./dist/*"]).toEqual({ types: "./dist/*.d.ts", default: "./dist/*.js" });
    // explicit files keep resolving to themselves (the longer pattern wins)
    expect(pkg.exports["./dist/*.js"]).toBe("./dist/*.js");
    expect(pkg.exports["./dist/*.mjs"]).toBe("./dist/*.mjs");
  });
});

// ---------------------------------------------------------------------------
// 2. Class precedence
// ---------------------------------------------------------------------------
describe("class precedence", () => {
  it("bootstrap keeps the 1.1.0 order (instance className first)", () => {
    const { container } = render(
      <>
        <Row className="g-3" />
        <Column size={ColumnSize.Col6} className="mine" />
        <Editor id="t" className="mine" createColumn={false} />
      </>
    );
    const [row, col] = Array.from(container.children) as HTMLElement[];
    expect(row.className).toBe("g-3 row");
    expect(col.className).toBe("mine col-6");
    expect(container.querySelector("input#t")!.className).toBe("mine form-control");
  });

  it("non-bootstrap presets put instance classes last; a merger lets them win", () => {
    const config = createConfig(tailwindPreset, { mergeClasses: fakeTwMerge });
    const { container } = render(
      <SmartRProvider config={config}>
        <Row className="gap-x-3" />
        <Column size={ColumnSize.Col6} className="col-span-4" />
        <Editor id="t" className="px-8" invalid createColumn={false} classNames={{ input: "py-1" }} />
      </SmartRProvider>
    );
    const [row, col] = Array.from(container.children) as HTMLElement[];
    expect(row.className).toBe("grid grid-cols-12 gap-y-3 gap-x-3");
    expect(col.className).toBe("col-span-4");
    const input = container.querySelector("input#t")!.className;
    expect(input).toContain("px-8");
    expect(input).not.toMatch(/\bpx-3\b/);
    expect(input).toMatch(/py-1$/);
    // the invalid state is still applied after the instance className
    expect(input).toContain("!border-red-500");
  });

  it("tailwind preset without a merger: instance className is appended last", () => {
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Row className="gap-x-3" />
      </SmartRProvider>
    );
    expect((container.firstChild as HTMLElement).className).toBe(
      "grid grid-cols-12 gap-x-4 gap-y-3 gap-x-3"
    );
  });

  it("bootstrap + mergeClasses also moves the instance last", () => {
    const { container } = render(
      <SmartRProvider config={{ mergeClasses: (...c: string[]) => c.join(" ") }}>
        <Row className="g-3" />
        <Table columns={[{ name: "a", title: "A" }]} data={[{ a: 1 }]} className="mine" />
      </SmartRProvider>
    );
    expect((container.firstChild as HTMLElement).className).toBe("row g-3");
    expect(container.querySelector("table")!.className).toMatch(/table-hover mine$/);
  });

  it("Tooltip className follows the same rule", () => {
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Tooltip text="hi" className="mine">
          <span>x</span>
        </Tooltip>
      </SmartRProvider>
    );
    fireEvent.mouseEnter(container.querySelector("span")!);
    const bubble = document.body.querySelector('[data-state="open"]') as HTMLElement;
    expect(bubble.className).toMatch(/ mine$/);
  });
});

// ---------------------------------------------------------------------------
// 3. invalid / errors sync + accessibility
// ---------------------------------------------------------------------------
describe("invalid and errors props", () => {
  it("re-syncs `invalid` when the parent changes it after mount", () => {
    const { container, rerender } = render(<Editor id="a" invalid={false} invalidMessage="Taken" />);
    const input = () => container.querySelector("input#a")!;
    expect(input().className).toBe("form-control");
    rerender(<Editor id="a" invalid invalidMessage="Taken" />);
    expect(input().className).toBe("form-control is-invalid");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(container.textContent).toContain("Taken");
    rerender(<Editor id="a" invalid={false} invalidMessage="Taken" />);
    expect(input().className).toBe("form-control");
    expect(input().hasAttribute("aria-invalid")).toBe(false);
  });

  it("`errors` drives the invalid state and renders the messages", () => {
    const { container, rerender } = render(<Editor id="e" errors={["Server says no", "Also this"]} />);
    const input = container.querySelector("input#e")!;
    expect(input.className).toBe("form-control is-invalid");
    const messages = container.querySelectorAll(".error-validation-message");
    expect(Array.from(messages).map((m) => m.textContent)).toEqual(["Server says no", "Also this"]);
    // Bootstrap: no ARIA wiring unless opted in (markup like 1.1.0)
    expect(messages[0].hasAttribute("role")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    rerender(<Editor id="e" errors={null} />);
    expect(container.querySelector("input#e")!.className).toBe("form-control");
    expect(container.querySelectorAll(".error-validation-message")).toHaveLength(0);
  });

  it("Bootstrap opt-in: behavior.accessibility.aria", () => {
    const { container } = render(
      <SmartRProvider config={{ behavior: { accessibility: { aria: true } } }}>
        <Editor id="b" note="hint" errors="Bad" />
      </SmartRProvider>
    );
    const input = container.querySelector("input#b")!;
    expect(input.getAttribute("aria-describedby")).toBe("b-note b-error");
    const note = container.querySelector("#b-note")!;
    expect(note.tagName).toBe("LABEL"); // Bootstrap keeps the 1.1.0 <label> note
    const error = container.querySelector("#b-error")!;
    expect(error.getAttribute("role")).toBe("alert");
    expect(error.textContent).toBe("Bad");
  });

  it("non-bootstrap presets wire validation messages on blur", async () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="r" title="R" required note="needed" />
      </SmartRProvider>
    );
    const input = container.querySelector("input#r")!;
    expect(input.getAttribute("aria-describedby")).toBe("r-note");
    await act(async () => {
      fireEvent.blur(input, { target: { value: "" } });
    });
    expect(input.getAttribute("aria-describedby")).toBe("r-note r-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alert = screen.getByRole("alert");
    expect(alert.id).toBe("r-error");
    expect(alert.textContent).toBe("This field is required");
  });

  it("generates ids when the Editor has no id/name", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor note="n" createColumn={false} />
      </SmartRProvider>
    );
    const input = container.querySelector("input")!;
    const describedBy = input.getAttribute("aria-describedby")!;
    expect(describedBy).toMatch(/^smartr-editor-\d+-note$/);
    expect(container.querySelector(`#${describedBy}`)!.textContent).toBe("n");
  });

  it("custom controls receive aria-describedby", () => {
    let received: SmartRControlProps | undefined;
    const MyInput = React.forwardRef<HTMLInputElement, SmartRControlProps>((props, ref) => {
      received = props;
      const { invalid, required, ...rest } = props;
      return <input ref={ref} {...rest} />;
    });
    render(
      <SmartRProvider config={tailwindPreset}>
        <Editor id="c" note="n" errors="x" render={{ input: MyInput }} />
      </SmartRProvider>
    );
    expect(received!["aria-describedby"]).toBe("c-note c-error");
    expect(received!.invalid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Select slot receives data
// ---------------------------------------------------------------------------
describe("select render slot data", () => {
  const OPTIONS = [
    { id: 1, description: "Alpha", group: "G1", tooltip: "tip" },
    { id: 2, description: "Beta", disabled: true },
  ];

  function capture() {
    const seen: SmartRControlProps[] = [];
    const MySelect = React.forwardRef<HTMLSelectElement, SmartRControlProps>((props, ref) => {
      seen.push(props);
      return <select ref={ref} id={props.id} name={props.name} value={props.value} onChange={props.onChange} />;
    });
    return { seen, MySelect };
  }

  it("passes options (with the none option), multiple and noneOption", () => {
    const { seen, MySelect } = capture();
    render(<Editor id="s" type={Input.Select} options={OPTIONS} render={{ select: MySelect }} />);
    const props = seen[seen.length - 1];
    expect(props.multiple).toBe(false);
    expect(props.noneOption).toEqual({ value: "", label: "None selected" });
    const options = props.options as SmartRSelectOption[];
    expect(options.map(({ source, ...o }) => o)).toEqual([
      { value: "", label: "None selected", none: true },
      { value: 1, label: "Alpha", group: "G1", tooltip: "tip" },
      { value: 2, label: "Beta", disabled: true },
    ]);
    expect(options[1].source).toBe(OPTIONS[0]);
    // children are still provided for adapters that parse them
    expect(React.Children.count(props.children)).toBe(3);
  });

  it("optionGetDescription, primitive options and optionsFirstSelected", () => {
    const { seen, MySelect } = capture();
    render(
      <Editor
        id="s"
        type={Input.Select}
        options={["x", "y"]}
        optionsFirstSelected
        optionGetDescription={(o) => `#${o.description}`}
        render={{ select: MySelect }}
      />
    );
    const props = seen[seen.length - 1];
    expect(props.noneOption).toBeNull();
    expect((props.options as SmartRSelectOption[]).map((o) => [o.value, o.label])).toEqual([
      ["x", "#x"],
      ["y", "#y"],
    ]);
  });

  it("native select does not receive the data props as DOM attributes", () => {
    const { container } = render(<Editor id="n" type={Input.Select} options={OPTIONS} />);
    const select = container.querySelector("select#n")!;
    expect(select.hasAttribute("options")).toBe(false);
    expect(select.hasAttribute("noneoption")).toBe(false);
    expect(select.hasAttribute("multiple")).toBe(false);
  });

  it("a Radix-style adapter can map the empty none value to a sentinel", async () => {
    const NONE = "__none__";
    let onChangeFromSlot: ((e: any) => void) | undefined;
    const Adapter = React.forwardRef<any, SmartRControlProps>(({ options = [], value, onChange, name }, ref) => {
      React.useImperativeHandle(ref, () => ({ value: value ?? "" }), [value]);
      onChangeFromSlot = (v: string) =>
        onChange?.({ target: { name, value: v === NONE ? "" : v } });
      return (
        <ul>
          {options.map((o) => (
            <li key={String(o.value)} data-value={o.none ? NONE : String(o.value)}>
              {o.label}
            </li>
          ))}
        </ul>
      );
    });
    const onValueChange = vi.fn();
    const { container } = render(
      <Editor id="r" type={Input.Select} options={OPTIONS} render={{ select: Adapter }} onValueChange={onValueChange} />
    );
    expect(Array.from(container.querySelectorAll("li")).map((li) => li.getAttribute("data-value"))).toEqual([
      NONE,
      "1",
      "2",
    ]);
    await act(async () => onChangeFromSlot!("2"));
    expect(onValueChange).toHaveBeenLastCalledWith("2", expect.anything());
    await act(async () => onChangeFromSlot!(NONE));
    expect(onValueChange).toHaveBeenLastCalledWith("", expect.anything());
  });
});

// ---------------------------------------------------------------------------
// 5. Per-control class keys
// ---------------------------------------------------------------------------
describe("per-control class keys", () => {
  it("fall back to editor.classes.input (Bootstrap unchanged)", () => {
    expect(defaultConfig.components.editor.classes.select).toBeUndefined();
    expect(defaultConfig.components.editor.classes.textarea).toBeUndefined();
    expect(defaultConfig.components.editor.classes.file).toBeUndefined();
    const { container } = render(
      <>
        <Editor id="s" type={Input.Select} options={["a"]} />
        <Editor id="t" type={Input.LongText} />
        <Editor id="f" type={Input.File} />
      </>
    );
    expect(container.querySelector("select#s")!.className).toBe("form-control");
    expect(container.querySelector("textarea#t")!.className).toBe("form-control");
    expect(container.querySelector('input[type="text"][readonly]')!.className).toBe("form-control");
  });

  it("select / textarea / file / checkbox-switch keys are used when set", () => {
    const config = {
      components: {
        editor: { classes: { select: "SEL", textarea: "TXT", file: "FIL" } },
        checkbox: { classes: { switch: "SW" } },
      },
    };
    const { container } = render(
      <SmartRProvider config={config}>
        <Editor id="i" />
        <Editor id="s" type={Input.Select} options={["a"]} />
        <Editor id="t" type={Input.LongText} />
        <Editor id="f" type={Input.File} />
        <Editor id="c" type={Input.CheckBox} checkBoxText="C" />
        <Editor id="w" type={Input.CheckBox} checkBoxText="W" layout="switch" />
        <Editor id="r" type={Input.Radio} options={["a"]} />
      </SmartRProvider>
    );
    expect(container.querySelector("input#i")!.className).toBe("form-control");
    expect(container.querySelector("select#s")!.className).toBe("SEL");
    expect(container.querySelector("textarea#t")!.className).toBe("TXT");
    expect(container.querySelector('input[type="text"][readonly]')!.className).toBe("FIL");
    expect(container.querySelector("input#c")!.className).toBe("form-check-input");
    expect(container.querySelector("input#w")!.className).toBe("SW");
    expect(container.querySelector('input[type="radio"]')!.className).toBe("form-check-input");
  });
});

// ---------------------------------------------------------------------------
// 6. ReactNode texts + switch layout
// ---------------------------------------------------------------------------
describe("ReactNode title / note / checkBoxText and switch layout", () => {
  it("strings render exactly as before; nodes are rendered as-is", () => {
    const { container } = render(
      <>
        <Editor id="a" title="Plain" note="Note" />
        <Editor id="b" title={<span className="t">Rich</span>} note={<em>Em</em>} />
        <Editor id="c" type={Input.CheckBox} checkBoxText={<strong>Bold</strong>} />
      </>
    );
    expect(container.querySelector("#lbla")!.innerHTML).toBe("Plain");
    expect(container.querySelector("#lblb")!.innerHTML).toBe('<span class="t">Rich</span>');
    expect(container.querySelector("em")!.parentElement!.tagName).toBe("LABEL");
    expect(container.querySelector("label[for=c] strong")!.textContent).toBe("Bold");
  });

  it("validation and getTitle use the text of a node title", async () => {
    const ref = React.createRef<EditorRef>();
    render(<Editor ref={ref} id="x" title={<>Full <b>name</b></>} required />);
    expect(ref.current!.getTitle()).toBe("Full name");
    let results: any[] = [];
    await act(async () => {
      results = await ref.current!.validate();
    });
    expect(results[0].Title).toBe("Full name");
  });

  it('layout="switch": label + note left, control right', () => {
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <Editor
          id="sw"
          type={Input.CheckBox}
          layout="switch"
          checkBoxText="Allow override"
          note="Senders may change it"
          value
          createColumn={false}
        />
      </SmartRProvider>
    );
    const row = container.querySelector(".rounded-lg")!;
    const [text, control] = Array.from(row.children) as HTMLElement[];
    expect(text.querySelector("label")!.getAttribute("for")).toBe("sw");
    expect(text.querySelector("label")!.textContent).toBe("Allow override");
    expect(text.querySelector("p#sw-note")!.textContent).toBe("Senders may change it");
    const input = control.querySelector("input#sw") as HTMLInputElement;
    expect(input.checked).toBe(true);
    expect(input.className).toContain("appearance-none");
    expect(input.getAttribute("aria-describedby")).toBe("sw-note");
    // the checkbox label is not duplicated
    expect(container.querySelectorAll("label")).toHaveLength(1);
  });

  it("switch layout toggles through formState like a checkbox", async () => {
    function Form() {
      const [state, setState] = React.useState<any>({ on: false });
      return (
        <>
          <Editor id="on" type={Input.CheckBox} layout="switch" title="On" formState={state} dispatchFormState={setState} />
          <span data-testid="v">{String(state.on)}</span>
        </>
      );
    }
    const { container } = render(<Form />);
    await act(async () => {
      fireEvent.click(container.querySelector("input#on")!);
    });
    expect(screen.getByTestId("v").textContent).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// 7. Typed values
// ---------------------------------------------------------------------------
describe("typed values", () => {
  it("onValueChange receives the converted value first", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <>
        <Editor<number> id="n" type={Input.Integer} onValueChange={onValueChange} onChange={onChange} />
        <Editor<boolean> id="b" type={Input.CheckBox} onValueChange={onValueChange} />
      </>
    );
    await act(async () => {
      fireEvent.change(container.querySelector("input#n")!, { target: { value: "42" } });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(42, expect.objectContaining({ target: expect.anything() }));
    expect(onChange).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(container.querySelector("input#b")!);
    });
    expect(onValueChange).toHaveBeenLastCalledWith(true, expect.anything());
  });

  it("type-level: TValue is never inferred (untyped usage unchanged)", () => {
    // compile-time checks (validated by the consumer type check in the release notes)
    const untyped = <Editor id="u" value="x" onChange={(_e, v: number) => v} />;
    const typed = <Editor<boolean> id="t" value={true} onValueChange={(v) => v === true} />;
    expect(untyped).toBeTruthy();
    expect(typed).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 8. Core entry (lazy heavy controls) and sideEffects
// ---------------------------------------------------------------------------
describe("smartr-ui/core", () => {
  it("does not export Table; renders simple editors synchronously and identically", () => {
    expect((core as any).Table).toBeUndefined();
    const a = render(<core.Editor id="x" title="X" type={Input.Email} required />).container.innerHTML;
    const b = render(<Editor id="x" title="X" type={Input.Email} required />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("loads the File control on demand", async () => {
    const { container } = render(<core.Editor id="f" title="F" type={Input.File} />);
    await waitFor(() => expect(container.querySelector('input[type="file"]#f')).not.toBeNull());
    const eager = render(<Editor id="f" title="F" type={Input.File} />).container.innerHTML;
    expect(container.innerHTML).toBe(eager);
  });

  it("shares the configuration context with the main entry", () => {
    expect(core.SmartRProvider).toBe(SmartRProvider);
    expect(core.configManager).toBeDefined();
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <core.Editor id="x" createColumn={false} />
      </SmartRProvider>
    );
    expect(container.querySelector("input#x")!.className).toContain("rounded-md");
  });

  it("package.json declares CSS side effects only", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.sideEffects).toEqual(["*.css", "*.scss"]);
    // there are no CSS imports today; if one is added it stays a side effect
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|jsx?)$/.test(f)) files.push(p);
      }
    };
    walk(path.join(root, "src"));
    for (const f of files) {
      const imports = fs.readFileSync(f, "utf8").match(/^import\s+["'][^"']+["']/gm) || [];
      for (const i of imports) expect(i).toMatch(/\.s?css["']$/);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Translation keys
// ---------------------------------------------------------------------------
describe("translation keys", () => {
  it("exports every key with alias and default text", () => {
    const required = smartrTranslationKeys.find((k) => k.key === "resources.validationMessages.required")!;
    expect(required).toEqual({
      key: "resources.validationMessages.required",
      alias: "validation.required",
      defaultText: "This field is required",
      params: 0,
    });
    expect(smartrTranslationKeys.find((k) => k.alias === "validation.minMaxNumber")!.params).toBe(2);
    expect(defaultTexts["behavior.file.filePlaceholderText"]).toBe("Select a file...");
    expect(defaultTexts["components.select.texts.loadingText"]).toBe("Loading...");
    expect(defaultTexts["components.table.texts.noRecordMessage"]).toBe("No records to display.");
    expect(defaultTexts["resources.fileTexts.uploadLabel"]).toBe("Choose file");
    expect(defaultTextsTree.resources.validationMessages.email).toBe(
      "Please enter a valid email address"
    );
    expect(translationKeyAliases["file.placeholder"]).toBe("behavior.file.filePlaceholderText");
    // every key resolves to its config path (the English texts of the
    // non-Bootstrap presets; Bootstrap keeps its 1.1.0 card-view group texts)
    for (const k of smartrTranslationKeys) {
      const value = k.key.split(".").reduce((o: any, p) => o?.[p], tailwindPreset);
      expect(value).toBe(k.defaultText);
    }
    expect(defaultTexts["components.table.texts.cardGroupCountFormat"]).toBe(" ({count} {label})");
    const custom = getTranslationKeys(
      createConfig(defaultConfig, { resources: { validationMessages: { required: "Obrigatório" } } })
    );
    expect(custom.find((k) => k.alias === "validation.required")!.defaultText).toBe("Obrigatório");
  });

  const dictionaryTranslate = (dict: Record<string, string>) => (key: string, fallback: string) =>
    dict[key] ?? fallback;

  it("dictionaries keyed by config path work", async () => {
    const translate = dictionaryTranslate({
      "resources.validationMessages.required": "Campo obrigatório",
      "components.select.texts.optionsNoneSelectedText": "Nenhum",
    });
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Editor id="r" required />
        <Editor id="s" type={Input.Select} options={["a"]} />
      </SmartRProvider>
    );
    expect(container.querySelector("option")!.textContent).toBe("Nenhum");
    await act(async () => {
      fireEvent.blur(container.querySelector("input#r")!, { target: { value: "" } });
    });
    expect(container.textContent).toContain("Campo obrigatório");
  });

  it("legacy short keys keep working as aliases", async () => {
    const translate = dictionaryTranslate({
      "validation.required": "Obrigatório (alias)",
      "select.texts.optionsNoneSelectedText": "Nenhum (alias)",
    });
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Editor id="r" required />
        <Editor id="s" type={Input.Select} options={["a"]} />
      </SmartRProvider>
    );
    expect(container.querySelector("option")!.textContent).toBe("Nenhum (alias)");
    await act(async () => {
      fireEvent.blur(container.querySelector("input#r")!, { target: { value: "" } });
    });
    expect(container.textContent).toContain("Obrigatório (alias)");
  });

  it("a translator that echoes unknown keys (i18next without defaultValue) falls back to the alias", () => {
    const dict: Record<string, string> = { "select.texts.optionsNoneSelectedText": "Nenhum" };
    const translate = (key: string) => dict[key] ?? key;
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Editor id="s" type={Input.Select} options={["a"]} />
      </SmartRProvider>
    );
    expect(container.querySelector("option")!.textContent).toBe("Nenhum");
  });
});

// ---------------------------------------------------------------------------
// 10. File controls labelled
// ---------------------------------------------------------------------------
describe("File control labels", () => {
  it("unstyled / shadcn: visible text and aria-label when icons are false", () => {
    for (const preset of [unstyledPreset, shadcnPreset]) {
      const { container, unmount } = render(
        <SmartRProvider config={preset}>
          <Editor id="f" type={Input.File} fileUrlDownload="/x.pdf" onDeleteFileClick={() => {}} />
        </SmartRProvider>
      );
      const buttons = Array.from(container.querySelectorAll('[role="button"]'));
      expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
        "Remove file",
        "Download file",
        "Choose file",
      ]);
      expect(buttons.map((b) => b.textContent)).toEqual(["Remove file", "Download file", "Choose file"]);
      expect(buttons.every((b) => b.getAttribute("tabindex") === "0")).toBe(true);
      unmount();
    }
  });

  it("keyboard activation opens the file chooser", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="f" type={Input.File} />
      </SmartRProvider>
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(fileInput, "click");
    fireEvent.keyDown(container.querySelector('[aria-label="Choose file"]')!, { key: "Enter" });
    expect(click).toHaveBeenCalled();
  });

  it("labels are translatable", () => {
    const translate = (key: string, fallback: string) =>
      key === "resources.fileTexts.uploadLabel" ? "Escolher arquivo" : fallback;
    const { container } = render(
      <SmartRProvider config={createConfig(unstyledPreset, { translate })}>
        <Editor id="f" type={Input.File} />
      </SmartRProvider>
    );
    expect(container.querySelector('[role="button"]')!.getAttribute("aria-label")).toBe("Escolher arquivo");
  });

  it("bootstrap is unchanged (icons, no role)", () => {
    const { container } = render(<Editor id="f" type={Input.File} />);
    expect(container.querySelector('[role="button"]')).toBeNull();
    expect(container.querySelector(".fa-cloud-upload-alt")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 11. Handlers always see the latest props
// ---------------------------------------------------------------------------
describe("fresh handlers (no stale useCallback deps)", () => {
  it("valueType / onChange / id changed after mount are honored", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { container, rerender } = render(
      <Editor id="v" name="v" valueType={ValueType.String} onChange={first} />
    );
    rerender(<Editor id="v" name="v" valueType={ValueType.Integer} onChange={second} />);
    await act(async () => {
      fireEvent.change(container.querySelector("input#v")!, { target: { value: "7" } });
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(expect.anything(), 7, "v", "v", Input.Text);
  });

  it("blur validation uses the latest mask / custom validation", async () => {
    const v1 = vi.fn(async () => []);
    const v2 = vi.fn(async () => []);
    const { container, rerender } = render(<Editor id="m" customValidationOnBlur={v1} />);
    rerender(<Editor id="m" customValidationOnBlur={v2} />);
    await act(async () => {
      fireEvent.blur(container.querySelector("input#m")!, { target: { value: "a" } });
    });
    expect(v1).not.toHaveBeenCalled();
    expect(v2).toHaveBeenCalled();
  });

  it("Container validation still works", async () => {
    const ref = React.createRef<ContainerRef>();
    render(
      <Container ref={ref}>
        <Editor id="c1" name="c1" required />
      </Container>
    );
    let result: any;
    await act(async () => {
      result = await ref.current!.validate();
    });
    expect(JSON.stringify(result)).toContain("This field is required");
  });
});

// ---------------------------------------------------------------------------
// 12. Version mentions
// ---------------------------------------------------------------------------
describe("version consistency", () => {
  it("package.json and the latest CHANGELOG entry name the same version", () => {
    const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
    const latest = changelog.match(/^## (\d+\.\d+\.\d+)/m)![1];
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.version).toBe(latest);
    // sources never hard-code the version
    const sources = ["src/index.ts", "src/core.ts", "src/config.ts", "src/config/defaultConfig.ts", "src/presets/tailwind.ts", "src/presets/shadcn.ts"];
    for (const f of sources) {
      expect(fs.readFileSync(path.join(root, f), "utf8")).not.toContain(latest);
    }
  });

  it("the shared config holds no class maps", () => {
    expect(JSON.stringify(sharedConfig)).not.toMatch(/"classes"/);
  });
});
