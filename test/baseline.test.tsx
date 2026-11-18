/**
 * BASELINE COMPATIBILITY SNAPSHOTS
 *
 * These snapshots were generated against the unchanged 1.1.0 source code.
 * They describe the exact HTML/classes rendered with NO configuration (the
 * Bootstrap defaults) and through the legacy `configManager.setConfig(...)` /
 * `window.SmartRConfig` paths.
 *
 * DO NOT re-record them. Any diff here is a backwards-compatibility break
 * that must be fixed in the source code.
 */
import React from "react";
import {
  render,
  fireEvent,
  act,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  Alert,
  AlertType,
  AlignType,
  CharacterCasing,
  Column,
  ColumnSize,
  ColumnType,
  Container,
  Editor,
  IconPosition,
  Input,
  Loading,
  Row,
  ScreenSize,
  SelectionType,
  Table,
  TableViewMode,
  TextInput,
  Tooltip,
  TooltipPosition,
  configManager,
  getColumnSize,
  classNames,
  mapToCssModules,
} from "../src";

const html = (ui: React.ReactElement) => render(ui).container.innerHTML;

const OPTIONS = [
  { id: "1", description: "Alpha", group: "G1", tooltip: "tip a" },
  { id: "2", description: "Beta", group: "G1" },
  { id: "3", description: "Gamma", group: "G2" },
];

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------
describe("baseline: grid", () => {
  const sizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ColumnSize[];
  const screens: (keyof typeof ScreenSize)[] = [
    "XS",
    "SM",
    "MD",
    "LG",
    "XL",
    "XXL",
  ];

  it("Row default / className / tag / style", () => {
    expect(html(<Row />)).toMatchSnapshot();
    expect(html(<Row className="g-3 custom" />)).toMatchSnapshot();
    expect(
      html(
        <Row tag="section" style={{ color: "red" }}>
          child
        </Row>
      )
    ).toMatchSnapshot();
  });

  it("Column with every size for every screen", () => {
    const out: string[] = [];
    for (const s of sizes) {
      out.push(html(<Column size={s} />));
      for (const scr of screens) {
        const prop = ScreenSize[scr];
        out.push(html(<Column {...{ [prop]: s }} />));
      }
    }
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("Column combined, auto, className, tag", () => {
    expect(
      html(
        <Column
          size={ColumnSize.Col12}
          xs={ColumnSize.Col12}
          sm={ColumnSize.Col6}
          md={ColumnSize.Col4}
          lg={ColumnSize.Col3}
          xl={ColumnSize.Col2}
          xxl={ColumnSize.Col1}
          className="extra"
        />
      )
    ).toMatchSnapshot();
    expect(html(<Column size={-1 as ColumnSize} md={-1 as ColumnSize} />)).toMatchSnapshot();
    expect(html(<Column />)).toMatchSnapshot();
    expect(html(<Column tag="span" md={ColumnSize.Col6} />)).toMatchSnapshot();
  });

  it("getColumnSize / classNames / mapToCssModules helpers", () => {
    expect([
      getColumnSize(6),
      getColumnSize(6, ScreenSize.MD),
      getColumnSize(-1),
      getColumnSize(-1, ScreenSize.LG),
      getColumnSize(0),
      getColumnSize(undefined as any),
    ]).toMatchSnapshot();
    expect(
      classNames("a", null, undefined, false, 0, "b", ["c", ["d"]], {
        e: true,
        f: false,
      })
    ).toMatchSnapshot();
    expect(mapToCssModules("a  b c")).toMatchSnapshot();
  });

  it("Container renders children only", () => {
    expect(
      html(
        <Container>
          <Row>
            <Column md={ColumnSize.Col6}>x</Column>
          </Row>
        </Container>
      )
    ).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// Editor – every Input type
// ---------------------------------------------------------------------------
describe("baseline: Editor types", () => {
  // The Input types of 1.1.0 (types added later — e.g. Input.Chips — have
  // their own tests; the baseline snapshot file must stay byte-identical).
  const typesAddedAfter110 = ["Chips"];
  const allTypes = Object.keys(Input).filter(
    (k) => isNaN(Number(k)) && !typesAddedAfter110.includes(k)
  );

  it.each(allTypes)("Input.%s (plain)", (key) => {
    const type = (Input as any)[key] as Input;
    expect(
      html(
        <Editor
          id={`f${key}`}
          title={`Title ${key}`}
          type={type}
          options={OPTIONS}
          md={ColumnSize.Col6}
        />
      )
    ).toMatchSnapshot();
  });

  it.each(allTypes)("Input.%s (required + disabled + value)", (key) => {
    const type = (Input as any)[key] as Input;
    const value =
      type === Input.CheckBox
        ? true
        : type === Input.Money || type === Input.Percent || type === Input.Decimal
        ? 1234.5
        : type === Input.Select || type === Input.Radio
        ? "2"
        : type === Input.Integer || type === Input.Range
        ? 7
        : type === Input.Date
        ? "2024-01-15"
        : "abc";
    expect(
      html(
        <Editor
          id={`g${key}`}
          title={`Title ${key}`}
          type={type}
          options={OPTIONS}
          required
          enabled={false}
          value={value}
          size={ColumnSize.Col12}
          sm={ColumnSize.Col6}
        />
      )
    ).toMatchSnapshot();
  });

  it.each(allTypes)("Input.%s (invalid + note + tooltip + readOnly)", (key) => {
    const type = (Input as any)[key] as Input;
    expect(
      html(
        <Editor
          id={`h${key}`}
          title={`Title ${key}`}
          type={type}
          options={OPTIONS}
          invalid
          invalidMessage="Bad value"
          note="A helpful note"
          noteClassName="my-note"
          tooltip="Tooltip text"
          toolTipPosition={TooltipPosition.Right}
          readOnly
          titleBold
          className="extra-input"
        />
      )
    ).toMatchSnapshot();
  });

  it.each(allTypes)("Input.%s (horizontal)", (key) => {
    const type = (Input as any)[key] as Input;
    expect(
      html(
        <Editor
          id={`k${key}`}
          title={`Title ${key}`}
          type={type}
          options={OPTIONS}
          horizontal
          labelSize={ColumnSize.Col4}
          labelMd={ColumnSize.Col3}
          size={ColumnSize.Col8}
          md={ColumnSize.Col9}
          required
        />
      )
    ).toMatchSnapshot();
  });
});

describe("baseline: Editor variants", () => {
  it("text variants", () => {
    const out = [
      html(<Editor id="a" title="A" />),
      html(<Editor id="a" title="A" createRow />),
      html(<Editor id="a" title="A" createColumn={false} />),
      html(<Editor id="a" title="A" hasTitle={false} />),
      html(<Editor id="a" />),
      html(<Editor id="a" title="A" characterCasing={CharacterCasing.Lower} />),
      html(<Editor id="a" title="A" characterCasing={CharacterCasing.Normal} />),
      html(<Editor id="a" title="A" input={TextInput.Integer} />),
      html(<Editor id="a" title="A" input={TextInput.Decimal} />),
      html(<Editor id="a" title="A" input={TextInput.Letter} />),
      html(<Editor id="a" title="A" min={3} max={10} placeholder="ph" />),
      html(<Editor id="a" title="A" mask="000.000" value="123456" />),
      html(<Editor id="a" title="A" skipSubmit name="nm" />),
      html(<Editor id="a" title="A" data-x="1" aria-label="lbl" />),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("icon variants", () => {
    const out = [
      html(<Editor id="a" title="A" hasIcon prependIcon="fas fa-user" />),
      html(
        <Editor
          id="a"
          title="A"
          hasIcon
          iconPosition={IconPosition.End}
          appendIcon="fas fa-check"
        />
      ),
      html(
        <Editor
          id="a"
          title="A"
          hasIcon
          iconPosition={IconPosition.Both}
          prependIcon="fas fa-a"
          appendIcon="fas fa-b"
        />
      ),
      html(<Editor id="a" title="A" type={Input.Money} hasIcon={false} />),
      html(
        <Editor
          id="a"
          title="A"
          type={Input.Password}
          showPasswordIconPosition={IconPosition.Start}
        />
      ),
      html(
        <Editor id="a" title="A" type={Input.Password} enableShowPassword={false} />
      ),
      html(
        <Editor
          id="a"
          title="A"
          prependButtons={[{ text: "Go", icon: "fas fa-go", tooltip: "tt" }]}
          appendButtons={[{ text: "X", className: "btn-x" }]}
        />
      ),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("password show toggle", () => {
    const { container } = render(<Editor id="p" title="P" type={Input.Password} />);
    const toggle = container.querySelector(".show-password") as HTMLElement;
    fireEvent.click(toggle);
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("checkbox / radio variants", () => {
    const out = [
      html(<Editor id="c" type={Input.CheckBox} checkBoxText="Accept" />),
      html(
        <Editor
          id="c"
          type={Input.CheckBox}
          checkBoxText="Accept"
          tooltip="tip"
          required
          titleBold
          value={true}
        />
      ),
      html(<Editor id="r" title="R" type={Input.Radio} options={OPTIONS} inline />),
      html(
        <Editor
          id="r"
          title="R"
          type={Input.Radio}
          options={OPTIONS}
          optionsFirstSelected
          optionsToolTip="tooltip"
        />
      ),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("select variants (closed)", () => {
    const out = [
      html(<Editor id="s" title="S" type={Input.Select} options={OPTIONS} optionsFirstSelected />),
      html(<Editor id="s" title="S" type={Input.Select} options={["x", "y"]} />),
      html(
        <Editor id="s" title="S" type={Input.Select} options={OPTIONS} optionsFilter />
      ),
      html(
        <Editor
          id="s"
          title="S"
          type={Input.Select}
          options={OPTIONS}
          optionsMultiple
          value="1,3"
        />
      ),
      html(
        <Editor
          id="s"
          title="S"
          type={Input.Select}
          options={OPTIONS}
          optionsGrouped
          value="3"
        />
      ),
      html(
        <Editor
          id="s"
          title="S"
          type={Input.Select}
          options={OPTIONS}
          optionRenderer={(o) => <b>{o.description}</b>}
        />
      ),
      html(
        <Editor
          id="s"
          title="S"
          type={Input.Select}
          options={OPTIONS}
          optionsFilter
          enabled={false}
        />
      ),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("select filter open + search", () => {
    const { container } = render(
      <Editor id="s" title="S" type={Input.Select} options={OPTIONS} optionsFilter />
    );
    fireEvent.click(container.querySelector(".select-filter") as HTMLElement);
    expect(container.innerHTML).toMatchSnapshot();
    fireEvent.change(container.querySelector(".search-input") as HTMLElement, {
      target: { value: "al" },
    });
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("select multiple open", () => {
    const { container } = render(
      <Editor
        id="s"
        title="S"
        type={Input.Select}
        options={OPTIONS}
        optionsMultiple
        optionsGrouped
        value="1"
      />
    );
    fireEvent.click(container.querySelector(".select-filter") as HTMLElement);
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("async select closed + open + loaded", async () => {
    const loadOptions = vi.fn(async () => ({
      options: [
        { id: 10, description: "Ten" },
        { id: 20, description: "Twenty" },
      ],
      hasMore: false,
    }));
    const { container } = render(
      <Editor
        id="as"
        title="Async"
        type={Input.Select}
        loadOptions={loadOptions}
        selectedOption={{ id: 20, description: "Twenty" }}
        value={20}
      />
    );
    expect(container.innerHTML).toMatchSnapshot();
    fireEvent.click(screen.getByRole("combobox"));
    await screen.findByText("Ten");
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("async select error state + fast search", async () => {
    const { container } = render(
      <Editor
        id="as"
        title="Async"
        type={Input.Select}
        loadOptions={() => Promise.reject(new Error("x"))}
      />
    );
    fireEvent.click(screen.getByRole("combobox"));
    await screen.findByText("Retry");
    expect(container.innerHTML).toMatchSnapshot();

    const r2 = render(
      <Editor
        id="fs"
        title="Fast"
        type={Input.FastSearch}
        loadOptions={async () => ({ options: [] })}
      />
    );
    fireEvent.click(r2.container.querySelector("[role=combobox]") as HTMLElement);
    expect(r2.container.innerHTML).toMatchSnapshot();
  });

  it("file variants", () => {
    const out = [
      html(<Editor id="f" title="F" type={Input.File} />),
      html(
        <Editor
          id="f"
          title="F"
          type={Input.File}
          fileUrlDownload="http://x/y/file.pdf"
          onDeleteFileClick={() => {}}
          accept=".pdf"
          multiple
          placeholder="Choose"
        />
      ),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("validation messages on blur (required)", async () => {
    const { container } = render(<Editor id="v" title="V" required />);
    const input = container.querySelector("input") as HTMLInputElement;
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("validation messages on blur (min chars / email)", async () => {
    const r1 = render(<Editor id="v1" title="V" min={5} value="ab" />);
    await act(async () => {
      fireEvent.blur(r1.container.querySelector("input") as HTMLInputElement);
    });
    const r2 = render(<Editor id="v2" title="V" type={Input.Email} value="x@" />);
    await act(async () => {
      fireEvent.blur(r2.container.querySelector("input") as HTMLInputElement);
    });
    expect(r1.container.innerHTML + "\n" + r2.container.innerHTML).toMatchSnapshot();
  });

  it("label tooltip hover", () => {
    const { container } = render(
      <Editor id="t" title="T" tooltip="Hello" toolTipPosition={TooltipPosition.Bottom} />
    );
    fireEvent.mouseEnter(container.querySelector(".tooltip-icon") as HTMLElement);
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("formState binding + container validate", async () => {
    const ref = React.createRef<any>();
    function Form() {
      const [form, setForm] = React.useState<any>({ name: "John", age: 3 });
      return (
        <Container ref={ref}>
          <Row>
            <Editor id="name" title="Name" formState={form} dispatchFormState={setForm} required />
            <Editor
              id="age"
              title="Age"
              type={Input.Integer}
              formState={form}
              dispatchFormState={setForm}
            />
            <Editor id="empty" title="Empty" formState={form} dispatchFormState={setForm} required />
          </Row>
        </Container>
      );
    }
    const { container } = render(<Form />);
    let results: any[] = [];
    await act(async () => {
      results = await ref.current.validate();
    });
    expect(results.map((r) => [r.Name, r.Message])).toMatchSnapshot();
    expect(container.innerHTML).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// Alert / Loading / Tooltip
// ---------------------------------------------------------------------------
describe("baseline: Alert / Loading / Tooltip", () => {
  it("Alert variants", () => {
    const out = [
      html(<Alert type={AlertType.Success}>ok</Alert>),
      html(<Alert type={AlertType.Warning}>warn</Alert>),
      html(<Alert type={AlertType.Danger}>bad</Alert>),
      html(<Alert type={AlertType.Info}>info</Alert>),
      html(
        <Alert type={AlertType.Info} className="mine">
          info
        </Alert>
      ),
      html(
        <Alert
          type={AlertType.Warning}
          config={{ textAlign: "left", classes: { warning: "custom-warning" } as any }}
        >
          w
        </Alert>
      ),
      html(
        <Alert type={AlertType.Warning} config={{ textAlign: "right" }}>
          w
        </Alert>
      ),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("Loading variants", () => {
    const out = [
      html(<Loading />),
      html(<Loading size="sm" />),
      html(<Loading size="lg" text="Wait" className="x" />),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("Tooltip positions + hover", () => {
    const out: string[] = [];
    for (const pos of [
      TooltipPosition.Top,
      TooltipPosition.Bottom,
      TooltipPosition.Left,
      TooltipPosition.Right,
    ]) {
      const { container } = render(
        <Tooltip text="Hint" position={pos} className="tc">
          <button>b</button>
        </Tooltip>
      );
      out.push(container.innerHTML);
      fireEvent.mouseEnter(container.querySelector("button") as HTMLElement);
      out.push(container.innerHTML);
      fireEvent.mouseLeave(container.querySelector("button") as HTMLElement);
      out.push(container.innerHTML);
    }
    expect(out.join("\n")).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
const COLUMNS = [
  { header: "Name", accessor: "name", enableSort: true },
  {
    header: "Amount",
    accessor: "amount",
    type: ColumnType.FLOAT,
    headerAlign: AlignType.END,
    contentAlign: AlignType.END,
  },
  { header: "Date", accessor: "date", type: ColumnType.DATE },
  {
    header: "Status",
    accessor: "status",
    sourceList: [
      { id: 1, description: "Active", badge: "bg-success" },
      { id: 2, description: "Inactive", badge: "bg-danger" },
    ],
    displayBadge: true,
    headerAlign: AlignType.CENTER,
  },
  { header: "Dept", accessor: "dept", disableFilters: true },
];
const DATA = [
  { id: "a", name: "Ann", amount: 10.5, date: "2024-01-15", status: 1, dept: "Sales", items: [{ sku: "X1" }] },
  { id: "b", name: "Bob", amount: 3, date: "2024-02-20", status: 2, dept: "Sales", items: [] },
  { id: "c", name: "Cid", amount: 7.25, date: "2024-03-05", status: 1, dept: "IT", items: [{ sku: "Y2" }] },
];

describe("baseline: Table", () => {
  it("basic", () => {
    expect(html(<Table columns={COLUMNS} data={DATA} />)).toMatchSnapshot();
  });

  it("basic options (no hover, className, scroll, sticky, rowClassName)", () => {
    expect(
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          enableHoverEffect={false}
          className="my-table"
          scrollable
          scrollHeight={300}
          stickyHeader
          rowClassName={(r) => (r.status === 2 ? "inactive" : "")}
          rowFooterRender={(r) => <span>footer {r.name}</span>}
        />
      )
    ).toMatchSnapshot();
  });

  it("sorting click", () => {
    const { container } = render(<Table columns={COLUMNS} data={DATA} />);
    fireEvent.click(screen.getByText("Name"));
    const first = container.innerHTML;
    fireEvent.click(screen.getByText("Name"));
    expect(first + "\n" + container.innerHTML).toMatchSnapshot();
  });

  it("with pagination", () => {
    const out = [
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          pagination={{ showPagination: true, totalRecords: 35, currentPage: 2, pageSize: 10 }}
        />
      ),
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          pagination={{
            showPagination: true,
            totalRecords: 35,
            currentPage: 1,
            pageSize: 10,
            paginationPosition: "both",
          }}
        />
      ),
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          pagination={{ showPagination: true, totalRecords: 3, currentPage: 1, pageSize: 10 }}
        />
      ),
    ];
    expect(out.join("\n")).toMatchSnapshot();
  });

  it("empty (table + card)", () => {
    const empty: any[] = [];
    expect(
      html(<Table columns={COLUMNS} data={empty} />) +
        "\n" +
        html(<Table columns={COLUMNS} data={empty} viewMode={TableViewMode.CARD} />) +
        "\n" +
        html(<Table columns={COLUMNS} data={empty} noRecordMessage="Nothing" />)
    ).toMatchSnapshot();
  });

  it("loading", () => {
    expect(html(<Table columns={COLUMNS} data={DATA} loading />)).toMatchSnapshot();
  });

  it("grouped (table + card)", () => {
    const grouping = { enableGrouping: true, groupBy: "dept", expandAllGroups: true };
    const groupingFooter = {
      enableGrouping: true,
      groupBy: "dept",
      expandAllGroups: true,
      groupFooterRender: () => null as any,
    };
    expect(
      html(<Table columns={COLUMNS} data={DATA} grouping={grouping} />) +
        "\n" +
        html(<Table columns={COLUMNS} data={DATA} grouping={groupingFooter} />) +
        "\n" +
        html(
          <Table
            columns={COLUMNS}
            data={DATA}
            grouping={grouping}
            viewMode={TableViewMode.CARD}
          />
        )
    ).toMatchSnapshot();
  });

  it("grouped collapse toggle", () => {
    const grouping = { enableGrouping: true, groupBy: "dept", expandAllGroups: true };
    const { container } = render(
      <Table columns={COLUMNS} data={DATA} grouping={grouping} />
    );
    fireEvent.click(container.querySelector(".group-header") as HTMLElement);
    expect(container.innerHTML).toMatchSnapshot();
  });

  it("checkbox selection", () => {
    const { container } = render(
      <Table
        columns={COLUMNS}
        data={DATA}
        selection={SelectionType.CHECKBOX}
        enableSelectAll
      />
    );
    const before = container.innerHTML;
    const boxes = container.querySelectorAll("input[type=checkbox]");
    fireEvent.click(boxes[1]);
    const one = container.innerHTML;
    fireEvent.click(boxes[0]);
    expect([before, one, container.innerHTML].join("\n")).toMatchSnapshot();
  });

  it("card view + details", () => {
    const detail = [{ header: "SKU", accessor: "sku" }];
    expect(
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          viewMode={TableViewMode.CARD}
          columnsDetail={detail}
          dataDetailProperty="items"
          rowFooterRender={() => <i>f</i>}
          rowDetailFooterRender={() => <i>df</i>}
        />
      )
    ).toMatchSnapshot();
  });

  it("detail table", () => {
    const detail = [{ header: "SKU", accessor: "sku", contentAlign: AlignType.CENTER }];
    expect(
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          columnsDetail={detail}
          dataDetailProperty="items"
          classNameDetail="det"
          rowDetailFooterRender={() => <i>df</i>}
        />
      )
    ).toMatchSnapshot();
  });

  it("single record table with unique header", () => {
    expect(
      html(
        <Table
          columns={COLUMNS}
          data={DATA}
          singleRecordTable
          uniqueHeaderSingleRecordTable
        />
      )
    ).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// Legacy configuration paths
// ---------------------------------------------------------------------------
describe("baseline: legacy config paths", () => {
  const sample = () => (
    <Row>
      <Editor id="a" title="A" required type={Input.Email} md={ColumnSize.Col6} />
      <Alert type={AlertType.Info}>i</Alert>
      <Table columns={COLUMNS} data={DATA} pagination={{ showPagination: true, totalRecords: 30 }} />
    </Row>
  );

  it("configManager.setConfig overrides classes/icons/tags", () => {
    configManager.setConfig({
      components: {
        editor: { classes: { input: "my-input", controlGroup: "my-group" } },
        alert: { classes: { info: "my-info" } },
        table: { classes: { pagination: { container: "my-pg" } } },
      },
      resources: { icons: { email: "my-email-icon" } },
      tags: { columnTag: "section" },
    });
    expect(html(sample())).toMatchSnapshot();
  });

  it("window.SmartRConfig is picked up", () => {
    configManager.resetConfig();
    (window as any).SmartRConfig = {
      components: { editor: { classes: { label: "win-label" } } },
    };
    expect(html(sample())).toMatchSnapshot();
  });
});
