/**
 * Third round: mask/placeholder opt-out + country masks, pluggable validators,
 * validation modes, FormMessage, switch classes, slot typing, the config entry,
 * table texts, chips, external errors in validate(), lint setup, shadcn switch,
 * File text box ARIA, release metadata.
 */
import React from "react";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { render, fireEvent, act } from "@testing-library/react";
import {
  Container,
  ContainerRef,
  Editor,
  EditorRef,
  FormMessage,
  Input,
  SmartRProvider,
  Table,
  TableViewMode,
  ValueType,
  applyMask,
  createConfig,
  defaultConfig,
  phoneMasks,
  removeMask,
  resolveEditorMask,
  selectMask,
  shadcnPreset,
  tailwindPreset,
  unstyledPreset,
  isValidEmail,
} from "../src";
import * as configEntry from "../src/config";
import * as mainEntry from "../src";
import * as coreEntry from "../src/core";
import { formatTemplate } from "../src/Utils/styling";

const root = path.join(__dirname, "..");

/** Controlled Editor harness: keeps the value in state and reports it. */
function Controlled(props: any) {
  const { initial = "", onValue, ...rest } = props;
  const [value, setValue] = React.useState<any>(initial);
  return (
    <Editor
      {...rest}
      value={value}
      onValueChange={(v: any) => {
        setValue(v);
        onValue?.(v);
      }}
    />
  );
}

const change = async (el: Element, value: string) => {
  await act(async () => {
    fireEvent.change(el, { target: { value } });
  });
};
const blur = async (el: Element, value?: string) => {
  await act(async () => {
    fireEvent.blur(el, value === undefined ? undefined : { target: { value } });
  });
};

