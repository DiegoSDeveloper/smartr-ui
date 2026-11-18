import React, { ReactNode, forwardRef, useImperativeHandle } from "react";
import type { EditorRef } from "../Editor/EditorCore";
import { ValidationResult } from "../ValidationResult";
import ContainerContext, { useContainer } from "./ContainerContext";

export interface ContainerProps {
  children?: ReactNode;
}

export interface ContainerRef {
  /**
   * Validates every registered Editor (marks the Container as submitted:
   * Editors with `validateMode="afterSubmit"` start validating live).
   * Results include the Editors' external `errors`
   * (`behavior.validation.includeExternalErrors`).
   */
  validate: () => Promise<ValidationResult[]>;
  getEditors: () => EditorRef[];
  /** True after the first `validate()` (until `resetValidation()`). */
  isSubmitted: () => boolean;
  /** Clears every Editor's validation messages and the submitted state. */
  resetValidation: () => void;
}

export const Container = /*#__PURE__*/ forwardRef<ContainerRef, ContainerProps>(
  (props, ref) => {
    const { contextValue, getEditors, isSubmitted, setSubmitted } = useContainer();

    async function validate(): Promise<ValidationResult[]> {
      setSubmitted(true);
      const editors = getEditors();

      const validationPromises = editors.map(async (ref) => {
        return await ref.validate();
      });

      const validationResults = await Promise.all(validationPromises);
      const list = validationResults.flat();
      return list;
    }

    function resetValidation() {
      setSubmitted(false);
      getEditors().forEach((editor) => editor.resetValidation?.());
    }

    useImperativeHandle(ref, () => ({
      validate,
      getEditors,
      isSubmitted,
      resetValidation,
    }));

    return (
      <ContainerContext.Provider value={contextValue}>
        {props.children}
      </ContainerContext.Provider>
    );
  }
);
