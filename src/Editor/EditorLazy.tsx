/**
 * Editor of `smartr-ui/core`: same component, but the heavy controls (async
 * select with `loadOptions`, `Input.File`) are loaded on demand with
 * `React.lazy` (bundlers split them into separate chunks), so a form that
 * only uses text/select/checkbox inputs does not download them.
 *
 * While a lazy control loads, `null` is rendered in its place (inside the
 * Editor's label/grid markup); afterwards it behaves exactly like the eager one.
 */
import React, { Suspense } from "react";
import { createEditor } from "./EditorCore";

const LazyAsyncSelect = /*#__PURE__*/ React.lazy(() => import("../Select/AsyncSelect"));
const LazyFile = /*#__PURE__*/ React.lazy(() =>
  import("../File/File").then((module) => ({ default: module.File }))
);

function AsyncSelectOnDemand(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyAsyncSelect {...props} />
    </Suspense>
  );
}

function FileOnDemand(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyFile {...props} />
    </Suspense>
  );
}

export const Editor = /*#__PURE__*/ createEditor({
  AsyncSelect: AsyncSelectOnDemand,
  File: FileOnDemand,
});
