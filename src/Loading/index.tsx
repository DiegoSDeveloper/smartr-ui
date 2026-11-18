// SmartR/Loading/Loading.tsx
import React from "react";
import { useSmartConfig } from "../hook/useSmartConfig";
import { dataAttrs, legacyClass, translateText, withSlot } from "../Utils/styling";

export interface LoadingClassNames {
  container?: string;
  spinner?: string;
  text?: string;
}

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Per-instance class overrides, merged after the configured classes. */
  classNames?: LoadingClassNames;
}

export const Loading: React.FC<LoadingProps> = ({
  text,
  size = "md",
  className = "",
  classNames: slots = {},
}) => {
  const config = useSmartConfig();
  const loadingText =
    text ||
    translateText(
      config,
      "table.texts.loadingText",
      config.components.table.texts.loadingText
    );
  const classes = config.components.loading.classes;

  const sizeClass =
    classes[`container${size.charAt(0).toUpperCase() + size.slice(1)}`];

  return (
    <div
      className={legacyClass(
        config,
        `${classes.container} ${sizeClass} ${className}`,
        [classes.container, sizeClass, className],
        slots.container
      )}
      {...dataAttrs(config, { size, state: "loading" })}
    >
      <div className={withSlot(config, classes.spinner, slots.spinner)}></div>
      {loadingText && (
        <div className={withSlot(config, classes.text, slots.text)}>
          {loadingText}
        </div>
      )}
    </div>
  );
};
