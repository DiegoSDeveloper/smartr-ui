import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import type { EditorRef } from "../Editor/EditorCore";

interface ContainerContextType {
  registerEditor: (editor: EditorRef) => void;
  unregisterEditor: (editor: EditorRef) => void;
  /**
   * Whether the Container has been validated (submitted) at least once since
   * the last `resetValidation()`. Drives `validateMode="afterSubmit"`.
   */
  isSubmitted?: () => boolean;
}

const ContainerContext = /*#__PURE__*/ createContext<ContainerContextType>({
  registerEditor: () => {},
  unregisterEditor: () => {},
  isSubmitted: () => false,
});

export const useContainerContext = () => useContext(ContainerContext);

export const useContainer = () => {
  const editorsRef = useRef<EditorRef[]>([]);
  // A ref (not state): marking the Container as submitted does not re-render
  // it; the Editors learn it through their own validate() call.
  const submittedRef = useRef(false);

  const registerEditor = useCallback((editor: EditorRef) => {
    const editorId = editor.getId();

    const alreadyExists = editorsRef.current.some(
      (existingEditor) => existingEditor.getId() === editorId
    );

    if (!alreadyExists) {
      editorsRef.current.push(editor);
    }
  }, []);

  const unregisterEditor = useCallback((editor: EditorRef) => {
    const editorId = editor.getId();

    editorsRef.current = editorsRef.current.filter(
      (e) => e.getId() !== editorId
    );
  }, []);

  const getEditors = useCallback((): EditorRef[] => {
    return [...editorsRef.current];
  }, []);

  const isSubmitted = useCallback(() => submittedRef.current, []);
  const setSubmitted = useCallback((submitted: boolean) => {
    submittedRef.current = submitted;
  }, []);

  const contextValue = useMemo(
    () => ({ registerEditor, unregisterEditor, isSubmitted }),
    [registerEditor, unregisterEditor, isSubmitted]
  );

  return {
    registerEditor,
    unregisterEditor,
    getEditors,
    isSubmitted,
    setSubmitted,
    contextValue,
  };
};
export default ContainerContext;
