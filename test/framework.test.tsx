/**
 * Tests for the 1.2.0 framework-agnostic features.
 */
import React from "react";
import { render, fireEvent, act, screen } from "@testing-library/react";
import {
  Alert,
  AlertType,
  Column,
  ColumnSize,
  Editor,
  Input,
  Loading,
  Row,
  ScreenSize,
  SelectionType,
  Table,
  TableViewMode,
  Container,
  SmartRProvider,
  bootstrapPreset,
  configManager,
  createConfig,
  defaultConfig,
  tailwindPreset,
  tailwindColumnClass,
  tailwindSafelist,
  unstyledPreset,
  useSmartConfig,
  SmartRControlProps,
} from "../src";
import * as tailwindEntry from "../src/presets/tailwind";

const OPTIONS = [
  { id: "1", description: "Alpha", group: "G1" },
  { id: "2", description: "Beta", group: "G2" },
];
const COLUMNS = [
  { header: "Name", accessor: "name", enableSort: true },
  { header: "Dept", accessor: "dept" },
];
const DATA = [
  { id: "a", name: "Ann", dept: "Sales" },
  { id: "b", name: "Bob", dept: "IT" },
];

function Sample() {
  return (
    <Row>
      <Editor id="name" title="Name" required md={ColumnSize.Col6} />
      <Editor id="email" title="Email" type={Input.Email} invalid invalidMessage="bad" />
      <Editor id="pwd" title="Password" type={Input.Password} enabled={false} />
      <Editor id="sel" title="Select" type={Input.Select} options={OPTIONS} />
      <Editor id="fil" title="Filter" type={Input.Select} options={OPTIONS} optionsFilter />
      <Editor id="chk" type={Input.CheckBox} checkBoxText="Check" tooltip="tip" />
      <Editor id="rad" title="Radio" type={Input.Radio} options={OPTIONS} inline />
      <Editor id="fl" title="File" type={Input.File} fileUrlDownload="http://x/a.pdf" />
      <Editor id="nt" title="Note" note="a note" horizontal labelSize={ColumnSize.Col4} size={ColumnSize.Col8} />
      <Column size={ColumnSize.Col6} md={ColumnSize.Col4} xxl={ColumnSize.Col3}>
        <Alert type={AlertType.Success}>ok</Alert>
        <Loading size="sm" />
      </Column>
      <Table
        columns={COLUMNS}
        data={DATA}
        selection={SelectionType.CHECKBOX}
        enableSelectAll
        grouping={GROUPING}
        pagination={{ showPagination: true, totalRecords: 40 }}
      />
      <Table columns={COLUMNS} data={DATA} viewMode={TableViewMode.CARD} grouping={GROUPING} />
      <Table columns={COLUMNS} data={EMPTY} />
    </Row>
  );
}
const GROUPING = { enableGrouping: true, groupBy: "dept", expandAllGroups: true };
const EMPTY: any[] = [];

/** Bootstrap-only tokens that must never leak into the Tailwind/unstyled output. */
const BOOTSTRAP_TOKENS = [
  "row",
  "form-group",
  "form-control",
  "form-label",
  "form-check",
  "form-check-input",
  "form-text",
  "input-group",
  "input-group-text",
  "is-invalid",
  "alert",
  "alert-info",
  "alert-success",
  "table",
  "table-bordered",
  "table-hover",
  "table-light",
  "table-responsive",
  "d-flex",
  "align-items-center",
  "text-start",
  "text-end",
  "me-2",
  "card",
  "page-item",
  "page-link",
  "pagination",
  "badge",
  "smart-loading",
  "smart-tooltip",
  "select-filter",
  "col-form-label",
];

function classTokens(container: HTMLElement): Set<string> {
  const tokens = new Set<string>();
  container.querySelectorAll("[class]").forEach((el) => {
    String(el.getAttribute("class"))
      .split(/\s+/)
      .filter(Boolean)
      .forEach((t) => tokens.add(t));
  });
  return tokens;
}

