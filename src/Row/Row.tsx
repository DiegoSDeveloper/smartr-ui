import React from "react";
import { mapToCssModules } from "../Utils/utils";
import { cxInstance } from "../Utils/styling";
import { useSmartConfig } from "../hook/useSmartConfig";

/**
 * Row definition
 */
interface rowPropTypes {
  tag?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Row = /*#__PURE__*/ React.forwardRef<HTMLElement, rowPropTypes>((props, ref) => {
  const config = useSmartConfig();
  const {
    className,
    style,
    tag: Tag = "div",
    children,
    ...attributes
  } = props;

  const classes = mapToCssModules(cxInstance(config, className, config.grid.row));

  return React.createElement(
    Tag,
    {
      ...attributes,
      className: classes,
      style,
      ref,
    },
    children
  );
});
