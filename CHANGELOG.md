# Changelog

## 1.2.0 — 2026-11-18

Framework-agnostic styling (Bootstrap, Tailwind, shadcn/ui, unstyled), form features for
non-Bootstrap apps and a configuration-only entry. **No changes are required in existing
(Bootstrap) apps**: without configuration every component renders exactly the same HTML/classes
as 1.1.0 (guarded by baseline snapshot tests) and all exports, props, enums,
`configManager.setConfig(...)` and `window.SmartRConfig` keep working. New behavior is opt-in
(new props / config keys) or limited to the non-Bootstrap presets. See
[Compatibility notes](#compatibility-notes) and [Upgrade](#upgrade) below.

### Added

- **`smartr-ui/config` entry**: `configManager`, `createConfig`, `SmartRProvider` /
  `SmartRConfigContext` / `useSmartConfig`, every preset, the translation keys and `phoneMasks`,
  without any component code. `smartr-ui`, `smartr-ui/core` and `smartr-ui/config` are built
  together and share chunks: one configuration singleton and one React context. Measured with
  esbuild (minified, React external), `import { configManager, SmartRProvider }`: 15.7 kB from
  `smartr-ui` (pre-release build) / 20.6 kB + 10.7 kB lazy from `smartr-ui/core` → **13.0 kB from
  `smartr-ui/config`** (no Editor/Table code). Also resolvable through `config/package.json` for
  tools that ignore `exports`.
- **Phone masks per country and per-instance opt-out**: `mask={false}` turns the global phone
  mask off for one Editor and `placeholder={false}` the default placeholder (`mask=""` /
  `placeholder=""` do the same in the non-Bootstrap presets, `behavior.input.emptyDisablesDefault`).
  Country presets: `phoneCountry="BR"` (or `mask="phone-br"`), `"BR-MOBILE"`, `"BR-LANDLINE"`,
  `"US"`, globally with `behavior.input.phoneCountry`; `BR` switches from `(00) 0000-0000` to
  `(00) 00000-0000` at the 11th digit. Masks may be alternatives (`mask={["(00) 0000-0000",
  "(00) 00000-0000"]}`). New config: `resources.masks.phoneByCountry`,
  `components.editor.placeHolders.phoneByCountry`; exports `phoneMasks`, `selectMask`,
  `maskMaxLength`, `resolveEditorMask`, `resolveDefaultPlaceholder`, type `MaskValue`. The
  Bootstrap default (US mask and placeholder) is unchanged.
- **Pluggable validators**: `config.validators` and the per-Editor `validators` prop
  (`required`, `email`, `phone`, `url`): `(value, { type, id, name, title, config }) =>
  true | false | "message"`; `false` instead of a function turns a rule off. New messages
  `resources.validationMessages.phone` / `url`. Built-in e-mail rule: `behavior.validation.emailRule`
  — `"legacy"` (Bootstrap, the exact 1.1.0 regex) or `"unicode"` (other presets: trimmed, IDN /
  unicode / punycode domains); `isValidEmail(value, config)` export.
- **Validation modes**: `validateMode` prop and `behavior.validation.validateMode`: `"blur"`,
  `"change"`, `"submit"`, `"afterSubmit"` (silent until the first `validate()` / Container
  submit, then live on change and blur). Unset (default) keeps the 1.1.0 `validateOnBlur` /
  `validateOnChange` behavior; explicit `validateOnBlur` / `validateOnChange` props win.
  `ContainerRef.isSubmitted()` / `resetValidation()`, `EditorRef.resetValidation?()`.
- **`FormMessage`**: form-level messages (no owning field) with `role="alert"` (errors) /
  `"status"`, an optional `id` for `aria-describedby`, `messages` list, `type`, preset classes
  (`components.validation.classes.message*` + new `formMessage`). An Editor's own
  `aria-describedby` is now kept (merged first) in ARIA mode.
- **`Input.Chips`**: multi-select as toggle chips — a `role="group"` (labelled by the title) of
  native checkboxes (keyboard: Tab / Space), value as an array (`ValueType.Array`, default) or a
  separated string (`ValueType.String`), `formState` binding, uncontrolled use, required
  validation, disabled options. Classes `components.chips.classes` (`group`, `item`, `input`,
  `chip`, `chipChecked`, `chipDisabled`) for Bootstrap (`btn-check` + `btn-outline-primary`),
  Tailwind, shadcn (`peer-checked:` tokens) and unstyled; `classNames.chipGroup` / `chip`.
  `Chips` component exported.
- **Switch layout slots per instance**: `classNames.switchRow`, `switchText`, `switchGroup`,
  `switchThumb`; `checkbox.classes.switchThumb` (a sibling `<span aria-hidden>` thumb).
- **External `errors` in `validate()`**: `validate()` (Editor and Container) returns one
  `ValidationResult` (type Error, message = text of the node) per `errors` entry, after the
  Editor's own results; they are not added to the rendered list (already shown).
  `behavior.validation.includeExternalErrors: false` restores the draft behavior.
- **Typed render slots**: `SmartRControlProps` has no string index signature any more (only
  `data-*`) and extends the input HTML attributes, so `React.forwardRef<HTMLInputElement,
  SmartRControlProps>` keeps every prop typed; `SmartRControlPropsWithRef<T>` for React 19
  `ref`-as-prop components. Type tests in `test/types` (`npm run type-check`).
- Table group texts accept `{count}` / `{label}` / `{plural}`, positional `{0}`, `{1}` and
  `%s1`, `%s2`; `translate` receives the params (`[count, label, plural]`).
- ESLint 9 (flat config) with `@typescript-eslint` and `eslint-plugin-react-hooks`
  (`npm run lint`).

- **`shadcnPreset`** (theme-token Tailwind preset): every color is a shadcn/ui CSS-variable token
  (`bg-background`, `text-foreground`, `border-input`, `ring-ring`, `ring-offset-background`,
  `text-muted-foreground`, `text-destructive`, `bg-popover text-popover-foreground`,
  `bg-accent text-accent-foreground`, `bg-primary`…), controls match shadcn's
  `Input`/`Textarea`/`SelectTrigger`/`Label`/`Checkbox` (`h-10`, `rounded-md`, `text-base md:text-sm`),
  so dark mode works with zero overrides. Editor icons are `false`. Also published as
  `smartr-ui/presets/shadcn` (same exports/resolution as `presets/tailwind`; exports
  `shadcnPreset`, `shadcnSafelist`, `tailwindGridColumns`, `tailwindColumnClass`; no Bootstrap
  classes in the bundle).
- **Class precedence**: `behavior.instanceClassesLast` (on in the Tailwind/shadcn/unstyled presets,
  implied by `mergeClasses`) puts instance `className`s after the configured classes in `Row`,
  `Column`, `Editor` (input and `Input.Label`), `Tooltip` and `Table`, so `twMerge` lets the
  instance win (`<Row className="gap-x-3">` over the preset `gap-x-4`). Bootstrap without a merger
  keeps the 1.1.0 order.
- **`errors` prop** on `Editor` (`ReactNode | ReactNode[] | null`): external (server /
  cross-field) messages that make the Editor invalid and render as error messages (also returned
  by `validate()`, see above).
- **ARIA wiring** (`behavior.accessibility.aria`; on in the non-Bootstrap presets, opt-in for
  Bootstrap): note `id`, message `id` + `role="alert"`/`"status"`, `aria-describedby` on the control
  (also passed to render-slot controls), generated ids for Editors without `id`/`name`; File
  upload/delete/download controls get `role="button"`, `tabIndex`, `aria-label` and Enter/Space.
- **Select slot data**: the `select` render slot receives `options: SmartRSelectOption[]`
  (`{ value, label, disabled?, group?, tooltip?, none?, source? }`, including the none option),
  `multiple: false` and `noneOption` (`{ value, label }` or `null`). New type `SmartRSelectOption`.
- **Per-control classes**: `editor.classes.select`, `editor.classes.textarea`, `editor.classes.file`
  (fall back to `editor.classes.input` when undefined, as in Bootstrap) and
  `checkbox.classes.switch` / `switchGroup`.
- **`layout="switch"`** on `Editor`: title (or `checkBoxText`) + note on the left, the control on the
  right (`editor.classes.switchRow` / `switchText`).
- `title`, `note` and `checkBoxText` accept React nodes (strings render as before; `getTitle()` and
  validation results get the node's text). `tags.noteTag` (`label` in Bootstrap, `p` elsewhere).
- **Typed values**: `Editor<TValue>` (never inferred, `any` by default) and
  `onValueChange(value, event)`. `EditorPropType<TValue>`, `EditorComponent`, `EditorLayout` types;
  `createEditor(controls)` factory.
- **`smartr-ui/core`** entry: everything but `Table`, with an `Editor` that lazy-loads the async
  select and the file control. Main and core share chunks (one configuration / context).
- **Translation keys export**: `smartrTranslationKeys`, `defaultTexts`, `defaultTextsTree`,
  `translationKeyAliases`, `getTranslationKeys(config)`, `translationKeyPath(key)`.
- `resources.fileTexts.uploadLabel` / `deleteLabel` / `downloadLabel`;
  `components.tooltip.classes.trigger` (class of the accessible `?` tooltip trigger).
- **Presets**: `bootstrapPreset` (the default, same object as `defaultConfig`), `tailwindPreset`
  and `unstyledPreset`, plus `createConfig(preset, overrides?)` and `configManager.setPreset(...)`.
  The Tailwind preset is also published as a separate entry: `smartr-ui/presets/tailwind`
  (exports `tailwindPreset`, `tailwindSafelist`, `tailwindGridColumns`, `tailwindColumnClass`).
- **Configurable grid**: `config.grid = { row, column(size, screen?), columnDefault }` drives
  `Row`, `Column`, horizontal labels and Editor columns (Bootstrap: `row` / `col-*`;
  Tailwind: `grid grid-cols-12 …` / `col-span-*`, `sm:` … `2xl:`).
- **No more hard-coded classes**: Table (`table table-bordered`, `table-hover`,
  `table-light table-nowrap`, `table-responsive react-table`, `header-checkbox text-center`,
  `alert alert-info text-center`, `text-start/center/end`, `d-flex align-items-center`,
  card view classes, grouping classes…), Select/AsyncSelect (`open`), Alert (`text-*`)
  moved to `components.<name>.classes` with the 1.1.0 values as Bootstrap defaults.
  Group toggle icons moved to `components.table.icons.groupExpanded/groupCollapsed`.
- **Pluggable class merging**: `config.mergeClasses` (e.g. `twMerge` from `tailwind-merge`,
  not a dependency). Default: plain concatenation, as before.
- **Per-instance `classNames`** slots on `Editor` (`column`, `group`, `label`, `input`,
  `inputGroup`, `icon`, `note`, `error`, `check`, `checkLabel`, `tooltip`), `Table`
  (`container`, `wrapper`, `table`, `thead`, `empty`, `cardList`, `card`) and `Loading`
  (`container`, `spinner`, `text`), merged after the configured classes.
- **React icons**: every configured icon and icon prop accepts a class string (unchanged
  `<i className>` output), a React element or a React component (lucide, heroicons…);
  `false` renders nothing (Editor icon slots are skipped). An explicit `null` keeps the 1.1.0
  output (an empty `<i></i>`).
- `behavior.hideEmptyIcons` (false in Bootstrap, true in the Tailwind/unstyled presets): skips
  Editor icon slots whose icon is empty, so no empty `<div><span></span></div>` wrappers.
- Unstyled preset / `icons.tooltip: false`: label tooltips get a minimal accessible trigger
  (`<button type="button" aria-label="…" data-smartr-tooltip-trigger>?</button>`, opens on
  hover/focus, `role="tooltip"` + `aria-describedby`, Escape closes).
- Package `exports` map: `smartr-ui/presets/tailwind` now works in native Node ESM
  (`dist/presets/tailwind.mjs`) and TypeScript `node16`/`nodenext` (`tailwind.d.mts`), besides
  CommonJS, bundlers and TypeScript `node`/`bundler`. The root entry is unchanged for CJS
  (`require`), bundlers (`module`), Jest/Vitest and TypeScript; `./package.json` and `./dist/*`
  are exported too (deep imports keep working). The nested `presets/tailwind/package.json`
  fallback is kept for tools that ignore `exports`.
- **`SmartRProvider`** (React context) with a `config` prop merged over the parent provider or
  the global configuration; nested providers supported. `useSmartConfig()` reads the nearest
  provider and falls back to `configManager.getConfig()` (including `window.SmartRConfig`).
- **Render slots**: `<Editor render={{ input, select, textarea, checkbox }} />` and global
  `config.render` replace the native control while keeping label, validation, masks, state
  binding, icons and grid. Props contract: `SmartRControlProps`.
- **`config.translate(key, fallback, params?)`** used for all built-in texts and validation
  messages.
- **State data-attributes** (`data-invalid`, `data-disabled`, `data-required`, `data-size`,
  `data-state`) when `behavior.emitDataAttributes` is true (Tailwind/unstyled presets; off in
  the Bootstrap preset so the markup is unchanged).
- Optional `config` parameter on `getDefaultIcon`, `getDefaultIconPosition`,
  `getEditorAttributes` and `validateEditorInputValue` (defaults to the global config).
- `renderIcon` helper export; new types: `IconValue`, `SmartRGridConfig`, `GridColumnClassFn`,
  `MergeClassesFn`, `TranslateFn`, `SmartRControlProps`, `SmartRControlComponent`,
  `SmartRRenderSlots`, `EditorClassNames`, `TableClassNames`, `LoadingClassNames`,
  `SmartRProviderProps`.
- Test suite (`npm test`, Vitest + Testing Library): baseline HTML snapshots of 1.1.0 and
  feature tests.

### Changed

- `translate` is called with the text's configuration path first
  (`resources.validationMessages.required`, `components.select.texts.loadingText`,
  `behavior.file.filePlaceholderText`…) and, when that yields nothing / the key / the fallback, with
  the previous short key (`validation.required`, `select.texts.loadingText`, `file.placeholder`…),
  which keeps working as an alias.
- `Editor`'s `invalid` prop is re-synced when the parent changes it after mount (it was only read on
  mount).
- Editor event handlers always use the latest props (stable handlers instead of `useCallback` with
  incomplete dependency lists: `type`, `valueType`, `id`, masks, separators, custom validations…).
- Tailwind / unstyled presets: ARIA wiring and `instanceClassesLast` on, note rendered as `<p>`;
  the Tailwind preset's tooltip trigger is styled.
- `"sideEffects": ["*.css", "*.scss"]` in `package.json`; the main build is split into
  `dist/index.*`, `dist/core.*`, `dist/config.*` and shared chunks (`dist/chunks/*`); presets,
  contexts and the translation tables are annotated `/*#__PURE__*/` so unused ones are dropped.
  A text/select/checkbox form (esbuild, minified, React external): 1.1.0 71.9 kB; 1.2.0 73.7 kB
  from `smartr-ui` (the Editor now also carries chips, validators and validation modes) and
  62.6 kB (+10.8 kB lazy) from `smartr-ui/core`.
- Unstyled/shadcn: File buttons render their label as text when the icon is `false`.
- React 19 readiness: `Tooltip` reads the child ref from `props.ref` on React 19 (no
  `element.ref` deprecation warning); `EditorButton` no longer passes an empty object as ref
  (it triggered a React warning; the rendered HTML is identical). Dev typings moved to
  `@types/react@19` / TypeScript 5.6; the sources type-check against both React 18 and 19
  typings. Peer dependency range is unchanged (`react >=16.8.0`).
- `DeepPartial` / `PartialSmartRConfig` keep functions and components as leaves (needed for
  `grid.column`, `mergeClasses`, `translate`, `render`, icon components).
- **TypeScript (type-level change):** icon-related types widened from `string` to `IconValue`
  (`string | ReactNode | ComponentType`): `resources.icons.*`, `components.table.icons.*`,
  `EditorPropType.prependIcon/appendIcon/showPasswordIcon/hidePasswordIcon`,
  `editorButtonPropTypes.icon`, Table sort icons, pagination `customIcons`, and the return type
  of `getDefaultIcon()` (was `string`). Passing strings works as before; code that *reads* these
  values into a `string` no longer compiles and needs a cast, e.g.
  `const cls = getDefaultIcon(Input.Email) as string;` or
  `const cls = config.resources.icons.email as string;`
  (or narrow it: `typeof icon === "string" ? icon : ""`). Runtime behavior is unchanged.
- Render slots: the checkbox slot accepts non-native controls (Radix/shadcn `Checkbox`):
  `onChange` may be called with a boolean or `{ target: { checked } }`, and the value is read
  duck-typed from the ref (`checked`, then `aria-checked`, then the last reported value).
  Custom controls may omit `name` (the Editor's name is used) and call `onBlur()` without an
  event. Native inputs behave exactly as before.
- `config.translate` returning `undefined`/`null`/`""` now falls back to the configured text
  (with params applied) instead of rendering `"undefined"`/an empty message; validation
  messages with no `Message` render as empty text instead of `"undefined"`.
- `SmartRProvider` reuses the previous merged configuration when `config` is a new object with
  the same content (structural comparison; functions/components by reference), so inline
  config literals no longer re-render every consumer.
- Horizontal Editor: under grids with a `grid.columnDefault` (Tailwind `col-span-12`) the note
  and validation messages (direct row children) get that class, so they span the full row.
  Bootstrap output unchanged.
- Tailwind preset: requires Tailwind ≥ 3.2 or v4 (`min-w-8`, a 3.4 utility, replaced by
  `min-w-[2rem]`); the invalid state uses important utilities
  (`!border-red-500 focus:!border-red-500 focus:!ring-red-500/20`) so it wins without
  tailwind-merge; when both `size` and `xs` are set, `xs` wins (a single `col-span-N`);
  `hideEmptyIcons` on. `dist/presets/tailwind.*` no longer bundles the Bootstrap default
  configuration (shared behavior/texts moved to `config/sharedConfig`), so scanning it with
  Tailwind generates no stray utilities.
- `configManager` merge no longer deep-merges React elements or class instances (they are
  replaced). JSON configurations merge exactly as before.
- shadcn preset: the native switch (`layout="switch"`) draws its thumb with a sibling `<span>`
  (`checkbox.classes.switchThumb`, `peer-checked:translate-x-5`) instead of `::before` on an
  `appearance-none` input, so it renders in every evergreen browser including Firefox.
- Tailwind / shadcn / unstyled presets (and the translation keys): English card-view group texts
  (`" ({count} {label})"`, `"Group total: {count} records"`). Bootstrap keeps the 1.1.0 texts
  (`" ({count} registro{plural})"`, `"Total do grupo: {count} registros"`) so its markup is
  unchanged — set `components.table.texts` (or `translate`) to change them.
- ARIA mode: the `Input.File` text box gets `aria-describedby` (and `aria-invalid`).
- Editors registered in a `Container` always run their latest props in `validate()` (the
  registered instance used to keep the props of the render that registered it until one of a
  few props changed).
- `Select`: the custom-dropdown hooks are declared before the native-select early return (stable
  hook order when a select switches between native and custom); no markup change.
- Build: `rollup.config.mjs` (no `MODULE_TYPELESS_PACKAGE_JSON` warning); `dist/` is emptied
  before each build; `prepare` / `prepublish` scripts removed (installing the repository no
  longer builds; `prepublishOnly` builds before `npm publish`, `npm run pack` builds and packs).
  The tarball contains `dist`, `core`, `config`, `presets`, README, CHANGELOG and LICENSE.
- Code clean-up reported by ESLint (unused variables, `prefer-const`, `hasOwnProperty` calls),
  without behavior changes.

### Compatibility notes

All of these are type-level or opt-in; Bootstrap apps without configuration render and behave as
in 1.1.0.

- **Icons are `IconValue`** (`string | ReactNode | ComponentType`) instead of `string` in the
  configuration (`resources.icons.*`, `components.table.icons.*`), the icon props and the return
  type of `getDefaultIcon()`. Code that reads them into a `string` needs a cast
  (`config.resources.icons.email as string`).
- **Explicit `null` icons** keep the 1.1.0 output (an empty `<i></i>`); `false` renders nothing
  (Editor icon slots are skipped).
- **`classNames`, `render`, `errors`, `layout`, `validators`, `validateMode`, `phoneCountry`
  are Editor props now** and are consumed: in 1.1.0 unknown props were spread onto the native
  `<input>`, so an app that passed one of these names to reach the DOM must rename it.
- **`translate` keys are configuration paths** (`resources.validationMessages.required`…); the
  short keys used earlier in the release cycle (`validation.required`…) are still tried as aliases.
- **Deep imports**: the `exports` map exposes `.`, `./core`, `./config`, `./presets/tailwind`,
  `./presets/shadcn`, `./package.json`, `./dist/*.js`, `./dist/*.mjs` and `./dist/*` (types +
  CommonJS). Other paths (e.g. `smartr-ui/src/...`) are not resolvable under Node / bundlers that
  honor `exports`.
- `EditorPropType.placeholder` is `string | false` and `mask` is `string | string[] | false`;
  `Input` has a new member (`Chips = 27`) — exhaustive `switch`es over `Input` need a case.
- `ContainerRef` has two new members (`isSubmitted`, `resetValidation`): code that *implements*
  `ContainerRef` itself must add them (refs obtained from `<Container ref>` are unaffected).
- `SmartRControlProps` (new in this release) lost its `[attribute: string]: any` index signature
  during the release cycle: custom controls reading arbitrary props must declare them.

### Upgrade

**Bootstrap apps (the default): nothing to do.** Update the dependency; without configuration
the markup and behavior are those of 1.1.0.

**Tailwind apps**

1. `npm install smartr-ui@^1.2.0` (Tailwind ≥ 3.2 or v4; `tailwind-merge` optional).
2. Configure once, e.g. in your entry: `configManager.setPreset(tailwindPreset, { mergeClasses:
   twMerge })` (from `smartr-ui/config`), or wrap the app in `<SmartRProvider
   config={createConfig(tailwindPreset, …)}>`.
3. Let Tailwind scan the preset: `./node_modules/smartr-ui/dist/presets/tailwind.esm.js` in
   `content` (v3) or `@source` (v4), or use `tailwindSafelist`.
4. Replace the Font Awesome icons with React icons if you don't load Font Awesome
   (`resources.icons`).

**shadcn/ui apps**

1. `npm install smartr-ui@^1.2.0`; the shadcn CSS variables must be present (`npx shadcn init`).
2. In the module that sets up smartr-ui (loaded with the forms, see the README "Recommended setup
   for shadcn apps"): `configManager.setPreset(shadcnPreset, { mergeClasses: cn, translate, render:
   { select: RadixSelect } })`, importing from `smartr-ui/config` / `smartr-ui/core`.
3. Scan `./node_modules/smartr-ui/dist/presets/shadcn.esm.js` (or use `shadcnSafelist`).
4. Drop the workarounds this release makes unnecessary: `resources.masks.phone: ""` /
   `placeHolders.phone: ""` (use `mask={false}` / `placeholder={false}`, or `""`, per Editor),
   `validateOnBlur={false}` + hand-written e-mail checks (use `validateMode="afterSubmit"` and
   `validators`), checkbox `classNames` chip hacks (`Input.Chips`), hand-written `<p
   role="alert">` form errors (`FormMessage`), global `switchRow` overrides for one row
   (`classNames.switchRow`), `SmartRControlProps & { ref }` instead of `forwardRef` (both work).