describe("presets", () => {
  it("bootstrapPreset is the default configuration", () => {
    expect(bootstrapPreset).toBe(defaultConfig);
    expect(bootstrapPreset.behavior.emitDataAttributes).toBe(false);
    expect(bootstrapPreset.grid.row).toBe("row");
  });

  it("tailwind preset keeps behavior/texts and replaces every class", () => {
    expect(tailwindPreset.behavior.select).toEqual(defaultConfig.behavior.select);
    expect(tailwindPreset.resources.validationMessages).toEqual(
      defaultConfig.resources.validationMessages
    );
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Sample />
      </SmartRProvider>
    );
    const tokens = classTokens(container);
    const leaked = BOOTSTRAP_TOKENS.filter((t) => tokens.has(t));
    expect(leaked).toEqual([]);
    expect(tokens.has("grid")).toBe(true);
    expect(tokens.has("grid-cols-12")).toBe(true);
    expect(container.querySelector('[data-invalid="true"]')).not.toBeNull();
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("unstyled preset renders no classes and exposes data-attributes", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Sample />
      </SmartRProvider>
    );
    const tokens = classTokens(container);
    expect([...tokens]).toEqual([]);
    expect(container.querySelectorAll("i").length).toBe(0); // no icons
    expect(container.querySelector('[data-required="true"]')).not.toBeNull();
    expect(container.querySelector('[data-invalid="true"]')).not.toBeNull();
    expect(container.querySelector('[data-disabled="true"]')).not.toBeNull();
    expect(container.querySelector('[data-size="sm"]')).not.toBeNull();
    expect(container.querySelector('[data-state="success"]')).not.toBeNull();
    expect(container.querySelector('[data-state="closed"]')).not.toBeNull();
  });

  it("unstyled select exposes data-state open/closed", () => {
    const { container } = render(
      <SmartRProvider config={unstyledPreset}>
        <Editor id="s" title="S" type={Input.Select} options={OPTIONS} optionsFilter />
      </SmartRProvider>
    );
    const box = container.querySelector('[data-state="closed"]') as HTMLElement;
    fireEvent.click(box);
    expect(box.getAttribute("data-state")).toBe("open");
  });

  it("bootstrap preset never emits the new data-attributes", () => {
    const { container } = render(<Sample />);
    expect(container.innerHTML).not.toMatch(/data-(invalid|disabled|required|size|state)=/);
  });

  it("createConfig does not mutate the preset", () => {
    const before = JSON.stringify(tailwindPreset);
    const cfg = createConfig(tailwindPreset, {
      components: { editor: { classes: { input: "x" } } },
    });
    expect(cfg.components.editor.classes.input).toBe("x");
    expect(cfg.components.editor.classes.label).toBe(
      tailwindPreset.components.editor.classes.label
    );
    expect(JSON.stringify(tailwindPreset)).toBe(before);
  });

  it("configManager.setPreset applies a preset globally", () => {
    configManager.setPreset(tailwindPreset);
    const { container } = render(<Row />);
    expect(container.innerHTML).toBe('<div class="grid grid-cols-12 gap-x-4 gap-y-3"></div>');
  });

  it("tailwind preset is also available from the separate entry", () => {
    expect(tailwindEntry.tailwindPreset).toBe(tailwindPreset);
    expect(tailwindEntry.tailwindSafelist).toBe(tailwindSafelist);
  });
});

