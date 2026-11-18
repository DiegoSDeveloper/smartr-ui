# smartr-ui — React form & data components

[![npm version](https://img.shields.io/npm/v/smartr-ui.svg)](https://www.npmjs.com/package/smartr-ui)
[![license](https://img.shields.io/npm/l/smartr-ui.svg)](./LICENSE)

A pragmatic component kit for building robust, data-heavy React apps: forms, tables, layout, validation, file inputs, and more — with strong TypeScript types and real-world ergonomics.

---

## Key Features

- **Typed form controls** with rich props (masking, icons, validation hooks, number/date/text modes, grouped selects, file inputs, etc.)
- **Powerful data table** with sorting, selection modes, badges, card/table view, pagination and auto data-loading
- **Grid layout primitives** (`Row`, `Column`, responsive sizes) for consistent page structure
- **Validation system** with built-in rules, pluggable validators, validation modes (`blur` / `change` / `submit` / `afterSubmit`) and custom async hooks
- **Phone masks per country** (US, BR mobile/landline), toggle **chips**, form-level messages
- **TypeScript first** with full type definitions
- **Framework agnostic styling** — Bootstrap 5 by default, a ready-made **Tailwind** preset, or a fully **unstyled** mode driven by data-attributes (see [Styling & frameworks](#styling--frameworks))
- **Customizable configuration** with user-defined settings, presets, a React provider and per-instance overrides

---

## Installation

```bash
npm install smartr-ui
```

**Peer dependencies:** `react` (>=16.8.0), `react-dom` (>=16.8.0) — tested with React 18 and 19.

> By default the library renders Bootstrap 5 class names (load Bootstrap 5 CSS, and Font Awesome for the default icons). Using Tailwind or another CSS framework? See [Styling & frameworks](#styling--frameworks). Every class can also be overridden through `configManager.setConfig(...)`.

---

## Quick Start

```tsx
import React from "react";
import { Row, Editor, Input, ColumnSize } from "smartr-ui";

function ExampleForm() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    birthDate: "",
  });

  return (
    <Row>
      <Editor
        id="name"
        title="Full name"
        required
        type={Input.Text}
        sm={ColumnSize.Col12}
        md={ColumnSize.Col6}
        formState={form}
        dispatchFormState={setForm}
      />
      <Editor
        id="email"
        title="Email"
        type={Input.Email}
        sm={ColumnSize.Col12}
        md={ColumnSize.Col6}
        formState={form}
        dispatchFormState={setForm}
      />
    </Row>
  );
}
```

---

## Core Components

### Editor — The universal input component

`Editor` handles multiple input types through a single component:

```tsx
// Text input with validation
<Editor
  type={Input.Text}
  title="Username"
  required
  min={3}
  max={50}
  invalidMessage="Username must be 3-50 characters"
/>

// Password with show/hide toggle
<Editor
  type={Input.Password}
  title="Password"
  enableShowPassword
  showPasswordIcon="eye"
  hidePasswordIcon="eye-off"
/>

// Select with options
<Editor
  type={Input.Select}
  title="Country"
  options={[
    { id: 'br', description: 'Brazil' },
    { id: 'us', description: 'United States' }
  ]}
  optionsId="id"
  optionsDescription="description"
/>

// File upload
<Editor
  type={Input.File}
  title="Document"
  accept=".pdf,.jpg,.png"
  maxFiles={3}
  maxFileSize={5242880} // 5MB
  onDownloadFileClick={handleDownload}
  onDeleteFileClick={handleDelete}
/>
```

### Async Select — server-side search with incremental loading

For large datasets, don't load the whole list upfront. Pass a `loadOptions` handler and the
dropdown becomes **asynchronous**: it loads one page at a time (default 20), searches on the
server as the user types (debounced), and loads more pages on scroll (infinite scroll,
accumulating results).

**The library never performs I/O.** It has no knowledge of URLs, headers, response formats or
authentication — it only decides *when* to ask for data (debounce, page counter, request
cancellation, caching, keyboard/ARIA, visual states). *How* to fetch is entirely up to the
consumer, through handlers:

```ts
type SmartOption = { id: any; description: string; [k: string]: any };

type LoadOptionsArgs = {
  search: string;      // debounced search term
  page: number;        // 1-based
  pageSize: number;
  signal: AbortSignal; // forward it to your fetch — the lib aborts superseded requests
};

type LoadOptionsResult = {
  options: SmartOption[];
  hasMore?: boolean;   // when omitted, inferred from options.length === pageSize
  total?: number;      // optional, if you know it
};
```

The backend lives in **your app**, not in the library:

```tsx
// Consumer (app) — the library never sees any of this:
const buscarClientes = async ({ search, page, pageSize, signal }) => {
  const url = `/api/v1/Customer/Filter?usePagination=true&page=${page}&pageSize=${pageSize}`
            + (search ? `&name=${encodeURIComponent(search)}` : "");
  const res = await fetch(url, { signal, headers: { Authorization: `Bearer ${token}` } });
  const options = (await res.json()).map(c => ({ id: c.id, description: c.name }));
  const total = Number(res.headers.get("X-Total-Count") ?? 0);
  return { options, total };
};

const carregarClienteSelecionado = async (id, signal) => {
  const res = await fetch(`/api/v1/Customer/${id}`, { signal, headers: { Authorization: `Bearer ${token}` } });
  const c = await res.json();
  return c ? { id: c.id, description: c.name } : null;
};

<Editor
  id="customerId"
  type={Input.Select}
  loadOptions={buscarClientes}
  loadSelectedOption={carregarClienteSelecionado}
  pageSize={20}
  formState={form}
  dispatchFormState={setForm}
/>
```

**Editing existing records:** when the form opens with a value already set (e.g. an invoice's
`customerId`), that item is usually not in the first page. The component resolves its label
independently of pagination — either through `loadSelectedOption(value, signal)` or a
pre-resolved `selectedOption={{ id, description }}` — and keeps it visible and selected even
when the current search doesn't return it.

**`Input.FastSearch`** uses the same engine with autocomplete defaults — it only searches after
the user types (`minSearchLength: 1`, `loadOnOpen: false`):

```tsx
<Editor
  id="customerId"
  type={Input.FastSearch}
  loadOptions={buscarClientes}
  loadSelectedOption={carregarClienteSelecionado}
  formState={form}
  dispatchFormState={setForm}
/>
```

Without `loadOptions`, `Input.FastSearch` keeps its previous behavior (plain text input) and
`Input.Select` with in-memory `options` keeps filtering locally — no breaking changes.

| Prop                 | Type                                                     | Default                          | Notes                                                          |
| -------------------- | -------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `loadOptions`        | `(args: LoadOptionsArgs) => Promise<LoadOptionsResult>`  | —                                | **Enables async mode.** The lib calls it; you fetch.           |
| `loadSelectedOption` | `(value, signal) => Promise<SmartOption \| null>`        | —                                | Resolves the selected value's label outside loaded pages.      |
| `selectedOption`     | `SmartOption \| null`                                    | —                                | Alternative: hand over the already-resolved selected item.     |
| `pageSize`           | `number`                                                 | `20` (config)                    | Items requested per page.                                      |
| `searchDebounceMs`   | `number`                                                 | `300` (config)                   | Typing debounce before calling `loadOptions`.                  |
| `minSearchLength`    | `number`                                                 | `0` (Select) / `1` (FastSearch)  | Minimum characters before searching.                           |
| `loadOnOpen`         | `boolean`                                                | `true` (Select) / `false` (FastSearch) | Load page 1 when the dropdown opens.                    |
| `onSearchChange`     | `(search: string) => void`                               | —                                | Escape hatch: observe raw (non-debounced) typing.              |
| `onOpen`             | `() => void`                                             | —                                | Escape hatch: dropdown opened.                                 |
| `optionRenderer`     | `(option, isSelected, search) => ReactNode`              | —                                | Custom option rendering (same prop as the sync Select).        |
| `renderEmpty`        | `(search) => ReactNode`                                  | config text                      | Custom empty state.                                            |
| `renderError`        | `(error, retry) => ReactNode`                            | config text + retry link         | Custom error state.                                            |
| `renderLoading`      | `() => ReactNode`                                        | config text                      | Custom loading state.                                          |

Defaults live in `config.behavior.select` (`pageSize`, `searchDebounceMs`, `minSearchLength`,
`loadOnOpen`, `fastSearchMinSearchLength`, `fastSearchLoadOnOpen`) and texts/classes in
`config.components.select.texts` / `.classes` (`loadingText`, `loadingMoreText`, `noResultsText`,
`loadErrorText`, `retryText`, `minSearchText`, `optionActive`, `optionsMessage`, `optionsError`,
`optionsRetry`, `optionsSentinel`) — all overridable via `configManager`.

### Table — Advanced data display

```tsx
import { Table, AlignType } from "smartr-ui";

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Email", accessor: "email" },
  {
    header: "Status",
    accessor: "status",
    headerAlign: AlignType.CENTER,
    contentAlign: AlignType.CENTER,
    displayBadge: true,
  },
];

function DataTable() {
  return <Table columns={columns} data={userData} pagination pageSize={10} />;
}
```

#### Scroll & sticky header (opcional)

Por padrão a Table **não tem scroll** e o header rola junto — comportamento idêntico ao anterior, sem breaking changes. Para habilitar scroll vertical com header fixo:

```tsx
<Table
  columns={columns}
  data={rows}
  scrollable          // habilita overflow vertical
  scrollHeight={500}  // px (default "400px" se omitido). Aceita string ("60vh") ou number.
  stickyHeader        // <thead> com position: sticky; top: 0
/>
```

| Prop           | Tipo                  | Default       | Notas                                                  |
| -------------- | --------------------- | ------------- | ------------------------------------------------------ |
| `scrollable`   | `boolean`             | `false`       | Sem efeito quando `viewMode = CARD`.                   |
| `scrollHeight` | `string \| number`    | `"400px"`     | Só usado quando `scrollable=true`. Number vira `px`.   |
| `stickyHeader` | `boolean`             | `false`       | Funciona independente de `scrollable`.                 |

### Alert — Contextual feedback messages

```tsx
import { Alert, AlertType } from "smartr-ui";

function AlertExamples() {
  return (
    <>
      <Alert type={AlertType.Success}>
        <strong>Success!</strong> Operation completed successfully.
      </Alert>
      <Alert type={AlertType.Warning}>
        <strong>Warning!</strong> Please check your input.
      </Alert>
      <Alert type={AlertType.Danger}>
        <strong>Error!</strong> Something went wrong.
      </Alert>
      <Alert type={AlertType.Info}>
        <strong>Info:</strong> This is an informational message.
      </Alert>
    </>
  );
}
```

### Layout components

```tsx
import { Row, Column, Container } from "smartr-ui";

function LayoutExample() {
  return (
    <Container>
      <Row>
        <Column sm={12} md={6} lg={4}>
          {/* Content */}
        </Column>
        <Column sm={12} md={6} lg={8}>
          {/* Content */}
        </Column>
      </Row>
    </Container>
  );
}
```

---

## Supported `Input` types

The `Input` enum is the single switch for the `Editor` component. Each value maps to a specific HTML element/behavior:

| `Input` value     | Renders as                          | Notes                                                              |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `Input.Text`      | `<input type="text">`               | Supports `characterCasing` (Upper / Lower / Normal)                |
| `Input.LongText`  | `<textarea>`                        | `rows` prop controls height                                        |
| `Input.Password`  | `<input type="password">`           | `enableShowPassword` toggles to `text`                             |
| `Input.Email`     | `<input type="email">`              | Default email icon                                                 |
| `Input.FastSearch`| async dropdown (or `<input type="text">`) | With `loadOptions`: server-side autocomplete (see Async Select). Without: plain text input |
| `Input.Integer`   | `<input type="number">`             | Honors `min` / `max` as numeric bounds                              |
| `Input.Decimal`   | `<input type="text">` (masked)      | Configurable thousands/decimal separators and decimal places       |
| `Input.Money`     | `<input type="text">` (masked)      | Currency icon prepended                                            |
| `Input.Percent`   | `<input type="text">` (masked)      | `%` icon                                                           |
| `Input.Date`      | `<input type="date">`               | `minDate` / `maxDate` accepted as `Date` or `YYYY-MM-DD` string    |
| `Input.DateTime`  | `<input type="datetime-local">`     | `minDate` / `maxDate` as `Date` or `YYYY-MM-DDTHH:MM` string       |
| `Input.Month`     | `<input type="month">`              | `minDate` / `maxDate` as `Date` or `YYYY-MM` string                |
| `Input.Week`      | `<input type="week">`               | `minDate` / `maxDate` as ISO week string `YYYY-Www`                |
| `Input.Time`      | `<input type="text">` + mask        | Custom masked text (legacy). Use existing field; native picker not exposed. |
| `Input.Phone`     | `<input type="tel">` + mask         | Default mask from config; `phoneCountry` / `mask={false}` (see [Phone masks](#phone-masks)) |
| `Input.Mobile`    | `<input type="tel">` + mask         | Same as Phone with mobile icon                                     |
| `Input.Fax`       | `<input type="tel">` + mask         |                                                                    |
| `Input.Url`       | `<input type="url">`                | Default link icon                                                  |
| `Input.Color`     | `<input type="color">`              | Native color picker, value as `#rrggbb`                            |
| `Input.Range`     | `<input type="range">`              | Numeric `min` / `max` / `step` (allows `min=0`); value is `Float`  |
| `Input.CheckBox`  | `<input type="checkbox">`           | Boolean value                                                      |
| `Input.Radio`     | `<input type="radio">`              | Auto-generates `name` if not provided                              |
| `Input.Select`    | `<select>` (or filterable Select)   | Supports grouping, multi-select, custom renderer, search. With `loadOptions`: async server-side search (see Async Select) |
| `Input.File`      | `<input type="file">`               | Multi-file, `accept`, `maxFileSize`, download/delete callbacks     |
| `Input.Hidden`    | `<input type="hidden">`             | Skips events; participates in form state                           |
| `Input.Label`     | Read-only label                     | Renders the value as static text (`form-control-plaintext`), keeping title/layout |
| `Input.Chips`     | `role="group"` of toggle chips      | Multi-select with checkbox semantics; value array (or separated string). See [Chips](#chips) |

### HTML input types — coverage notes

| HTML5 input                   | Status     | Notes                                                                                                |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `<input type="time">`         | ⚠️ Partial | `Input.Time` ships as a masked text input. Native `type="time"` picker is not exposed (open an issue if needed). |
| `<input type="image">`        | ❌ Missing  | Image submit button — rarely used in form kits, not on the roadmap.                                  |

All other standard HTML5 input types (`text`, `password`, `email`, `number`, `tel`, `search`, `url`, `date`, `datetime-local`, `month`, `week`, `color`, `range`, `file`, `checkbox`, `radio`, `hidden`, `select`, `textarea`) are mapped through the `Input` enum.

### Examples — the inputs added in 1.0.17

```tsx
// URL field
<Editor type={Input.Url} title="Website" placeholder="https://…" />

// Native datetime-local picker (accepts Date instance directly)
<Editor
  type={Input.DateTime}
  title="Scheduled at"
  formState={form}
  dispatchFormState={setForm}
  minDate={new Date()}
/>

// Native month picker
<Editor type={Input.Month} title="Reference month" />

// ISO week picker (string value, e.g. "2026-W19")
<Editor type={Input.Week} title="Week" />

// Color picker (value is "#rrggbb")
<Editor type={Input.Color} title="Brand color" />

// Range slider (numeric value; supports min=0)
<Editor
  type={Input.Range}
  title="Volume"
  min={0}
  max={100}
  step={5}
/>
```

---

## Advanced Features

### Form-state binding

`Editor` supports three binding modes — pick the one that matches your data shape:

```tsx
// 1. Object form (most common)
<Editor id="email" formState={form} dispatchFormState={setForm} />

// 2. Single-value state
<Editor id="search" state={query} dispatchState={setQuery} />

// 3. List of objects (for dynamic rows / repeating sections)
<Editor
  id="email"
  listFormState={contacts}
  listFormIndex={i}
  dispatchListFormState={setContacts}
/>
```

### Custom validation

```tsx
const validateEmail = async (value: string) => {
  const errors = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push(
      new ValidationResult(
        "email",
        "Email",
        ValidationMessage.Error,
        "Invalid email format",
        value
      )
    );
  }
  return errors;
};

<Editor
  type={Input.Email}
  title="Email"
  validateOnBlur
  customValidationOnBlur={validateEmail}
/>;
```

You can also wire `customValidationOnChange` and `customValidationOnSubmit` independently. Default rules (required, min/max length, numeric bounds, date bounds) run automatically when `validateDefaultOn*` flags are enabled.

### Pluggable validators

Replace (or add) built-in rules globally with `config.validators`, or per Editor with the
`validators` prop (which wins). A rule returns `true` (valid; `undefined`/`null` too), `false`
(invalid, default message) or a string (invalid, that message). Setting a rule to `false`
instead of a function turns it off, built-in rule included.

| Rule       | Runs for                                    | Built-in rule when unset                    | Default message key |
| ---------- | ------------------------------------------- | ------------------------------------------- | ------------------- |
| `required` | `required` Editors (decides "is present")   | empty value / empty FileList / empty array  | `resources.validationMessages.required` |
| `email`    | non-empty `Input.Email` values              | `behavior.validation.emailRule` (below)     | `…validationMessages.email` |
| `phone`    | non-empty `Input.Phone` / `Mobile` / `Fax` values (unmasked) | none                   | `…validationMessages.phone` |
| `url`      | non-empty `Input.Url` values                | none                                        | `…validationMessages.url` |

```tsx
import { configManager } from "smartr-ui/config";
import { isValidPhoneNumber } from "libphonenumber-js"; // any library

configManager.setConfig({
  validators: {
    phone: (value) => isValidPhoneNumber(String(value), "BR"),
    required: (value) => String(value ?? "").trim() !== "", // whitespace counts as empty
  },
});

// per instance (the context gives type / id / name / title / config)
<Editor
  id="email"
  type={Input.Email}
  validators={{ email: (value, { title }) => String(value).endsWith("@corp.com") || `${title}: use your corporate address` }}
/>
<Editor id="legacy" type={Input.Email} validators={{ email: false }} /> {/* no e-mail rule at all */}
```

**Built-in e-mail rule** (`behavior.validation.emailRule`): `"legacy"` in the Bootstrap preset —
exactly the 1.1.0 ASCII regex, value not trimmed — and `"unicode"` in the Tailwind / shadcn /
unstyled presets: the value is trimmed and IDN / unicode / punycode domains are accepted
(`josé@exämple.com.br`, `user@xn--bcher-kva.de`). `isValidEmail(value, config)` exposes it.

### Validation modes

`validateMode` (prop, or `behavior.validation.validateMode` globally) decides when an Editor shows
its messages:

| Mode            | Behavior                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| *(unset)*       | 1.1.0 behavior: `validateOnBlur` (default `true`) / `validateOnChange` (default `false`)   |
| `"blur"`        | on blur                                                                                    |
| `"change"`      | on every change                                                                            |
| `"submit"`      | only through `validate()` (Editor ref or `Container`)                                      |
| `"afterSubmit"` | nothing until the first `validate()` / Container submit, then live on change and blur (the submit rules: `validateDefaultOnSubmit` + `customValidationOnChange ?? customValidationOnSubmit`) |

Explicit `validateOnBlur` / `validateOnChange` props always win over the mode. The `Container`
tracks the submitted state: `ref.current.isSubmitted()`, `ref.current.resetValidation()` (clears
every Editor's messages and the submitted state, e.g. when a dialog reopens).

```tsx
const form = React.useRef<ContainerRef>(null);

<Container ref={form}>
  <Editor id="name" title="Name" required validateMode="afterSubmit" formState={f} dispatchFormState={setF} />
  <Editor id="email" title="E-mail" type={Input.Email} required validateMode="afterSubmit" formState={f} dispatchFormState={setF} />
</Container>
<button onClick={async () => (await form.current!.validate()).length === 0 && save()}>Save</button>
```

### External errors and `validate()`

`errors` (`ReactNode | ReactNode[] | null`) shows server / cross-field messages on an Editor and
makes it invalid. **Rule:** `validate()` (Editor ref and `Container`) returns the Editor's own
results followed by one `ValidationResult` of type Error per non-empty `errors` entry (message =
the text of the node). They are not duplicated on screen. Because `errors` is controlled by the
parent, clear it (e.g. on change of that field) so that a resubmission can pass. Turn this off
with `behavior.validation.includeExternalErrors: false`.

### Form-level messages (`FormMessage`)

For messages without an owning field (a cross-field rule, a server error):

```tsx
import { FormMessage } from "smartr-ui";

<FormMessage id="channels-error">{noChannel && "Pick at least one channel"}</FormMessage>
<FormMessage type="success">Saved</FormMessage>
<FormMessage messages={[serverError, otherError]} />   {/* empty entries are skipped */}
<Editor id="phone" aria-describedby="channels-error" />  {/* optional ARIA linkage */}
```

Renders nothing when empty; otherwise a `<div>` (`tags.invalidFeedbackTag`) with `role="alert"`
(errors) or `role="status"` (`success` / `warning`; `role="none"` to drop it), the optional `id`,
and the classes `components.validation.classes.messageError` / `messageSuccess` / `messageWarning`
plus `components.validation.classes.formMessage` and `className`:

| Preset    | Error classes                                   |
| --------- | ----------------------------------------------- |
| Bootstrap | `error-validation-message`                      |
| Tailwind  | `text-xs text-red-600`                          |
| shadcn    | `text-sm font-medium text-destructive` (shadcn `<FormMessage>`) |
| unstyled  | none (`data-state="error"`)                     |

In ARIA mode an Editor's own `aria-describedby` is kept (first) and merged with its note /
message ids.

### Responsive grid system

```tsx
<Row>
  <Editor
    title="Small field"
    sm={ColumnSize.Col12} // 100% on mobile
    md={ColumnSize.Col6} // 50% on tablet
    lg={ColumnSize.Col4} // 33% on desktop
    type={Input.Text}
  />
</Row>
```

`ColumnSize` is `Col1`–`Col12`. Breakpoints follow `ScreenSize` (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`).

### Hooks

```tsx
import { useSmartConfig } from "smartr-ui";

function MyComponent() {
  // nearest <SmartRProvider> config, or the global configManager config
  const config = useSmartConfig();
  return <span>{config.components.alert.classes.success}</span>;
}
```

---

## UI Components

* **Alert** — Contextual feedback messages with customizable types and styling
* **Loading** — Loading indicators with different sizes and themes
* **Tooltip** — Informational tooltips with configurable positioning
* **CheckboxGroup** — Checkbox group management
* **Radio** — Radio button groups
* **Select** — Enhanced dropdowns with search and grouping
* **Label** — Read-only label component used by Editor and standalone
* **EditorButton** — Prepend/append buttons that integrate with `Editor`'s input group

```tsx
import { Tooltip, Loading, TooltipPosition } from "smartr-ui";

<Tooltip text="Helpful hint" position={TooltipPosition.Top}>
  <button>Hover me</button>
</Tooltip>

<Loading size="lg" />
```

---

## Configuration

### Global Configuration

```tsx
import { configManager } from "smartr-ui";

// Set global defaults
configManager.setConfig({
  behavior: {
    validation: {
      validateOnBlur: true,
      validateOnSubmit: true,
    },
    input: {
      thousandsSeparator: ".",
      decimalSeparator: ",",
      decimalPlaces: 2,
    },
  },
  components: {
    alert: {
      textAlign: "center",
      classes: {
        container: "alert",
        success: "alert-success",
        warning: "alert-warning",
        danger: "alert-danger",
        info: "alert-info",
      },
    },
    table: {
      behavior: {
        pageSize: 10,
        pageSizes: [10, 25, 50, 100],
      },
    },
  },
});
```

### Component-specific Configuration

```tsx
// Override configuration for specific component instance
<Alert 
  type={AlertType.Warning}
  config={{
    textAlign: "left",
    classes: {
      warning: "custom-warning-class",
    }
  }}
>
  Custom styled alert
</Alert>
```

### Using Configuration Files

```json
// smartR.config.json
{
  "behavior": {
    "input": {
      "thousandsSeparator": ".",
      "decimalSeparator": ","
    }
  },
  "components": {
    "alert": {
      "textAlign": "center"
    }
  }
}
```

---

## Styling & frameworks

Every class name, grid class, icon and text comes from the configuration, so smartr-ui works
with Bootstrap, Tailwind, shadcn/ui or any other CSS approach (see [CHANGELOG.md](CHANGELOG.md)
for the release that introduced each feature).

> **Migration note — nothing to do for existing apps.** Without any configuration every
> component renders exactly the same HTML and classes as 1.1.0 (this is enforced by baseline
> snapshot tests). `configManager.setConfig(...)`, `window.SmartRConfig`, all props, enums
> and exports keep working unchanged. Everything below is opt-in.

### Presets

| Preset            | What it does                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `bootstrapPreset` | Bootstrap 5 classes + Font Awesome icons. **The default** (same object as `defaultConfig`).    |
| `tailwindPreset`  | Tailwind utility classes (fixed gray/blue/red palette), CSS-grid `Row`/`Column`, data-attributes on. Same behavior/texts. |
| `shadcnPreset`    | Tailwind classes built on the **shadcn/ui theme tokens** (`bg-background`, `border-input`, `ring-ring`, `text-muted-foreground`, `text-destructive`, `bg-popover`…): light/dark mode and shadcn themes work with zero overrides. Editor icons off. |
| `unstyledPreset`  | No classes at all (every class is `""`), no icons, state exposed through data-attributes.       |

All presets but Bootstrap also turn on `behavior.instanceClassesLast` (instance classes win, see
[Class precedence](#class-precedence)), `behavior.accessibility.aria` (see
[Validation, errors & accessibility](#validation-errors--accessibility)) and render the note as a `<p>`
(`tags.noteTag`). The Bootstrap preset keeps the exact 1.1.0 markup.

Apply a preset globally, or to a subtree with `SmartRProvider`:

```tsx
import { configManager, createConfig, tailwindPreset } from "smartr-ui";

// globally (replaces the base config)
configManager.setPreset(tailwindPreset);

// or build a config: preset + your overrides (deep merged, preset is not mutated)
const config = createConfig(tailwindPreset, {
  components: { editor: { classes: { label: "text-sm font-semibold" } } },
});
```

### Tailwind setup

**Requirements:** Tailwind CSS **3.2+** (the preset uses arbitrary variants such as `[&_td]:` and
`group-[.is-open]:`) or Tailwind **v4**.

```tsx
import { SmartRProvider, createConfig } from "smartr-ui";
import { tailwindPreset } from "smartr-ui/presets/tailwind"; // also exported from "smartr-ui"
import { twMerge } from "tailwind-merge"; // optional, recommended

// Built once, at module level (see SmartRProvider below)
const config = createConfig(tailwindPreset, { mergeClasses: twMerge });

<SmartRProvider config={config}>
  <App />
</SmartRProvider>;
```

`smartr-ui/presets/tailwind` resolves in bundlers, CommonJS (`require`, Jest, `tailwind.config.js`),
native Node ESM and TypeScript with any `moduleResolution` (`node`, `node16`/`nodenext`, `bundler`).

**Content scanning.** The preset's classes live inside the package, so tell Tailwind to scan the
preset file. Every class is written out in full there, and the file contains **only** the
Tailwind preset (no Bootstrap classes), so scanning it does not generate stray utilities.

```js
// tailwind.config.js (Tailwind v3) — paths relative to the project root
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/smartr-ui/dist/presets/tailwind.esm.js",
  ],
};
```

```css
/* Tailwind v4 (CSS-first config). v4 does not scan node_modules automatically, so register the
   preset with @source — the path is relative to THIS CSS file (here: src/index.css). */
@import "tailwindcss";
@source "../node_modules/smartr-ui/dist/presets/tailwind.esm.js";
```

If you cannot scan `node_modules`, use the exported safelist for the grid classes (the only
classes built from a lookup at runtime) and copy the preset's other classes into your own config:

```js
const { tailwindSafelist } = require("smartr-ui/presets/tailwind");
module.exports = { content: ["./src/**/*.{ts,tsx}"], safelist: tailwindSafelist };
```

**Grid mapping.** `Row` becomes `grid grid-cols-12 gap-x-4 gap-y-3` and column sizes map to
`col-span-*`. A column without an unprefixed size gets `col-span-12` (full width, like a
Bootstrap `.row > *`); so do the note and the validation messages of a `horizontal` Editor,
which are direct children of the row. `size` and `xs` both map to the unprefixed
`col-span-N`: when both are given, **`xs` wins** (only its class is emitted).

| smartr-ui (`ColumnSize` / `ScreenSize`) | Tailwind class            | Breakpoint (Tailwind / Bootstrap) |
| --------------------------------------- | ------------------------- | --------------------------------- |
| `size` / `xs`                           | `col-span-N`              | all sizes                         |
| `sm`                                    | `sm:col-span-N`           | 640px / 576px                     |
| `md`                                    | `md:col-span-N`           | 768px / 768px                     |
| `lg`                                    | `lg:col-span-N`           | 1024px / 992px                    |
| `xl`                                    | `xl:col-span-N`           | 1280px / 1200px                   |
| `xxl`                                   | `2xl:col-span-N`          | 1536px / 1400px                   |
| negative size (Bootstrap `auto`)        | `col-auto` / `md:col-auto`… |                                 |

**Class merging.** `mergeClasses` is a pluggable `(...classes: string[]) => string`. By default
classes are simply concatenated (1.1.0 behavior). With `tailwind-merge`, per-instance
`classNames` override conflicting preset utilities (`px-3` + `px-8` → `px-8`).
`tailwind-merge` is **not** a dependency of smartr-ui — install it yourself if you want it.
The preset itself does not depend on it: the invalid state uses the important modifier
(`!border-red-500 focus:!border-red-500 focus:!ring-red-500/20`), so it wins over the input's
normal border/ring colors regardless of CSS order.

The Tailwind preset keeps the Font Awesome icon classes; replace them with React icons
(see [Icons](#icons)) if you don't load Font Awesome.

### shadcn/ui setup

`shadcnPreset` matches shadcn's `Input` / `Textarea` / `SelectTrigger` / `Label` / `Checkbox`
defaults (`h-10`, `rounded-md`, `text-base md:text-sm`, `focus-visible:ring-2 ring-ring
ring-offset-2`), `FormItem` (`space-y-2`), `FormDescription` and `FormMessage`. Every color is a
theme token, so dark mode works without overrides. It needs the shadcn CSS variables
(`npx shadcn init`) and Tailwind 3.2+ or v4.

```tsx
import { SmartRProvider, createConfig } from "smartr-ui";
import { shadcnPreset } from "smartr-ui/presets/shadcn"; // also exported from "smartr-ui"
import { cn } from "@/lib/utils"; // shadcn's clsx + tailwind-merge

const config = createConfig(shadcnPreset, {
  mergeClasses: cn,                  // instance classes win over preset utilities
  render: { select: ShadcnSelect },  // optional: Radix select (adapter in "Render slots")
});

<SmartRProvider config={config}><App /></SmartRProvider>;
```

Content scanning works like the Tailwind preset: register
`node_modules/smartr-ui/dist/presets/shadcn.esm.js` (`content` in Tailwind v3, `@source` in v4) or
use the exported `shadcnSafelist`. `smartr-ui/presets/shadcn` resolves in bundlers, CommonJS,
native Node ESM and TypeScript `node` / `node16` / `nodenext` / `bundler`.

The Editor icons are `false` (shadcn apps don't ship Font Awesome): inputs render without icon
wrappers, File buttons show text labels, and a label tooltip gets the accessible `?` trigger
(styled by `components.tooltip.classes.trigger`). Plug lucide icons through
`resources.icons` / `components.table.icons` if you want them (Table sort/pagination icons keep the
Font Awesome names, as in the Tailwind preset).

**Settings rows (`layout="switch"`).** Title (or `checkBoxText`) and note on the left, the control on
the right: shadcn's "switch in a bordered row" form pattern. With `shadcnPreset` the native
checkbox is drawn as a switch: the checkbox is the track (`checkbox.classes.switch`,
`appearance-none`) and a sibling `<span aria-hidden>` is the thumb (`checkbox.classes.switchThumb`,
`peer-checked:translate-x-5`) — no `::before` on the input, so it renders in every evergreen
browser including Firefox. Or plug the Radix `Switch` through `render.checkbox` (no thumb span is
rendered for custom controls). Per row: `classNames={{ switchRow, switchText, switchGroup, switchThumb }}`.

```html
<div class="… rounded-lg border p-4">            <!-- editor.classes.switchRow -->
  <div class="space-y-0.5"><label>…</label><p>…</p></div>  <!-- switchText -->
  <div class="relative inline-flex …">           <!-- checkbox.classes.switchGroup -->
    <input type="checkbox" class="peer h-6 w-11 appearance-none rounded-full … checked:bg-primary">
    <span aria-hidden="true" class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full … peer-checked:translate-x-5"></span>
  </div>
</div>
```

```tsx
<Editor<boolean>
  type={Input.CheckBox}
  id="allow-override"
  layout="switch"
  checkBoxText="Allow senders to override"
  note={allow ? "Senders can change the method" : "The defaults are enforced"}
  value={allow}
  onValueChange={setAllow}
/>
```

### Recommended setup for shadcn apps

This is how a shadcn/ui + i18next app (Vite, React 19) wires smartr-ui — the forms never import
`smartr-ui` directly, only a local module that configures it once:

```tsx
// src/lib/smartr.tsx — imported only by the (lazily loaded) pages that have forms,
// so neither the configuration nor the Editor lands in the initial bundle.
import i18n from "i18next";
import { useImperativeHandle, useRef } from "react";
import { configManager, shadcnPreset } from "smartr-ui/config";
import type { SmartRControlPropsWithRef } from "smartr-ui/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NONE = "__smartr_none__"; // Radix <SelectItem> forbids ""
const toRadix = (value: unknown) => (value == null || value === "" ? NONE : String(value));

/** Radix select in place of the native <select>, built from the options the Editor passes as data. */
function SelectControl({ ref, id, name, value, onChange, onBlur, disabled, className, options = [], placeholder, ...rest }:
  SmartRControlPropsWithRef<{ value: string; focus(): void }>) {
  const current = value == null ? "" : String(value);
  const latest = useRef(current);
  latest.current = current;
  const trigger = useRef<HTMLButtonElement>(null);
  // the Editor reads `.value` from the ref when validating
  useImperativeHandle(ref, () => ({ value: current, focus: () => trigger.current?.focus() }), [current]);
  const emit = (handler?: (event: unknown) => void) => handler?.({ target: { name, value: latest.current } });
  return (
    <Select value={toRadix(current)} disabled={disabled}
      onValueChange={(next) => { latest.current = next === NONE ? "" : next; emit(onChange); }}
      onOpenChange={(open) => !open && emit(onBlur)}>
      <SelectTrigger ref={trigger} id={id} className={className}
        aria-invalid={rest["aria-invalid"]} aria-describedby={rest["aria-describedby"]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={toRadix(o.value)} value={toRadix(o.value)} disabled={o.disabled}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

configManager.setPreset(shadcnPreset, {
  mergeClasses: cn,                                     // instance classes win (tailwind-merge)
  // i18next, keys = configuration paths (src/i18n/locales/<lang>/smartr.json, see below)
  translate: (key, fallback) => (i18n.exists(`smartr.${key}`) ? i18n.t(`smartr.${key}`) : fallback),
  render: { select: SelectControl },
  behavior: { validation: { validateMode: "afterSubmit" } }, // optional: errors after the first submit
  grid: { row: "grid grid-cols-12 gap-3" },             // the app's own spacing conventions
});

export { Column, ColumnSize, Editor, FormMessage, Input, Label, Row } from "smartr-ui/core";
```

- **`smartr-ui/config` + `smartr-ui/core`**: the configuration module pulls no component code; the
  forms get the Editor from `smartr-ui/core` (async select and file control lazy-loaded). Both
  share the same configuration singleton.
- **Translations**: generate the dictionary once from `defaultTextsTree` and keep a key-coverage
  test so a new smartr-ui text never ships untranslated:

  ```ts
  // scripts/gen-smartr-i18n.ts
  import { defaultTextsTree } from "smartr-ui/config";
  fs.writeFileSync("src/i18n/locales/en/smartr.json", JSON.stringify(defaultTextsTree, null, 2));

  // smartr-i18n.test.ts — every built-in key exists in every locale
  import { smartrTranslationKeys } from "smartr-ui/config";
  for (const locale of ["en", "pt", "es", "fr"]) {
    const dict = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}/smartr.json`, "utf8"));
    for (const { key } of smartrTranslationKeys) {
      expect(key.split(".").reduce((o, p) => o?.[p], dict), `${locale}: ${key}`).toBeTypeOf("string");
    }
  }
  ```
- **Per-Editor opt-outs instead of global workarounds**: international phone fields use
  `mask={false}` / `placeholder={false}` (or `""`), a single settings row uses
  `classNames.switchRow`, channel pickers use `Input.Chips`, cross-field errors use `FormMessage`.

### Unstyled + data-attributes

`unstyledPreset` renders no classes and no icons. Components expose their state as
data-attributes (also emitted by the Tailwind preset; never by the Bootstrap preset, controlled
by `behavior.emitDataAttributes`):

| Attribute                 | Where                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| `data-invalid="true"`     | Editor group and control, checkbox group, async/custom select         |
| `data-disabled="true"`    | Editor group and control, select options, pagination items             |
| `data-required="true"`    | Editor group, control and label                                         |
| `data-size="sm\|md\|lg"`  | `Loading`                                                               |
| `data-state="…"`          | `open`/`closed` (custom/async select, table groups, show-password), `success`/`warning`/`danger`/`info` (Alert), `error`/`success`/`warning` (validation messages), `checked`/`active` (select options), `open` (tooltip), `loading` |

Without icons, the unstyled preset (and the Tailwind preset, via `behavior.hideEmptyIcons`) does not
render empty icon wrappers, and a label tooltip is reachable through a minimal focusable trigger:
`<button type="button" aria-label="{tooltip}" data-smartr-tooltip-trigger>?</button>` (opens on
hover/focus, closes on blur/Escape; the bubble gets `role="tooltip"` and the button
`aria-describedby` while open). Style it with `[data-smartr-tooltip-trigger]`.

Boolean states are only emitted when true, so `[data-invalid]` works as a selector:

```css
[data-smarteditor][data-invalid] { border-color: crimson; }
[data-state="open"] > .my-dropdown { display: block; }
```

```tsx
// Tailwind: style by state
<Editor id="email" classNames={{ input: "data-[invalid=true]:border-red-500" }} />
```

### Per-instance `classNames`

Class slots merged **after** the configured classes (through `mergeClasses` when set):

```tsx
<Editor
  id="email"
  title="Email"
  type={Input.Email}
  classNames={{
    column: "…",     // Column wrapper
    group: "…",      // control group (form-group)
    label: "…",      // title label
    input: "…",      // the control (input/select/textarea/checkbox/radio input)
    inputGroup: "…", // input-group wrapper
    icon: "…",       // icon wrapper (input-group-text)
    note: "…",       // note label
    error: "…",      // validation messages
    check: "…",      // checkbox/radio option wrapper (form-check)
    checkLabel: "…", // checkbox/radio option label
    tooltip: "…",    // tooltip bubble
    // layout="switch"
    switchRow: "…",   // row: text block + control (editor.classes.switchRow)
    switchText: "…",  // text block: title + note (editor.classes.switchText)
    switchGroup: "…", // wrapper of the control (checkbox.classes.switchGroup)
    switchThumb: "…", // the switch thumb, when the preset draws one (checkbox.classes.switchThumb)
    // Input.Chips
    chipGroup: "…",   // role="group" wrapper (chips.classes.group)
    chip: "…",        // every chip (chips.classes.chip)
  }}
/>

<Table classNames={{ container, wrapper, table, thead, empty, cardList, card }} … />
<Loading classNames={{ container, spinner, text }} />
```

`className` props keep working exactly as before.

### Class precedence

With the Tailwind, shadcn and unstyled presets (`behavior.instanceClassesLast: true`), or whenever
`mergeClasses` is configured, instance classes (`className` on `Row`, `Column`, `Editor`,
`Tooltip`, `Table`, and every `classNames` slot) are placed **after** the preset/config classes,
so with `tailwind-merge` the instance wins:

```tsx
// preset Row: "grid grid-cols-12 gap-x-4 gap-y-3"
<Row className="gap-x-3" />          // "grid grid-cols-12 gap-y-3 gap-x-3" (with twMerge)
<Editor id="n" className="h-9" />    // input: preset classes, h-9, the invalid state, classNames.input
```

The Bootstrap preset without a merger keeps the 1.1.0 token order (`className` first, e.g.
`<Row className="g-3">` renders `"g-3 row"`).

### Validation, errors & accessibility

- `invalid` is re-synced whenever the parent changes it after mount, so server/cross-field errors
  can drive the red state: `<Editor invalid={!!serverError} invalidMessage={serverError} />`.
- `errors` (`ReactNode | ReactNode[] | null`): external messages (server, cross-field). When
  non-empty the Editor is invalid and they are rendered as error messages (after the validation
  messages). They are also returned by `validate()` (see
  [External errors and `validate()`](#external-errors-and-validate)); clear them from the parent.
- `aria-invalid="true"` is emitted on invalid controls (as in 1.1.0).
- **ARIA wiring** (on in the Tailwind/shadcn/unstyled presets, opt-in for Bootstrap with
  `behavior: { accessibility: { aria: true } }`): the note gets `id="{id}-note"`, validation
  messages get `id="{id}-error"`, `"{id}-error-2"`… and `role="alert"` (errors) /
  `role="status"` (success/warning), and the control gets `aria-describedby` with those ids (custom
  render-slot controls receive it as a prop). Editors without `id`/`name` get generated ids.
  File upload/delete/download controls get `role="button"`, `tabIndex=0`, an `aria-label`
  (`resources.fileTexts.uploadLabel` / `deleteLabel` / `downloadLabel`, translatable) and
  Enter/Space activation; when their icon is `false` the label is rendered as visible text.
  The File name text box gets the same `aria-describedby` (and `aria-invalid`) as the control.
- `title`, `note` and `checkBoxText` accept React nodes (strings render exactly as before);
  `getTitle()` and validation results receive the node's text.

### Typed values

`Editor` is generic over its value type. Without a type argument nothing changes (`TValue` is `any`
and is never inferred from `value`). With one, `value`, `onChange`'s value and the new
`onValueChange(value, event)` are typed:

```tsx
<Editor<number> id="age" type={Input.Integer} onValueChange={(age) => setAge(age)} />
<Editor<boolean> id="terms" type={Input.CheckBox} checkBoxText="I agree" onValueChange={setTerms} />
```

`onValueChange` receives the converted value (`ValueType` applied, mask removed) and is called after
`onChange`.

### Bundle size: `smartr-ui/core`

The package declares `"sideEffects": ["*.css", "*.scss"]` (there are no CSS imports today), and the
main and core entries share chunks, so bundlers drop what you don't import. `smartr-ui/core`
exports the same components except `Table` (and its helpers), with an `Editor` that loads the async
select (`loadOptions`) and `Input.File` on demand (`React.lazy`, rendered as `null` for the instant
they load). Both entries share one configuration and one `SmartRProvider` context, so they can be
mixed.

```tsx
import { Editor, Input, Row } from "smartr-ui/core"; // text/select/checkbox forms: smaller bundle
```

Measured with esbuild (minified, React external) for a form with a text, a select and a checkbox
Editor: `smartr-ui` 1.1.0: 71.9 kB (23.3 kB gzip); now `smartr-ui`: 73.7 kB (24.4 kB gzip) and
`smartr-ui/core`: 62.6 kB (21.1 kB gzip), plus 10.8 kB of lazy chunks loaded only when an async
select or a file Editor renders (the Editor now also carries chips, validators and validation
modes).

### Configuration only: `smartr-ui/config`

Modules that only configure smartr-ui (app bootstrap, a settings module, a test setup) can import
from `smartr-ui/config`: `configManager`, `createConfig`, `SmartRProvider`, `SmartRConfigContext`,
`useSmartConfig`, `defaultConfig` and every preset, the translation keys
(`smartrTranslationKeys`, `defaultTexts`, `defaultTextsTree`, `translationKeyAliases`,
`getTranslationKeys`, `translationKeyPath`), `phoneMasks` and the configuration types — and no
component code. The three entries are built together and share chunks: one configuration
singleton and one React context, so `smartr-ui/config`, `smartr-ui/core` and `smartr-ui` can be
mixed freely.

```ts
import { configManager, shadcnPreset } from "smartr-ui/config";
configManager.setPreset(shadcnPreset, { mergeClasses: cn });
```

`import { configManager, SmartRProvider }` (esbuild, minified, React external): 15.7 kB from
`smartr-ui` and 20.6 kB (+10.7 kB lazy) from `smartr-ui/core` before the split; **13.0 kB
(4.8 kB gzip) from `smartr-ui/config`** — essentially the default configuration it must hold.

### Phone masks

`Input.Phone` / `Mobile` / `Fax` use `resources.masks.phone` (US `(000) 000-0000`) and the
placeholder `components.editor.placeHolders.phone` by default — unchanged in Bootstrap. Per Editor:

```tsx
<Editor id="intl" type={Input.Phone} mask={false} placeholder={false} />   // free text: +55 11 98765-4321
<Editor id="br" type={Input.Mobile} phoneCountry="BR" />                    // (11) 3333-4444 / (11) 98765-4321
<Editor id="br2" type={Input.Phone} mask="phone-br-landline" />             // (11) 3333-4444
<Editor id="us" type={Input.Phone} phoneCountry="US" />                     // (415) 555-0100
<Editor id="cpf" type={Input.Text} mask={["000.000.000-00", "00.000.000/0000-00"]} /> // CPF or CNPJ by length
```

| Country key    | Mask                                         | Placeholder        |
| -------------- | -------------------------------------------- | ------------------ |
| `US`           | `(000) 000-0000`                             | `(000) 000-0000`   |
| `BR`           | `(00) 0000-0000` → `(00) 00000-0000` (11 digits) | `(00) 00000-0000` |
| `BR-MOBILE`    | `(00) 00000-0000`                            | `(00) 00000-0000`  |
| `BR-LANDLINE`  | `(00) 0000-0000`                             | `(00) 0000-0000`   |

- Select with `phoneCountry="BR"` or `mask="phone-br"` (case-insensitive), or globally with
  `behavior.input.phoneCountry: "BR"`. Add countries in `resources.masks.phoneByCountry` and
  `components.editor.placeHolders.phoneByCountry`.
- An array mask is a set of alternatives: the one with the fewest slots that fits the typed
  characters is used (`selectMask`); the state value is unmasked as usual.
- `mask={false}` / `placeholder={false}` always turn the defaults off. `mask=""` /
  `placeholder=""` do the same when `behavior.input.emptyDisablesDefault` is true (Tailwind,
  shadcn and unstyled presets); in Bootstrap an empty string falls back to the default, as in 1.1.0.

### Chips

`Input.Chips` is a multi-select drawn as toggle chips: a `role="group"` labelled by the title,
holding one native checkbox + label per option (checkbox semantics: Tab moves between chips,
Space toggles, disabled options are skipped).

```tsx
<Editor<string[]>
  id="channels"
  title="Code channels"
  type={Input.Chips}
  options={[{ id: "email", description: "E-mail" }, { id: "sms", description: "SMS" }]}
  value={channels}                       // ["email"] — or a separated string ("email,sms")
  onValueChange={setChannels}            // array (ValueType.Array, the default for chips)
  required
/>
<Editor id="flags" type={Input.Chips} valueType={ValueType.String} options={…} formState={f} dispatchFormState={setF} /> // "email,sms"
```

Markup per option: `<span class={item}><input type="checkbox" class={input} id="{id}-chip-{n}"><label
for=… class={chip}>…</label></span>` — the label follows its checkbox, so `peer-checked:` (Tailwind)
and `.btn-check:checked + .btn` (Bootstrap) style the selected chip. Classes
(`components.chips.classes`):

| Preset    | `input`        | `chip`                                                                  |
| --------- | -------------- | ----------------------------------------------------------------------- |
| Bootstrap | `btn-check`    | `btn btn-sm btn-outline-primary rounded-pill`                           |
| Tailwind  | `peer sr-only` | `rounded-full border … peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2` |
| shadcn    | `peer sr-only` | `rounded-full border border-input … peer-checked:bg-primary peer-checked:text-primary-foreground` |
| unstyled  | none           | none (`data-state="checked"` / `"unchecked"` on the label)             |

`chipChecked` / `chipDisabled` are added to selected / disabled chips (handy without `peer`),
`group` / `item` wrap them; per instance: `classNames={{ chipGroup, chip }}`. Without `value` /
state binding the selection is kept internally; `validate()` reads the checked chips.

### Icons

Every icon in the configuration (`resources.icons.*`, `components.table.icons.*`) and every icon
prop (`prependIcon`, `appendIcon`, `showPasswordIcon`, `hidePasswordIcon`, `EditorButton.icon`,
Table sort icons, pagination `customIcons`) accepts:

- a **string** — rendered as `<i className="…"></i>` exactly as before (Font Awesome etc.)
- a **React element** — rendered as-is: `<Mail size={16} />`
- a **React component** — rendered as `<Icon aria-hidden="true" />`: `Mail` (lucide-react, heroicons…)
- `false` — nothing is rendered (Editor icon slots are skipped entirely, no empty wrapper)
- `null` / `undefined` — an empty `<i></i>`, exactly as in 1.1.0

A label tooltip whose icon is `false` gets the accessible `?` trigger described in
[Unstyled + data-attributes](#unstyled--data-attributes).

**TypeScript:** icon keys and props are typed `IconValue` (was `string`). Code that *reads* them
into a `string` needs a cast: `const cls = config.resources.icons.email as string;`
(`getDefaultIcon()` also returns `IconValue`).

```tsx
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

configManager.setConfig({
  resources: {
    icons: { email: Mail, password: Lock, showPassword: Eye, hidePassword: EyeOff },
  },
});

<Editor id="search" hasIcon prependIcon={<Search size={14} />} />
```

### `SmartRProvider`

Scopes a configuration to a React subtree. `config` is deep merged over the parent provider (or
over the global `configManager` config for the outermost provider). Providers can be nested.
Apps that don't use it behave exactly as before.

```tsx
import { SmartRProvider, tailwindPreset } from "smartr-ui";

// Hoisted: created once, not on every render
const compact = { components: { editor: { classes: { input: "…compact…" } } } };

<SmartRProvider config={tailwindPreset}>
  <Admin />
  <SmartRProvider config={compact}>
    <CompactForm />
  </SmartRProvider>
</SmartRProvider>;
```

**Keep `config` stable.** The provider deep-merges `config` over its parent and every consumer
re-renders when the merged value changes, so define the config at module level (or with
`useMemo`). An inline literal still works: when its content is structurally equal to the previous
render's, the previous merged configuration is reused. Functions (`mergeClasses`, `translate`,
`grid.column`, render slots, icon components) are compared **by reference**, though — an inline
arrow function creates a new configuration (and re-renders every Editor/Table below) on each render.

Precedence (lowest → highest): built-in defaults → `window.SmartRConfig` /
`configManager.setConfig` → outer provider → inner provider → component props.
`useSmartConfig()` returns the effective configuration.

### Render slots (custom controls)

Replace the rendered native control while keeping the Editor's label, validation, masks,
state binding, icons and grid — per instance with `render`, or globally with `config.render`:

```tsx
import { cn } from "@/lib/utils"; // any class joiner
import type { SmartRControlProps, SmartRControlPropsWithRef } from "smartr-ui";

// React 16.8 – 19: forwardRef (every prop stays typed)
const MyInput = React.forwardRef<HTMLInputElement, SmartRControlProps>(function MyInput(
  { invalid, className, options, noneOption, multiple, ...props }, // strip the non-DOM props
  ref
) {
  return <input ref={ref} {...props} className={cn(className, invalid && "ring-red-500")} />;
});

// React 19: `ref` is a regular prop
function MyInput19({ ref, invalid, className, options, noneOption, multiple, ...props }: SmartRControlPropsWithRef<HTMLInputElement>) {
  return <input ref={ref} {...props} className={cn(className, invalid && "ring-red-500")} />;
}

<Editor id="name" title="Name" render={{ input: MyInput }} />

// globally
configManager.setConfig({ render: { input: MyInput, select: MySelect, textarea: MyTextarea, checkbox: MyCheckbox } });
```

| Slot       | Used for                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `input`    | every `<input>` rendered by the Editor (text, email, phone, money, date…) |
| `select`   | the native `<select>` (`Input.Select` without filter/multiple/grouping)  |
| `textarea` | `Input.LongText`                                                         |
| `checkbox` | `Input.CheckBox`                                                         |

Hidden inputs, radios, files, the filterable/multiple select and the async select are not
replaced. **Props contract** (`SmartRControlProps`) passed to the custom component:

| Prop                                    | Notes                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `ref`                                   | **Must** be forwarded to the native element (or an object exposing `value` / `checked` / `files`): the Editor reads the value from it on validation. Use `forwardRef` (React ≤ 18) or the `ref` prop (React 19). |
| `id`, `name`, `type`                    | `type` is the native type (`text`, `email`, `tel`, `checkbox`…); absent for select/textarea |
| `value` / `checked`                     | current (masked) value; `checked` for checkboxes                            |
| `onChange(event)`                       | call with the change event (or `{ target: { name, value, checked, files } }`; `name` defaults to the Editor's). **Checkbox slot:** may also be called with a boolean, or with `{ target: { checked } }` (no `type` needed) |
| `onBlur(event)`                         | call with the blur event (validation on blur)                               |
| `onKeyDown`, `onPaste`                  | input filters for `TextInput` modes (may be absent)                         |
| `disabled`, `readOnly`, `required`      | booleans                                                                    |
| `invalid`, `aria-invalid`               | validation state                                                            |
| `className`                             | configured + per-instance classes, already merged                           |
| `placeholder`, `style`, `children`      | `children` holds `<option>`s for a select                                   |
| `data-*`, `min`, `max`, `maxLength`, `rows`, … | every other computed native attribute                              |

| `options`, `multiple`, `noneOption`     | **select slot only**, see below                                             |
| `aria-describedby`                      | ids of the note / messages (ARIA mode)                                      |

Strip `invalid` (and, for the select slot, `options`/`multiple`/`noneOption`) before spreading
onto a DOM element — they are not DOM attributes (`required` is a valid one).

**Typing.** `SmartRControlProps` extends the input HTML attributes and has no string index
signature (only `data-*` keys), so `React.forwardRef<HTMLInputElement, SmartRControlProps>` keeps
every prop typed (an index signature made `forwardRef`'s `PropsWithoutRef` drop all named props).
For React 19 components that take `ref` as a prop use `SmartRControlPropsWithRef<T>`. Both
patterns are compiled in `test/types/slots.tsx`.

**Select slot data.** Besides the `<option>` children, the select slot receives the options as data,
so adapters (e.g. Radix) don't have to parse children:

```ts
options: SmartRSelectOption[]  // display order, including the "none selected" option
// { value, label, disabled?, group?, tooltip?, none?: true, source? }
multiple: false                // multiple selects use the built-in dropdown
noneOption: { value, label } | null  // null with optionsFirstSelected
```

`value` is the configured option value (not stringified); the none option's value is
`optionsNoneSelectedValue` (`""` by default). **Radix/shadcn `<SelectItem>` forbids `""`**, so map it to a
sentinel:

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";
const toRadix = (v: unknown) => (v == null || v === "" ? NONE : String(v));
const fromRadix = (v: string) => (v === NONE ? "" : v);

export const ShadcnSelect = React.forwardRef<{ value: string }, SmartRControlProps>(function ShadcnSelect(
  { id, name, value, onChange, onBlur, disabled, className, options = [], noneOption,
    placeholder, invalid, required, children, multiple, ...aria },
  ref
) {
  const current = value == null ? "" : String(value);
  const latest = React.useRef(current);
  latest.current = current;
  // the Editor reads `.value` from the ref when validating
  React.useImperativeHandle(ref, () => ({ value: current }), [current]);
  return (
    <Select
      value={toRadix(current)}
      disabled={disabled}
      onValueChange={(next) => {
        latest.current = fromRadix(next);
        onChange?.({ target: { name, value: latest.current } });
      }}
      onOpenChange={(open) => !open && onBlur?.({ target: { name, value: latest.current } })}
    >
      <SelectTrigger id={id} className={className} aria-invalid={invalid || undefined}
        aria-describedby={aria["aria-describedby"]}>
        <SelectValue placeholder={placeholder ?? noneOption?.label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={toRadix(o.value)} value={toRadix(o.value)} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
```

**Non-native checkboxes** (Radix / shadcn `Checkbox`, which render a `<button role="checkbox">` and
report `onCheckedChange(boolean)`) are supported: pass `onChange` as `onCheckedChange` and forward
the ref. On validation the Editor reads the state from `ref.current.checked` when the ref exposes
it, otherwise from the element's `aria-checked`, otherwise from the last value reported through
`onChange`. Native `<input type="checkbox">` controls behave exactly as before.

```tsx
import { Checkbox } from "@/components/ui/checkbox"; // shadcn/ui

const MyCheckbox = React.forwardRef<HTMLButtonElement, SmartRControlProps>(
  ({ id, checked, onChange, onBlur, disabled, invalid }, ref) => (
    <Checkbox
      ref={ref}
      id={id}
      checked={!!checked}
      onCheckedChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid || undefined}
    />
  )
);

<Editor id="terms" type={Input.CheckBox} checkBoxText="I agree" required render={{ checkbox: MyCheckbox }} />
```

### Translation

Plug any i18n library through `translate(key, fallback, params?)`. It is used for every built-in
text and validation message; without it the configured texts are used (1.1.0 behavior).

```tsx
import i18n from "i18next";

configManager.setConfig({
  translate: (key, fallback, params) => i18n.t(key, { defaultValue: fallback }),
});
```

- `key` is the text's **configuration path**: `resources.validationMessages.required`,
  `components.table.texts.showing`, `components.select.texts.loadingText`,
  `resources.fileTexts.deleteTooltip`, `behavior.file.filePlaceholderText`, …
- The short keys are kept as **aliases**: when the path key returns nothing, the key itself or the
  fallback, `translate` is called again with the alias (`validation.required`,
  `table.texts.showing`, `select.texts.loadingText`, `file.texts.deleteTooltip`,
  `file.placeholder`), so dictionaries keyed either way work.
- The full list is exported: `smartrTranslationKeys` (`{ key, alias, defaultText, params }[]`),
  `defaultTexts` (flat `{ [key]: text }`), `defaultTextsTree` (nested, e.g. for i18next JSON),
  `translationKeyAliases` and `getTranslationKeys(config)` (the texts of a given configuration).

```ts
import { defaultTextsTree } from "smartr-ui";
fs.writeFileSync("locales/en/smartr.json", JSON.stringify(defaultTextsTree, null, 2));
```
- `fallback` is the configured text, possibly with `%s1`, `%s2` placeholders; `params` holds
  their values. Return either the final text or a template — placeholders are replaced afterwards.
- Table group texts (`groupHeaderCountFormat`, `groupFooterText`, `cardGroupCountFormat`,
  `cardGroupFooterText`) accept `{count}` / `{label}` / `{plural}`, positional `{0}`, `{1}`, `{2}`
  and `%s1`, `%s2`, `%s3`; `translate` receives `params = [count, label, plural]` (`label` is the
  translated `groupCountSingular` / `groupCountPlural`). The Tailwind / shadcn / unstyled presets
  and `defaultTexts` use English card-view texts (`" ({count} {label})"`,
  `"Group total: {count} records"`); the Bootstrap preset keeps the 1.1.0 ones.
- Returning `undefined`, `null` or `""` (a missing translation) uses `fallback` (with its
  placeholders replaced), so nothing renders as `"undefined"`.
- Texts passed through props (`invalidMessage`, `requiredMessage`, `placeholder`, `noRecordMessage`…)
  are used as-is.

### Configuration reference (new keys)

```ts
{
  grid: { row: string; column: (size, screen?) => string | null; columnDefault?: string },
  mergeClasses?: (...classes: string[]) => string,
  translate?: (key: string, fallback: string, params?: any[]) => string,
  render?: { input?, select?, textarea?, checkbox? },
  validators?: { required?, email?, phone?, url? },   // (value, context) => true | false | "message", or false
  behavior: {
    validation: { validateMode?: "blur" | "change" | "submit" | "afterSubmit",
      emailRule: "legacy" | "unicode",              // "legacy" in Bootstrap
      includeExternalErrors: boolean, … },           // `errors` in validate() results (true)
    input: { emptyDisablesDefault: boolean,         // mask="" / placeholder="" opt out (false in Bootstrap)
      phoneCountry?: string, … },                    // "US" | "BR" | "BR-MOBILE" | "BR-LANDLINE" | …
    emitDataAttributes: boolean,  // state data-attributes (false in Bootstrap)
    hideEmptyIcons: boolean,      // skip icon slots whose icon is "", null or undefined (false in Bootstrap)
    instanceClassesLast: boolean, // instance classes after config classes (false in Bootstrap)
    accessibility: { aria: boolean }, // ids / roles / aria-describedby (false in Bootstrap)
    …
  },
  tags: { noteTag: string, … },   // "label" in Bootstrap, "p" in the other presets
  components: {
    table: { classes: { container, responsiveWrapper, table, tableHover, thead, headerFilter,
      headerCheckbox, cellCheckbox, emptyMessage, emptyMessageCard, alignStart, alignCenter,
      alignEnd, rowFooter, rowFooterCell, detailRow, detailRowFooter, detailRowFooterCell,
      groupHeader, groupLevelPrefix, groupClickable, groupExpanded, groupCollapsed,
      groupHeaderContent, groupHeaderRow, groupHeaderCell, groupFooter, groupFooterRow,
      groupFooterCell, cardList, card, groupHeaderCard, groupFooterCard, cardField, cardLabel,
      cardValue, cardValueFull, cardRowFooter, cardDetails, detailCard, cardRowDetailFooter, … },
      icons: { groupExpanded, groupCollapsed, … },
      texts: { cardGroupCountFormat, cardGroupFooterText, … } },
    select: { classes: { open, … } },
    // resources.fileTexts: { uploadLabel, deleteLabel, downloadLabel, … }
    editor: { classes: { controlGroupInvalid, select, textarea, file, // per-control classes
      // (undefined: falls back to `input`, as in 1.1.0)
      switchRow, switchText, … } },
    checkbox: { classes: { switchGroup, switch, switchThumb, … } }, // layout="switch"
    chips: { classes: { group, item, input, chip, chipChecked, chipDisabled } }, // Input.Chips
    validation: { classes: { messageError, messageSuccess, messageWarning, formMessage } },
    tooltip: { classes: { trigger, … } },  // accessible "?" trigger when the tooltip icon is false
    alert: { classes: { textCenter, textLeft, textRight, … } },
    // components.editor.placeHolders.phoneByCountry: { US, BR, "BR-MOBILE", "BR-LANDLINE" }
  },
  // resources.masks.phoneByCountry: { US: "(000) 000-0000", BR: ["(00) 0000-0000", "(00) 00000-0000"], … }
  // resources.validationMessages: { phone, url, … }
}
```

The Bootstrap values of all these keys are the class names that were hard-coded in 1.1.0.

---

## Utilities

The package re-exports a set of helpers from `Utils/utils` that are useful when integrating with custom components:

| Helper                     | Purpose                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| `applyMask`                | Apply a mask string to a value (date, money, phone, card, percent…)    |
| `getValueAsType`           | Convert any input value to `Integer` / `Float` / `Boolean` / `Array`   |
| `getValueType`             | Resolve the natural `ValueType` for a given `Input` type               |
| `getDefaultIcon`           | Default icon class name per input type (from current config)           |
| `getDefaultIconPosition`   | Default icon position (start / end) per input type                     |
| `getDefaultHasIcon`        | Whether the input type ships with an icon by default                   |
| `getDateFormatted`         | Format `Date` → `YYYY-MM-DD` for HTML date inputs                      |
| `selectMask` / `maskMaxLength` | Pick the alternative of an array mask for a value / longest pattern  |
| `resolveEditorMask` / `resolveDefaultPlaceholder` | The mask / default placeholder an Editor uses (`mask={false}`, `phoneCountry`…) |
| `isValidEmail`             | The built-in e-mail rule of a configuration (`emailRule`)             |
| `phoneMasks`               | The built-in phone masks per country                                    |

Table-specific helpers are exported from `Table/util` and `Table/timezone`.

---

## TypeScript Support

Full TypeScript definitions included:

```tsx
import {
  EditorPropType,
  TableColumnProps,
  ValidationResult,
  AlertType,
  AlertConfig,
} from "smartr-ui";

// All props are fully typed
const editorProps: EditorPropType = {
  type: Input.Text,
  title: "Name",
  required: true,
};

const alertConfig: Partial<AlertConfig> = {
  textAlign: "center",
  classes: {
    success: "custom-success",
  },
};
```

---

## Theming and Customization

The library supports both light and dark themes and can be customized through CSS variables:

```css
/* Custom theme variables */
:root {
  --bs-primary: #your-color;
  --bs-success: #your-color;
  --bs-warning: #your-color;
  --bs-danger: #your-color;
  --bs-info: #your-color;
}
```

All components respect Bootstrap's theme variables and can be customized to match your design system.

---

## Real-world usage patterns

This library is battle-tested in production applications handling:

* **Complex forms** with dependent fields and conditional logic
* **Data-intensive tables** with sorting, filtering, and pagination
* **File management** with upload, preview, and download capabilities
* **Multi-step workflows** with validation at each stage
* **Multi-language applications** with configurable translations
* **Theme switching** between light and dark modes

---

## Project layout

```
src/
├── Alert/             Alert component & types
├── Chips/             Toggle chips (Input.Chips)
├── CheckboxGroup/     Grouped checkbox control
├── Column/ Row/ Container/   Bootstrap-style grid primitives
├── Editor/            Universal input (the central component)
├── EditorButton/      Prepend/append buttons for input groups
├── EditorInput/       Low-level <input>/<textarea>/<select> renderer
├── File/              File-input UI helper
├── FormMessage/       Form-level messages
├── Label/             Standalone label
├── Loading/           Spinner / loading indicator
├── Radio/             Radio control
├── Select/            Enhanced select with search/group/multi
├── Table/             Data table + pagination + timezone helpers
├── Tooltip/           Tooltip wrapper
├── Utils/             Shared formatting / mask / value helpers
├── config/            configManager + defaultConfig + createConfig
├── context/           SmartRProvider
├── presets/           bootstrap / tailwind / unstyled presets
├── hook/              useSmartConfig
├── ValidationResult.ts
├── index.ts / core.ts / config.ts   Entries: smartr-ui, smartr-ui/core, smartr-ui/config
└── types.ts           Public enums (Input, ColumnSize, ScreenSize…)
```

---

## Build & development

The package is built with Rollup and ships both CommonJS and ESM bundles plus generated `.d.ts` types.

```bash
npm install
npm run dev          # rollup watch mode
npm run build        # production build into dist/
npm run type-check   # tsc --noEmit (sources + the type tests in test/types)
npm run lint         # ESLint 9 flat config (typescript-eslint + react-hooks) over src/
npm run test         # vitest (baseline HTML snapshots + feature tests)
npm run pack         # build + create the local .tgz tarball
```

Installing the repository does not build it (no `prepare` script); `npm publish` builds first
(`prepublishOnly`). A plain `npm pack` packs the current `dist/` — use `npm run pack`. The tarball
contains `dist/`, the `core/`, `config/` and `presets/*` resolution folders, README, CHANGELOG and
LICENSE.

Release scripts (publish to npm):

```bash
npm run release          # publish current version
npm run release:patch    # bump patch + publish
npm run release:minor    # bump minor + publish
npm run release:major    # bump major + publish
```

---

## Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Develop: `npm run dev` (watch mode)
4. Build: `npm run build`
5. Test: `npm run test`

---

## License

MIT © Diego Martins

## Support

For issues and questions, please create an issue on the repository: [https://github.com/DiegoSDeveloper/smartr-ui/issues](https://github.com/DiegoSDeveloper/smartr-ui/issues)
