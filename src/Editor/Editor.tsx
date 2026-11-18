/**
 * The Editor of the main entry (`smartr-ui`): every control is imported
 * statically and renders synchronously, exactly as in 1.1.0.
 * For a smaller bundle, `smartr-ui/core` exports an Editor that code-splits
 * the async select and the file control (see `EditorLazy.tsx`).
 */
import AsyncSelect from "../Select/AsyncSelect";
import { File } from "../File/File";
import { createEditor } from "./EditorCore";

export { createEditor } from "./EditorCore";
export type { EditorComponent, EditorControls, EditorRef } from "./EditorCore";

export const Editor = /*#__PURE__*/ createEditor({ AsyncSelect, File });