describe("grid mapping", () => {
  it("tailwindColumnClass maps every size and screen", () => {
    const screens: (ScreenSize | undefined)[] = [
      undefined,
      ScreenSize.XS,
      ScreenSize.SM,
      ScreenSize.MD,
      ScreenSize.LG,
      ScreenSize.XL,
      ScreenSize.XXL,
    ];
    const prefixes = ["", "", "sm:", "md:", "lg:", "xl:", "2xl:"];
    screens.forEach((screen, i) => {
      for (let n = 1; n <= 12; n++) {
        expect(tailwindColumnClass(n, screen)).toBe(`${prefixes[i]}col-span-${n}`);
      }
      expect(tailwindColumnClass(-1, screen)).toBe(`${prefixes[i]}col-auto`);
      expect(tailwindColumnClass(0, screen)).toBeNull();
    });
    expect(tailwindSafelist).toHaveLength(7 * 0 + 6 * 13);
    expect(tailwindSafelist).toContain("2xl:col-span-12");
  });

  it("Column uses the configured grid (tailwind)", () => {
    const { container } = render(
      <SmartRProvider config={tailwindPreset}>
        <Column md={ColumnSize.Col6} xl={ColumnSize.Col3} />
        <Column size={ColumnSize.Col4} lg={ColumnSize.Col2} />
      </SmartRProvider>
    );
    const cols = container.querySelectorAll("div");
    expect(cols[0].className).toBe("col-span-12 md:col-span-6 xl:col-span-3");
    expect(cols[1].className).toBe("col-span-4 lg:col-span-2");
  });

  it("custom grid via configManager.setConfig", () => {
    configManager.setConfig({
      grid: { row: "my-row", column: (size, screen) => `c-${screen ?? "all"}-${size}` },
    });
    const { container } = render(
      <Row>
        <Column size={ColumnSize.Col12} md={ColumnSize.Col6} />
      </Row>
    );
    expect(container.innerHTML).toBe(
      '<div class="my-row"><div class="c-all-12 c-md-6"></div></div>'
    );
  });
});

describe("class merging", () => {
  // Minimal "last conflicting utility wins" merger, standing in for tailwind-merge
  const fakeTwMerge = (...classes: string[]) => {
    const out = new Map<string, string>();
    classes
      .join(" ")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => out.set(c.replace(/-[^-]+$/, ""), c));
    return [...out.values()].join(" ");
  };

  it("mergeClasses is used for config + per-instance classes", () => {
    const merge = vi.fn(fakeTwMerge);
    const { container } = render(
      <SmartRProvider config={{ mergeClasses: merge, components: { editor: { classes: { input: "px-3 py-2" } } } }}>
        <Editor id="a" title="A" classNames={{ input: "px-8" }} />
      </SmartRProvider>
    );
    expect(merge).toHaveBeenCalled();
    expect(container.querySelector("input")!.className).toBe("px-8 py-2");
  });

  it("default merge keeps plain concatenation", () => {
    const { container } = render(<Editor id="a" title="A" classNames={{ input: "extra" }} />);
    expect(container.querySelector("input")!.className).toBe("form-control extra");
  });
});

describe("per-instance classNames", () => {
  it("Editor slots are applied after the config classes", () => {
    const { container } = render(
      <Editor
        id="e"
        title="E"
        type={Input.Email}
        note="n"
        invalid
        invalidMessage="bad"
        tooltip="t"
        classNames={{
          column: "s-col",
          group: "s-group",
          label: "s-label",
          input: "s-input",
          inputGroup: "s-ig",
          icon: "s-icon",
          note: "s-note",
          error: "s-error",
        }}
      />
    );
    const q = (s: string) => container.querySelector(s) as HTMLElement;
    expect(q(".s-col")).not.toBeNull();
    expect(q(".form-group").className).toBe("form-group is-invalid s-group");
    expect(q("label[for=e]").className).toBe("form-label float-label s-label");
    expect(q("input").className).toBe("form-control is-invalid s-input");
    expect(q(".input-group").className).toBe("input-group s-ig");
    expect(q(".input-group-text").className).toBe("input-group-text inside-input s-icon");
    expect(q(".note").className).toBe("form-text text-muted note s-note");
    expect(q(".error-validation-message").className).toBe("error-validation-message s-error");
  });

  it("classNames prop does not leak to the DOM", () => {
    const { container } = render(<Editor id="e" title="E" classNames={{ input: "x" }} />);
    expect(container.innerHTML).not.toMatch(/classnames|\[object Object\]/i);
  });

  it("checkbox/radio slots", () => {
    const { container } = render(
      <>
        <Editor id="c" type={Input.CheckBox} checkBoxText="C" classNames={{ check: "s-check", checkLabel: "s-cl" }} />
        <Editor id="r" type={Input.Radio} options={OPTIONS} classNames={{ check: "s-rcheck" }} />
      </>
    );
    expect(container.querySelector(".s-check")!.className).toBe("form-check s-check");
    expect(container.querySelector("label[for=c]")!.className).toBe("form-check-label s-cl");
    expect(container.querySelectorAll(".s-rcheck").length).toBe(3);
  });

  it("Table and Loading slots", () => {
    const { container } = render(
      <>
        <Table
          columns={COLUMNS}
          data={DATA}
          classNames={{ container: "s-c", wrapper: "s-w", table: "s-t", thead: "s-h" }}
        />
        <Table columns={COLUMNS} data={EMPTY} classNames={{ empty: "s-e" }} />
        <Loading classNames={{ container: "s-lc", spinner: "s-ls", text: "s-lt" }} />
      </>
    );
    expect(container.querySelector(".s-c")!.className).toBe("smart-table-container s-c");
    expect(container.querySelector(".s-w")!.className).toBe("table-responsive react-table s-w");
    expect(container.querySelector("table")!.className).toBe("table table-bordered table-hover s-t");
    expect(container.querySelector("thead")!.className).toBe("table-light table-nowrap s-h");
    expect(container.querySelector(".s-e")!.className).toBe("alert alert-info text-center s-e");
    expect(container.querySelector(".s-lc")!.className).toBe("smart-loading smart-loading-md s-lc");
    expect(container.querySelector(".s-ls")!.className).toBe("smart-loading-spinner s-ls");
  });
});