// ---------------------------------------------------------------------------
// 1. Mask / placeholder opt-out and country masks
// ---------------------------------------------------------------------------
describe("mask / placeholder opt-out", () => {
  it("bootstrap default phone mask and placeholder are unchanged", () => {
    const { container } = render(<Editor id="p" type={Input.Phone} />);
    const input = container.querySelector("input#p")!;
    expect(input.getAttribute("data-mask")).toBe("(000) 000-0000");
    expect(input.getAttribute("placeholder")).toBe("(000) 000-0000");
  });

  it("mask={false} turns the global phone mask off (any preset)", async () => {
    const onValue = vi.fn();
    const { container } = render(
      <Controlled id="p" type={Input.Phone} mask={false} onValue={onValue} />
    );
    const input = container.querySelector("input#p") as HTMLInputElement;
    expect(input.hasAttribute("data-mask")).toBe(false);
    await change(input, "+55 11 98765-4321");
    expect(input.value).toBe("+55 11 98765-4321");
    expect(onValue).toHaveBeenLastCalledWith("+55 11 98765-4321");
  });

  it('mask="" falls back to the default in Bootstrap (1.1.0) and opts out in the other presets', () => {
    const boot = render(<Editor id="b" type={Input.Phone} mask="" placeholder="" />).container;
    expect(boot.querySelector("input#b")!.getAttribute("data-mask")).toBe("(000) 000-0000");
    expect(boot.querySelector("input#b")!.getAttribute("placeholder")).toBe("(000) 000-0000");
    for (const preset of [shadcnPreset, tailwindPreset, unstyledPreset]) {
      const { container, unmount } = render(
        <SmartRProvider config={preset}>
          <Editor id="s" type={Input.Phone} mask="" placeholder="" />
        </SmartRProvider>
      );
      const input = container.querySelector("input#s")!;
      expect(input.hasAttribute("data-mask")).toBe(false);
      expect(input.hasAttribute("placeholder")).toBe(false);
      unmount();
    }
  });

  it("placeholder={false} removes the default placeholder; an explicit one still wins", () => {
    const { container } = render(
      <>
        <Editor id="a" type={Input.Phone} placeholder={false} />
        <Editor id="b" type={Input.Phone} placeholder="+1 …" />
        <Editor id="c" type={Input.File} placeholder={false} />
      </>
    );
    expect(container.querySelector("input#a")!.hasAttribute("placeholder")).toBe(false);
    expect(container.querySelector("input#a")!.getAttribute("data-mask")).toBe("(000) 000-0000");
    expect(container.querySelector("input#b")!.getAttribute("placeholder")).toBe("+1 …");
    // the File text box (first text input of the group) has no placeholder
    const fileBox = container.querySelector('input[type="text"][readonly]')!;
    expect(fileBox.hasAttribute("placeholder")).toBe(false);
  });

  it('mask="phone-br" switches landline / mobile by length', async () => {
    const onValue = vi.fn();
    const { container } = render(
      <Controlled id="br" type={Input.Mobile} mask="phone-br" onValue={onValue} />
    );
    const input = container.querySelector("input#br") as HTMLInputElement;
    expect(input.getAttribute("placeholder")).toBe("(00) 00000-0000");
    await change(input, "11987654321");
    expect(input.value).toBe("(11) 98765-4321");
    expect(onValue).toHaveBeenLastCalledWith("11987654321");
    await change(input, "1133334444");
    expect(input.value).toBe("(11) 3333-4444");
    expect(onValue).toHaveBeenLastCalledWith("1133334444");
  });

  it("phoneCountry per instance and behavior.input.phoneCountry globally", async () => {
    const { container } = render(
      <>
        <Controlled id="l" type={Input.Phone} phoneCountry="BR-LANDLINE" />
        <SmartRProvider config={{ behavior: { input: { phoneCountry: "BR" } } }}>
          <Controlled id="g" type={Input.Phone} />
          <Controlled id="us" type={Input.Phone} phoneCountry="US" />
        </SmartRProvider>
      </>
    );
    const l = container.querySelector("input#l") as HTMLInputElement;
    expect(l.getAttribute("placeholder")).toBe("(00) 0000-0000");
    await change(l, "1133334444");
    expect(l.value).toBe("(11) 3333-4444");
    const g = container.querySelector("input#g") as HTMLInputElement;
    await change(g, "21912345678");
    expect(g.value).toBe("(21) 91234-5678");
    const us = container.querySelector("input#us") as HTMLInputElement;
    await change(us, "4155550100");
    expect(us.value).toBe("(415) 555-0100");
  });

  it("mask helpers accept alternatives", () => {
    expect(phoneMasks.US).toBe("(000) 000-0000");
    expect(selectMask(phoneMasks.BR, "11987654321")).toBe("(00) 00000-0000");
    expect(selectMask(phoneMasks.BR, "113333")).toBe("(00) 0000-0000");
    expect(selectMask("(000)", "1")).toBe("(000)");
    expect(applyMask(Input.Phone, phoneMasks.BR, "11987654321", ".", ",", 2)).toBe("(11) 98765-4321");
    expect(removeMask(Input.Phone, phoneMasks.BR, "(11) 3333-4444", ".", ",")).toBe("1133334444");
    expect(resolveEditorMask({ type: Input.Phone, mask: false }, defaultConfig)).toBeUndefined();
    expect(resolveEditorMask({ type: Input.Phone }, defaultConfig)).toBe("(000) 000-0000");
    expect(resolveEditorMask({ type: Input.Text, mask: "000" }, defaultConfig)).toBe("000");
    expect(resolveEditorMask({ type: Input.Phone, mask: "phone-xx" }, defaultConfig)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Pluggable validators
// ---------------------------------------------------------------------------
describe("validators", () => {
  it("bootstrap keeps the 1.1.0 e-mail rule exactly (no trim, ASCII only)", () => {
    expect(isValidEmail("a@b.com", defaultConfig)).toBe(true);
    expect(isValidEmail(" a@b.com ", defaultConfig)).toBe(false);
    expect(isValidEmail("josé@exämple.com", defaultConfig)).toBe(false);
  });

  it("non-bootstrap presets trim and accept IDN / unicode domains", () => {
    for (const preset of [shadcnPreset, tailwindPreset, unstyledPreset]) {
      expect(isValidEmail(" a@b.com ", preset)).toBe(true);
      expect(isValidEmail("josé@exämple.com.br", preset)).toBe(true);
      expect(isValidEmail("user@xn--bcher-kva.de", preset)).toBe(true);
      expect(isValidEmail("user@例え.テスト", preset)).toBe(true);
      expect(isValidEmail("a@b", preset)).toBe(false);
      expect(isValidEmail("a b@c.com", preset)).toBe(false);
      expect(isValidEmail("a@-b.com", preset)).toBe(false);
    }
  });

  it("config.validators.email replaces the built-in rule (message / false / true)", async () => {
    const email = vi.fn((value: string) =>
      value.endsWith("@corp.com") ? true : value.includes("@") ? "Use your corporate address" : false
    );
    const { container } = render(
      <SmartRProvider config={{ validators: { email } }}>
        <Editor id="e" title="E-mail" type={Input.Email} />
      </SmartRProvider>
    );
    const input = container.querySelector("input#e")!;
    await blur(input, "x@gmail.com");
    expect(container.textContent).toContain("Use your corporate address");
    await blur(input, "nope");
    expect(container.textContent).toContain("Please enter a valid email address");
    await blur(input, "me@corp.com");
    expect(container.textContent).not.toContain("valid email");
    expect(email).toHaveBeenLastCalledWith(
      "me@corp.com",
      expect.objectContaining({ type: Input.Email, name: "e", title: "E-mail" })
    );
  });

  it("per-instance validators override the configuration; false turns a rule off", async () => {
    const { container } = render(
      <SmartRProvider config={{ validators: { email: () => "global" } }}>
        <Editor id="a" type={Input.Email} validators={{ email: () => "instance" }} />
        <Editor id="b" type={Input.Email} validators={{ email: false }} />
        <Editor id="c" type={Input.Email} validators={{ email: null }} />
      </SmartRProvider>
    );
    await blur(container.querySelector("input#a")!, "x");
    await blur(container.querySelector("input#b")!, "x");
    await blur(container.querySelector("input#c")!, "x");
    expect(container.textContent).toContain("instance");
    expect(container.textContent).not.toContain("global");
    // b: rule off; c: back to the built-in rule
    expect(container.querySelectorAll(".error-validation-message").length).toBe(2);
    expect(container.textContent).toContain("Please enter a valid email address");
  });

  it("phone / url / required validators", async () => {
    const phone = vi.fn((v: string) => v.length >= 10);
    const required = (v: any) => String(v ?? "").trim() !== "";
    const { container } = render(
      <SmartRProvider config={{ validators: { phone, required, url: (v) => /^https:/.test(v) || "HTTPS only" } }}>
        <Controlled id="p" type={Input.Phone} />
        <Editor id="u" type={Input.Url} />
        <Editor id="r" required />
      </SmartRProvider>
    );
    const p = container.querySelector("input#p")!;
    await change(p, "12345");
    await blur(p);
    // the validator receives the unmasked value
    expect(phone).toHaveBeenLastCalledWith("12345", expect.anything());
    expect(container.textContent).toContain("Please enter a valid phone number");
    await blur(container.querySelector("input#u")!, "http://x.com");
    expect(container.textContent).toContain("HTTPS only");
    await blur(container.querySelector("input#r")!, "   ");
    expect(container.textContent).toContain("This field is required");
  });

  it("without validators nothing changes for phone / url", async () => {
    const { container } = render(
      <>
        <Editor id="p" type={Input.Phone} />
        <Editor id="u" type={Input.Url} />
      </>
    );
    await blur(container.querySelector("input#p")!, "1");
    await blur(container.querySelector("input#u")!, "x");
    expect(container.querySelector(".error-validation-message")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Validation modes
// ---------------------------------------------------------------------------
describe("validateMode", () => {
  it("default (unset) keeps blur validation", async () => {
    const { container } = render(<Editor id="r" required />);
    await blur(container.querySelector("input#r")!, "");
    expect(container.textContent).toContain("This field is required");
  });

  it('"change" validates on change, not on blur', async () => {
    const { container } = render(<Controlled id="r" required min={3} validateMode="change" />);
    const input = container.querySelector("input#r")!;
    await blur(input, "");
    expect(container.textContent).not.toContain("required");
    await change(input, "ab");
    expect(container.textContent).toContain("at least 3 characters");
  });

  it('"submit" validates only through validate()', async () => {
    const ref = React.createRef<EditorRef>();
    const { container } = render(<Editor ref={ref} id="r" required validateMode="submit" />);
    const input = container.querySelector("input#r")!;
    await blur(input, "");
    await change(input, "");
    expect(container.textContent).not.toContain("required");
    await act(async () => {
      await ref.current!.validate();
    });
    expect(container.textContent).toContain("This field is required");
  });

  it('"afterSubmit": silent until the Container submits, then live', async () => {
    const ref = React.createRef<ContainerRef>();
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <Container ref={ref}>
          <Controlled id="name" required validateMode="afterSubmit" />
        </Container>
      </SmartRProvider>
    );
    const input = container.querySelector("input#name")!;
    await blur(input, "");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(ref.current!.isSubmitted()).toBe(false);
    let results: any[] = [];
    await act(async () => {
      results = await ref.current!.validate();
    });
    expect(ref.current!.isSubmitted()).toBe(true);
    expect(results.length).toBe(1);
    expect(container.querySelector('[role="alert"]')!.textContent).toBe("This field is required");
    await change(input, "Ann");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await change(input, "");
    expect(container.querySelector('[role="alert"]')!.textContent).toBe("This field is required");
    await act(async () => {
      ref.current!.resetValidation();
    });
    expect(ref.current!.isSubmitted()).toBe(false);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("global behavior.validation.validateMode; explicit validateOnBlur wins", async () => {
    const { container } = render(
      <SmartRProvider config={{ behavior: { validation: { validateMode: "submit" } } }}>
        <Editor id="a" required />
        <Editor id="b" required validateOnBlur />
      </SmartRProvider>
    );
    await blur(container.querySelector("input#a")!, "");
    expect(container.textContent).not.toContain("required");
    await blur(container.querySelector("input#b")!, "");
    expect(container.textContent).toContain("This field is required");
  });
});

// ---------------------------------------------------------------------------
// 4. FormMessage
// ---------------------------------------------------------------------------
describe("FormMessage", () => {
  it("renders nothing when empty", () => {
    const { container } = render(
      <>
        <FormMessage />
        <FormMessage>{false}</FormMessage>
        <FormMessage messages={[null, "", undefined]} />
      </>
    );
    expect(container.innerHTML).toBe("");
  });

  it("bootstrap: validation message class, role=alert, id for aria-describedby", () => {
    const { container } = render(<FormMessage id="form-error">Pick a channel</FormMessage>);
    expect(container.innerHTML).toBe(
      '<div id="form-error" role="alert" class="error-validation-message" data-smartr-form-message="">Pick a channel</div>'
    );
  });

  it("preset classes, types, several messages, instance classes", () => {
    const { container } = render(
      <SmartRProvider config={createConfig(shadcnPreset, { components: { validation: { classes: { formMessage: "mt-2" } } } })}>
        <FormMessage id="e" className="text-xs" messages={["One", "Two"]} />
        <FormMessage id="s" type="success">Saved</FormMessage>
      </SmartRProvider>
    );
    const e = container.querySelector("#e")!;
    expect(e.getAttribute("role")).toBe("alert");
    expect(e.className).toBe("text-sm font-medium text-destructive mt-2 text-xs");
    expect(e.getAttribute("data-state")).toBe("error");
    expect(Array.from(e.children).map((c) => c.textContent)).toEqual(["One", "Two"]);
    const s = container.querySelector("#s")!;
    expect(s.getAttribute("role")).toBe("status");
    expect(s.className).toContain("text-green-700");
  });

  it("unstyled: no classes, role none on request", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <FormMessage role="none">x</FormMessage>
      </SmartRProvider>
    );
    const el = container.firstElementChild!;
    expect(el.hasAttribute("class")).toBe(false);
    expect(el.hasAttribute("role")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5 + 12. Switch layout classes and the shadcn native switch
// ---------------------------------------------------------------------------
describe("switch layout", () => {
  it("per-instance switchRow / switchText / switchGroup / switchThumb classes", () => {
    const { container } = render(
      <SmartRProvider config={createConfig(shadcnPreset, { mergeClasses: (...c: string[]) => c.join(" ") })}>
        <Editor
          id="s"
          type={Input.CheckBox}
          layout="switch"
          checkBoxText="Allow"
          note="note"
          classNames={{ switchRow: "p-3", switchText: "min-w-0", switchGroup: "ml-auto", switchThumb: "size-4" }}
        />
      </SmartRProvider>
    );
    const input = container.querySelector("input#s")!;
    const group = input.parentElement!;
    expect(group.className).toContain("relative inline-flex");
    expect(group.className).toContain("ml-auto");
    const row = group.parentElement!;
    expect(row.className).toContain("rounded-lg border p-4");
    expect(row.className.endsWith("p-3")).toBe(true);
    expect(row.firstElementChild!.className).toBe("space-y-0.5 min-w-0");
    expect(container.querySelector("[data-smartr-switch-thumb]")!.className).toContain("size-4");
  });

  it("shadcn: the thumb is a sibling span after the native checkbox (no ::before)", () => {
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <Editor id="s" type={Input.CheckBox} layout="switch" checkBoxText="Allow" />
      </SmartRProvider>
    );
    const input = container.querySelector("input#s")!;
    expect(input.className).toContain("peer");
    expect(input.className).toContain("appearance-none");
    expect(input.className).not.toContain("before:");
    const thumb = input.nextElementSibling!;
    expect(thumb.tagName).toBe("SPAN");
    expect(thumb.getAttribute("aria-hidden")).toBe("true");
    expect(thumb.className).toContain("peer-checked:translate-x-5");
    expect(thumb.className).toContain("absolute");
    expect(input.parentElement!.className).toContain("relative");
  });

  it("bootstrap / tailwind / custom controls get no thumb", () => {
    const Custom = React.forwardRef<HTMLButtonElement, any>((p, ref) => (
      <button ref={ref} role="switch" aria-checked={!!p.checked} />
    ));
    const { container } = render(
      <>
        <Editor id="b" type={Input.CheckBox} layout="switch" checkBoxText="B" />
        <SmartRProvider config={tailwindPreset}>
          <Editor id="t" type={Input.CheckBox} layout="switch" checkBoxText="T" />
        </SmartRProvider>
        <SmartRProvider config={shadcnPreset}>
          <Editor id="c" type={Input.CheckBox} layout="switch" checkBoxText="C" render={{ checkbox: Custom }} />
        </SmartRProvider>
      </>
    );
    expect(container.querySelectorAll("[data-smartr-switch-thumb]").length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Slot typing (tsc over test/types)
// ---------------------------------------------------------------------------
describe("slot typing", () => {
  it("test/types compiles (forwardRef and React 19 ref-as-prop patterns keep typed props)", () => {
    const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
    const result = spawnSync(process.execPath, [tsc, "--noEmit", "-p", "test/types/tsconfig.json"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(result.stdout + result.stderr).toBe("");
    expect(result.status).toBe(0);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// 7. smartr-ui/config entry
// ---------------------------------------------------------------------------
describe("smartr-ui/config", () => {
  /** Runtime (non-type) import graph of a source file. */
  function importGraph(entry: string): Set<string> {
    const seen = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const source = fs.readFileSync(file, "utf8");
      const specifiers = [
        ...source.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/gms),
        ...source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g),
      ].map((m) => m[1]);
      for (const spec of specifiers) {
        if (!spec.startsWith(".")) continue;
        const base = path.resolve(path.dirname(file), spec);
        const candidates = [base + ".ts", base + ".tsx", path.join(base, "index.ts"), path.join(base, "index.tsx")];
        const found = candidates.find((c) => fs.existsSync(c));
        if (found) visit(found);
      }
    };
    visit(path.join(root, entry));
    return new Set([...seen].map((f) => path.relative(path.join(root, "src"), f).replace(/\\/g, "/")));
  }

  it("contains no component code", () => {
    const graph = importGraph("src/config.ts");
    for (const file of graph) {
      expect(file).toMatch(/^(config\.ts|config\/|context\/|hook\/|presets\/|Utils\/translate\.ts)/);
    }
    expect(graph.has("context/SmartRProvider.tsx")).toBe(true);
    expect(graph.has("config/configManager.ts")).toBe(true);
    // the main entry does reach the Editor (sanity check of the graph walker)
    expect(importGraph("src/index.ts").has("Editor/EditorCore.tsx")).toBe(true);
  });

  it("exports the configuration API, shared with the other entries", () => {
    for (const name of [
      "configManager",
      "createConfig",
      "SmartRProvider",
      "SmartRConfigContext",
      "useSmartConfig",
      "defaultConfig",
      "bootstrapPreset",
      "tailwindPreset",
      "shadcnPreset",
      "unstyledPreset",
      "smartrTranslationKeys",
      "defaultTextsTree",
      "translationKeyPath",
      "phoneMasks",
    ]) {
      expect((configEntry as any)[name]).toBeDefined();
      expect((configEntry as any)[name]).toBe((mainEntry as any)[name]);
      expect((configEntry as any)[name]).toBe((coreEntry as any)[name]);
    }
    expect((configEntry as any).Editor).toBeUndefined();
    expect((configEntry as any).Table).toBeUndefined();
  });

  it("package.json, nested folder and rollup input", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.exports["./config"]).toEqual({
      types: "./dist/config.d.ts",
      module: "./dist/config.esm.js",
      default: "./dist/config.js",
    });
    expect(pkg.files).toContain("config");
    const nested = JSON.parse(fs.readFileSync(path.join(root, "config/package.json"), "utf8"));
    expect(nested.main).toBe("../dist/config.js");
    expect(nested.types).toBe("../dist/config.d.ts");
    const rollup = fs.readFileSync(path.join(root, "rollup.config.mjs"), "utf8");
    expect(rollup).toContain('config: "src/config.ts"');
  });
});

// ---------------------------------------------------------------------------
// 8. Table texts
// ---------------------------------------------------------------------------
const COLUMNS = [
  { header: "Name", accessor: "name" },
  { header: "Dept", accessor: "dept" },
];
const DATA = [
  { id: 1, name: "Ann", dept: "Sales" },
  { id: 2, name: "Bob", dept: "Sales" },
  { id: 3, name: "Cid", dept: "IT" },
];
const grouping = { enableGrouping: true, groupBy: "dept", expandAllGroups: true };

describe("table texts", () => {
  it("non-bootstrap presets use English card-view group texts", () => {
    for (const preset of [tailwindPreset, shadcnPreset, unstyledPreset]) {
      expect(preset.components.table.texts.cardGroupCountFormat).toBe(" ({count} {label})");
      expect(preset.components.table.texts.cardGroupFooterText).toBe("Group total: {count} records");
      const { container, unmount } = render(
        <SmartRProvider config={preset}>
          <Table columns={COLUMNS} data={DATA} grouping={grouping} viewMode={TableViewMode.CARD} />
        </SmartRProvider>
      );
      expect(container.textContent).toContain("Sales (2 records)");
      expect(container.textContent).toContain("IT (1 record)");
      expect(container.textContent).not.toContain("registro");
      unmount();
    }
  });

  it("bootstrap keeps the 1.1.0 texts", () => {
    expect(defaultConfig.components.table.texts.cardGroupCountFormat).toBe(" ({count} registro{plural})");
    const { container } = render(
      <Table columns={COLUMNS} data={DATA} grouping={grouping} viewMode={TableViewMode.CARD} />
    );
    expect(container.textContent).toContain("Sales (2 registros)");
  });

  it("translate receives the params; {0} / {count} / %sN placeholders all work", () => {
    const translate = vi.fn((key: string, fallback: string) => {
      if (key === "components.table.texts.groupHeaderCountFormat") return " [{0} {1}]";
      if (key === "components.table.texts.cardGroupCountFormat") return " <%s1 %s2>";
      return fallback;
    });
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Table columns={COLUMNS} data={DATA} grouping={grouping} />
        <Table columns={COLUMNS} data={DATA} grouping={grouping} viewMode={TableViewMode.CARD} />
      </SmartRProvider>
    );
    expect(container.textContent).toContain("Sales [2 records]");
    expect(container.textContent).toContain("IT [1 record]");
    expect(container.textContent).toContain("Sales <2 records>");
    expect(translate).toHaveBeenCalledWith(
      "components.table.texts.groupHeaderCountFormat",
      " ({count} {label})",
      [2, "records", "s"]
    );
  });

  it("formatTemplate", () => {
    expect(formatTemplate("{count} {label} {0} %s2 {unknown}", [3, "x"], { count: 3, label: "items" })).toBe(
      "3 items 3 x {unknown}"
    );
    expect(formatTemplate(undefined)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 9. Chips
// ---------------------------------------------------------------------------
const CHANNELS = [
  { id: "email", description: "E-mail" },
  { id: "sms", description: "SMS" },
  { id: "whatsapp", description: "WhatsApp", disabled: true },
];

describe("Input.Chips", () => {
  it("renders a labelled group of native checkboxes (checkbox semantics)", () => {
    const { container } = render(
      <Editor id="ch" title="Channels" type={Input.Chips} options={CHANNELS} value={["sms"]} />
    );
    const group = container.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-labelledby")).toBe("lblch");
    expect(container.querySelector("#lblch")!.textContent).toBe("Channels");
    const boxes = Array.from(group.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    expect(boxes.map((b) => b.checked)).toEqual([false, true, false]);
    expect(boxes.map((b) => b.disabled)).toEqual([false, false, true]);
    expect(boxes[0].id).toBe("ch-chip-1");
    const labels = Array.from(group.querySelectorAll("label"));
    expect(labels.map((l) => l.getAttribute("for"))).toEqual(["ch-chip-1", "ch-chip-2", "ch-chip-3"]);
    expect(labels.map((l) => l.textContent)).toEqual(["E-mail", "SMS", "WhatsApp"]);
    // Bootstrap: btn-check + outline button
    expect(boxes[0].className).toBe("btn-check");
    expect(labels[0].className).toBe("btn btn-sm btn-outline-primary rounded-pill");
  });

  it("toggles; value as array by default, csv with ValueType.String", async () => {
    const onArray = vi.fn();
    const onCsv = vi.fn();
    const { container } = render(
      <>
        <Controlled id="a" type={Input.Chips} options={CHANNELS} initial={[]} onValue={onArray} />
        <Controlled id="c" type={Input.Chips} options={CHANNELS} initial="sms" valueType={ValueType.String} onValue={onCsv} />
      </>
    );
    await act(async () => {
      fireEvent.click(container.querySelector("#a-chip-2")!);
    });
    expect(onArray).toHaveBeenLastCalledWith(["sms"]);
    await act(async () => {
      fireEvent.click(container.querySelector("#a-chip-1")!);
    });
    expect(onArray).toHaveBeenLastCalledWith(["email", "sms"]);
    expect((container.querySelector("#a-chip-1") as HTMLInputElement).checked).toBe(true);
    await act(async () => {
      fireEvent.click(container.querySelector("#a-chip-1")!);
    });
    await act(async () => {
      fireEvent.click(container.querySelector("#a-chip-2")!);
    });
    expect(onArray).toHaveBeenLastCalledWith([]);
    await act(async () => {
      fireEvent.click(container.querySelector("#c-chip-1")!);
    });
    expect(onCsv).toHaveBeenLastCalledWith("email,sms");
    // disabled chip does not toggle
    await act(async () => {
      fireEvent.click(container.querySelector("#c-chip-3")!);
    });
    expect(onCsv).toHaveBeenLastCalledWith("email,sms");
  });

  it("formState binding, uncontrolled use and required validation", async () => {
    const ref = React.createRef<ContainerRef>();
    function Form() {
      const [form, setForm] = React.useState<any>({ channels: "" });
      return (
        <Container ref={ref}>
          <Editor id="channels" type={Input.Chips} required options={CHANNELS} formState={form} dispatchFormState={setForm} />
          <span data-testid="state">{JSON.stringify(form.channels)}</span>
          <Editor id="free" type={Input.Chips} options={CHANNELS} />
        </Container>
      );
    }
    const { container, getByTestId } = render(<Form />);
    let results: any[] = [];
    await act(async () => {
      results = await ref.current!.validate();
    });
    expect(results.map((r) => r.Message)).toEqual(["This field is required"]);
    await act(async () => {
      fireEvent.click(container.querySelector("#channels-chip-1")!);
    });
    expect(getByTestId("state").textContent).toBe('["email"]');
    // uncontrolled (no value / state): keeps its own selection
    await act(async () => {
      fireEvent.click(container.querySelector("#free-chip-2")!);
    });
    expect((container.querySelector("#free-chip-2") as HTMLInputElement).checked).toBe(true);
    await act(async () => {
      results = await ref.current!.validate();
    });
    expect(results).toEqual([]);
  });

  it("validates when the focus leaves the group", async () => {
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <Editor id="ch" title="Channels" type={Input.Chips} required options={CHANNELS} note="Pick one" />
      </SmartRProvider>
    );
    const group = container.querySelector('[role="group"]')!;
    await act(async () => {
      fireEvent.blur(container.querySelector("#ch-chip-1")!, { relatedTarget: container.querySelector("#ch-chip-2") });
    });
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await act(async () => {
      fireEvent.blur(container.querySelector("#ch-chip-1")!, { relatedTarget: null });
    });
    expect(container.querySelector('[role="alert"]')!.textContent).toBe("This field is required");
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe("ch-note ch-error");
    expect(group.getAttribute("data-invalid")).toBe("true");
  });

  it("preset classes (tailwind / shadcn / unstyled) and per-instance classes", () => {
    const expectations: [any, string, string][] = [
      [tailwindPreset, "peer sr-only", "peer-checked:bg-blue-600"],
      [shadcnPreset, "peer sr-only", "peer-checked:bg-primary"],
    ];
    for (const [preset, inputClass, chipClass] of expectations) {
      const { container, unmount } = render(
        <SmartRProvider config={preset}>
          <Editor id="ch" type={Input.Chips} options={CHANNELS} value="email" classNames={{ chip: "px-4", chipGroup: "gap-1" }} />
        </SmartRProvider>
      );
      const input = container.querySelector("#ch-chip-1")!;
      expect(input.className).toBe(inputClass);
      const label = input.nextElementSibling!;
      expect(label.className).toContain(chipClass);
      expect(label.className).toContain("px-4");
      expect(label.getAttribute("data-state")).toBe("checked");
      expect(input.nextElementSibling!.nextElementSibling).toBeNull(); // peer-* scoped to its own item
      expect(container.querySelector('[role="group"]')!.className).toContain("gap-1");
      unmount();
    }
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="ch" type={Input.Chips} options={CHANNELS} />
      </SmartRProvider>
    );
    expect(container.querySelector('[role="group"]')!.innerHTML).not.toContain("class=");
  });
});

// ---------------------------------------------------------------------------
// 10. External errors in validate()
// ---------------------------------------------------------------------------
describe("errors in validate()", () => {
  it("are returned as Error results (latest value), not duplicated on screen", async () => {
    const ref = React.createRef<ContainerRef>();
    const { container, rerender } = render(
      <Container ref={ref}>
        <Editor id="email" title="E-mail" errors={null} />
      </Container>
    );
    rerender(
      <Container ref={ref}>
        <Editor id="email" title="E-mail" errors={["Already registered", <b key="b">Server says no</b>]} />
      </Container>
    );
    let results: any[] = [];
    await act(async () => {
      results = await ref.current!.validate();
    });
    expect(results.map((r) => [r.Name, r.Title, r.Type, r.Message])).toEqual([
      ["email", "E-mail", 1, "Already registered"],
      ["email", "E-mail", 1, "Server says no"],
    ]);
    expect(container.querySelectorAll(".error-validation-message").length).toBe(2);
  });

  it("can be turned off with behavior.validation.includeExternalErrors", async () => {
    const ref = React.createRef<EditorRef>();
    render(
      <SmartRProvider config={{ behavior: { validation: { includeExternalErrors: false } } }}>
        <Editor ref={ref} id="x" errors="nope" />
      </SmartRProvider>
    );
    let results: any[] = [];
    await act(async () => {
      results = await ref.current!.validate();
    });
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 13. File text box ARIA
// ---------------------------------------------------------------------------
describe("File text box", () => {
  it("is described by the note / messages in ARIA mode", () => {
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <Editor id="f" type={Input.File} note="PDF only" errors="Too big" />
      </SmartRProvider>
    );
    const box = container.querySelector('input[type="text"]')!;
    expect(box.getAttribute("aria-describedby")).toBe("f-note f-error");
    expect(box.getAttribute("aria-invalid")).toBe("true");
  });

  it("bootstrap is unchanged", () => {
    const { container } = render(<Editor id="f" type={Input.File} note="PDF only" />);
    expect(container.querySelector('input[type="text"]')!.hasAttribute("aria-describedby")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ARIA: the Editor's own aria-describedby is kept (ARIA mode)
// ---------------------------------------------------------------------------
describe("aria-describedby passthrough", () => {
  it("merges the instance ids first (ARIA mode)", () => {
    const { container } = render(
      <SmartRProvider config={shadcnPreset}>
        <FormMessage id="form-error">Form error</FormMessage>
        <Editor id="n" note="Note" aria-describedby="form-error" />
      </SmartRProvider>
    );
    expect(container.querySelector("input#n")!.getAttribute("aria-describedby")).toBe("form-error n-note");
  });
});

// ---------------------------------------------------------------------------
// 11 + release. Tooling and package metadata
// ---------------------------------------------------------------------------
describe("tooling and release metadata", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

  it("lint is ESLint flat config with typescript-eslint and react-hooks", () => {
    expect(pkg.scripts.lint).toBe("eslint src");
    for (const dep of ["eslint", "@typescript-eslint/parser", "@typescript-eslint/eslint-plugin", "eslint-plugin-react-hooks"]) {
      expect(pkg.devDependencies[dep]).toBeDefined();
    }
    const config = fs.readFileSync(path.join(root, "eslint.config.mjs"), "utf8");
    expect(config).toContain("react-hooks");
  });

  it("1.2.0 metadata: no prepare/prepublish build on install, ESM rollup config", () => {
    expect(pkg.version).toBe("1.2.0");
    expect(pkg.scripts.prepare).toBeUndefined();
    expect(pkg.scripts.prepublish).toBeUndefined();
    expect(pkg.scripts.prepublishOnly).toBe("npm run build");
    expect(pkg.scripts.build).toBe("rollup -c rollup.config.mjs");
    expect(fs.existsSync(path.join(root, "rollup.config.mjs"))).toBe(true);
    expect(fs.existsSync(path.join(root, "rollup.config.js"))).toBe(false);
    expect(pkg.files).toEqual(["dist", "core", "config", "presets", "README.md", "CHANGELOG.md", "LICENSE"]);
  });
});
