import React from "react";
import { useSmartConfig } from "../hook/useSmartConfig";
import { cxInstance, dataAttrs } from "../Utils/styling";

export type FormMessageType = "error" | "success" | "warning";

export interface FormMessageProps {
  /**
   * Element id, so the message can be referenced from `aria-describedby`
   * (e.g. `<form aria-describedby="signing-error">` or an Editor's
   * `aria-describedby`).
   */
  id?: string;
  /** The message. */
  children?: React.ReactNode;
  /**
   * Messages as a list (like the Editor `errors` prop). Empty entries
   * (`undefined`, `null`, `false`, `""`) are skipped; when nothing is left the
   * component renders nothing.
   */
  messages?: React.ReactNode | React.ReactNode[] | null;
  /** `"error"` (default, `role="alert"`), `"success"` or `"warning"` (`role="status"`). */
  type?: FormMessageType;
  /** Overrides the role (`"alert"` / `"status"`), or `"none"` for no role. */
  role?: "alert" | "status" | "none";
  /** Instance classes, merged with the configured classes. */
  className?: string;
}

function toList(value: React.ReactNode | React.ReactNode[] | null | undefined) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter((m) => m !== undefined && m !== null && m !== false && m !== "");
}

/**
 * A message that belongs to the form (or a group of fields) rather than to a
 * single Editor: a cross-field rule, a server error. Uses the validation
 * message classes (`components.validation.classes.messageError` /
 * `messageSuccess` / `messageWarning`) plus `components.validation.classes.formMessage`.
 *
 * ```tsx
 * <FormMessage id="channels-error">{problem && t("pick at least one channel")}</FormMessage>
 * ```
 */
export function FormMessage(props: FormMessageProps) {
  const { id, children, messages, type = "error", role, className } = props;
  const config = useSmartConfig();
  const list = toList(messages !== undefined ? messages : children);
  if (list.length === 0) return null;

  const validationClasses = config.components.validation.classes as Record<string, any>;
  const typeClass =
    type === "success"
      ? validationClasses.messageSuccess
      : type === "warning"
      ? validationClasses.messageWarning
      : validationClasses.messageError;
  const resolvedRole = role ?? (type === "error" ? "alert" : "status");

  return React.createElement(
    config.tags.invalidFeedbackTag || "div",
    {
      id,
      role: resolvedRole === "none" ? undefined : resolvedRole,
      className:
        cxInstance(config, className, typeClass, validationClasses.formMessage) || undefined,
      "data-smartr-form-message": "",
      ...dataAttrs(config, { state: type }),
    },
    list.length === 1
      ? list[0]
      : list.map((message, index) => <div key={index}>{message}</div>)
  );
}