describe("icons as React", () => {
  const MailIcon = (props: any) => <svg data-testid="mail" {...props} />;
  const LockIcon = React.forwardRef<SVGSVGElement, any>((props, ref) => (
    <svg data-testid="lock" ref={ref} {...props} />
  ));

  it("string icons keep rendering <i className>", () => {
    const { container } = render(<Editor id="a" title="A" type={Input.Email} />);
    expect(container.querySelector("i.fas.fa-envelope")).not.toBeNull();
  });

  it("component, forwardRef and element icons from config", () => {
    const { container } = render(
      <SmartRProvider
        config={{
          resources: {
            icons: { email: MailIcon, password: LockIcon, showPassword: <b data-testid="eye" /> },
          },
        }}
      >
        <Editor id="a" title="A" type={Input.Email} />
        <Editor id="p" title="P" type={Input.Password} />
      </SmartRProvider>
    );
    expect(screen.getByTestId("mail").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByTestId("lock")).not.toBeNull();
    expect(screen.getByTestId("eye")).not.toBeNull();
    expect(container.querySelector("i.fa-envelope")).toBeNull();
  });

  it("icon props accept React values; Table sort icons too", () => {
    render(
      <>
        <Editor id="a" title="A" hasIcon prependIcon={<span data-testid="pi" />} />
        <Editor id="b" title="B" prependButtons={[{ icon: MailIcon, text: "go" }]} />
        <Table
          columns={COLUMNS}
          data={DATA}
          sortDefaultIcon={<span data-testid="sort" />}
          sortAscendingIcon={<span data-testid="asc" />}
        />
      </>
    );
    expect(screen.getByTestId("pi")).not.toBeNull();
    expect(screen.getByTestId("mail")).not.toBeNull();
    expect(screen.getAllByTestId("sort").length).toBe(2);
    fireEvent.click(screen.getByText("Name"));
    expect(screen.getByTestId("asc").parentElement!.getAttribute("style")).toContain("margin-left");
  });

  it("tooltip icon as component still opens the tooltip", () => {
    const { container } = render(
      <SmartRProvider config={{ resources: { icons: { tooltip: MailIcon } } }}>
        <Editor id="a" title="A" tooltip="Hello" />
      </SmartRProvider>
    );
    fireEvent.mouseEnter(screen.getByTestId("mail").parentElement as HTMLElement);
    expect(container.innerHTML).toContain("Hello");
  });
});

