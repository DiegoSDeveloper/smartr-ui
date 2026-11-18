import { ColumnSize } from "../types";
import React from "react";
import { mapToCssModules } from "../Utils/utils";
import { cxInstance, getGridColumnClasses } from "../Utils/styling";
import { useSmartConfig } from "../hook/useSmartConfig";

/**
 * Column definition
 */
interface columnPropTypes {
  tag?: string;
  className?: string;
  xs?: ColumnSize;
  sm?: ColumnSize;
  md?: ColumnSize;
  lg?: ColumnSize;
  xl?: ColumnSize;
  xxl?: ColumnSize;
  size?: ColumnSize;
  children?: React.ReactNode;
}

export const Column = /*#__PURE__*/ React.forwardRef<HTMLElement, columnPropTypes>(
  (props, ref) => {
    const config = useSmartConfig();
    const {
      className,
      xs,
      sm,
      md,
      lg,
      xl,
      xxl,
      size,
      tag = config.tags.columnTag,
      children,
      ...attributes
    } = props;

    // Classes come from `config.grid` (Bootstrap: col-*, Tailwind: col-span-*)
    const colClasses = getGridColumnClasses(config, {
      size,
      xs,
      sm,
      md,
      lg,
      xl,
      xxl,
    });

    const classes = mapToCssModules(cxInstance(config, className, colClasses));

    return React.createElement(
      tag,
      {
        ...attributes,
        className: classes,
        ref,
      },
      children
    );
  }
);