describe("SmartRProvider precedence", () => {
  function Probe({ id }: { id: string }) {
    const config = useSmartConfig();
    return <span data-testid={id}>{config.components.editor.classes.input}</span>;
  }

  it("falls back to configManager (and window.SmartRConfig) without a provider", () => {
    (window as any).SmartRConfig = { components: { editor: { classes: { input: "win" } } } };
    render(<Probe id="p" />);
    expect(screen.getByTestId("p").textContent).toBe("win");
  });

  it("global < outer provider < inner provider, siblings unaffected", () => {
    configManager.setConfig({
      components: { editor: { classes: { input: "global", label: "global-label" } } },
    });
    render(
      <>
        <Probe id="none" />
        <SmartRProvider config={{ components: { editor: { classes: { input: "outer" } } } }}>
          <Probe id="outer" />
          <SmartRProvider config={{ components: { editor: { classes: { input: "inner" } } } }}>
            <Probe id="inner" />
            <Editor id="x" title="X" />
          </SmartRProvider>
        </SmartRProvider>
      </>
    );
    expect(screen.getByTestId("none").textContent).toBe("global");
    expect(screen.getByTestId("outer").textContent).toBe("outer");
    expect(screen.getByTestId("inner").textContent).toBe("inner");
    // inner provider still inherits the global label class
    expect(document.querySelector("label[for=x]")!.className).toBe("global-label");
    expect(document.querySelector("input#x")!.className).toBe("inner");
  });

  it("provider config is used by validation and default icons", async () => {
    const { container } = render(
      <SmartRProvider
        config={{
          resources: {
            validationMessages: { required: "Obrigatório" },
            icons: { email: "my-mail" },
          },
        }}
      >
        <Editor id="v" title="V" type={Input.Email} required />
      </SmartRProvider>
    );
    expect(container.querySelector("i.my-mail")).not.toBeNull();
    await act(async () => {
      fireEvent.blur(container.querySelector("input") as HTMLInputElement);
    });
    expect(container.innerHTML).toContain("Obrigatório");
  });
});

describe("render slots", () => {
  const received: SmartRControlProps[] = [];
  const MyInput = React.forwardRef<HTMLInputElement, SmartRControlProps>((props, ref) => {
    received.push(props);
    const { invalid, ...rest } = props;
    return <input data-custom="1" data-is-invalid={String(invalid)} ref={ref} {...rest} />;
  });
  const MySelect = React.forwardRef<HTMLSelectElement, SmartRControlProps>((props, ref) => {
    const { invalid, required, ...rest } = props;
    return <select data-custom-select="1" ref={ref} {...rest} />;
  });
  const MyCheckbox = React.forwardRef<HTMLInputElement, SmartRControlProps>((props, ref) => {
    const { invalid, required, ...rest } = props;
    return <input data-custom-check="1" ref={ref} {...rest} />;
  });
  const MyTextarea = React.forwardRef<HTMLTextAreaElement, SmartRControlProps>((props, ref) => {
    const { invalid, required, ...rest } = props;
    return <textarea data-custom-area="1" ref={ref} {...rest} />;
  });

  beforeEach(() => {
    received.length = 0;
  });

  it("custom input receives the documented props and keeps state/validation working", async () => {
    const ref = React.createRef<any>();
    let state: any = {};
    function Form() {
      const [form, setForm] = React.useState<any>({ phone: "" });
      state = form;
      return (
        <Container ref={ref}>
          <Editor
            id="phone"
            title="Phone"
            type={Input.Phone}
            required
            formState={form}
            dispatchFormState={setForm}
            render={{ input: MyInput }}
          />
        </Container>
      );
    }
    const { container } = render(<Form />);
    const input = container.querySelector("[data-custom]") as HTMLInputElement;
    expect(input).not.toBeNull();
    const props = received[received.length - 1];
    expect(props.id).toBe("phone");
    expect(props.name).toBe("phone");
    expect(props.type).toBe("tel");
    expect(props.required).toBe(true);
    expect(props.className).toBe("form-control");
    expect(typeof props.onChange).toBe("function");
    expect(typeof props.onBlur).toBe("function");
    expect(props["data-mask"]).toBe("(000) 000-0000");

    // label, icon and grid are still rendered by the Editor
    expect(container.querySelector("label[for=phone]")).not.toBeNull();
    expect(container.querySelector(".input-group i.fa-phone")).not.toBeNull();

    // validation through the container reads the value via the forwarded ref
    let results: any[] = [];
    await act(async () => {
      results = await ref.current.validate();
    });
    expect(results).toHaveLength(1);
    const last = received[received.length - 1];
    expect(last.invalid).toBe(true);
    expect(last["aria-invalid"]).toBe(true);

    // typing applies the mask and updates formState
    await act(async () => {
      fireEvent.change(input, { target: { value: "1234567890", name: "phone" } });
    });
    expect(input.value).toBe("(123) 456-7890");
    expect(state.phone).toBe("1234567890");
  });

  it("global config.render applies to select / checkbox / textarea; prop wins", () => {
    const { container } = render(
      <SmartRProvider config={{ render: { select: MySelect, checkbox: MyCheckbox, textarea: MyTextarea, input: MyInput } }}>
        <Editor id="s" title="S" type={Input.Select} options={OPTIONS} value="2" />
        <Editor id="c" type={Input.CheckBox} checkBoxText="C" value={true} />
        <Editor id="t" title="T" type={Input.LongText} rows={3} />
        <Editor id="n" title="N" render={{ input: undefined as any }} />
        <Editor id="h" type={Input.Hidden} />
      </SmartRProvider>
    );
    const select = container.querySelector("[data-custom-select]") as HTMLSelectElement;
    expect(select.querySelectorAll("option").length).toBe(3);
    expect(select.value).toBe("2");
    const check = container.querySelector("[data-custom-check]") as HTMLInputElement;
    expect(check.checked).toBe(true);
    expect(container.querySelector("[data-custom-area]")!.getAttribute("rows")).toBe("3");
    // explicit `undefined` in the prop does not disable the global slot
    expect(container.querySelector("input#n[data-custom]")).not.toBeNull();
    // hidden inputs are never replaced
    expect(container.querySelector("input#h")!.getAttribute("type")).toBe("hidden");
  });
});

describe("translate", () => {
  it("translates validation messages with params", async () => {
    const translate = vi.fn((key: string, fallback: string) =>
      key === "validation.minCharacters" ? "Mínimo %s1 caracteres" : fallback
    );
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Editor id="a" title="A" min={5} value="ab" />
      </SmartRProvider>
    );
    await act(async () => {
      fireEvent.blur(container.querySelector("input") as HTMLInputElement);
    });
    expect(container.innerHTML).toContain("Mínimo 5 caracteres");
    expect(translate).toHaveBeenCalledWith(
      "validation.minCharacters",
      "Please enter at least %s1 characters",
      [5]
    );
  });

  it("translates table, select, file and loading texts", () => {
    const translate = (key: string, fallback: string) => `[${key}]`;
    const { container } = render(
      <SmartRProvider config={{ translate }}>
        <Table columns={COLUMNS} data={EMPTY} />
        <Table columns={COLUMNS} data={DATA} pagination={{ showPagination: true, totalRecords: 30 }} />
        <Editor id="s" title="S" type={Input.Select} options={OPTIONS} />
        <Editor id="f" title="F" type={Input.File} />
        <Loading />
      </SmartRProvider>
    );
    const html = container.innerHTML;
    // keys are configuration paths (the short keys remain as aliases)
    expect(html).toContain("[components.table.texts.noRecordMessage]");
    expect(html).toContain("[components.table.texts.showing]");
    expect(html).toContain("[components.select.texts.optionsNoneSelectedText]");
    expect(html).toContain('placeholder="[behavior.file.filePlaceholderText]"');
    expect(html).toContain("[components.table.texts.loadingText]");
  });

  it("without translate the configured texts are used verbatim", () => {
    const { container } = render(<Table columns={COLUMNS} data={EMPTY} />);
    expect(container.innerHTML).toContain("No records to display.");
  });
});
