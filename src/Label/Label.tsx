import React from "react";
import { mapToCssModules } from "../Utils/utils";
import {
  cx,
  dataAttrs,
  getGridColumnClasses,
  renderIcon,
  shouldRenderIconSlot,
} from "../Utils/styling";

import { ColumnSize, LabelMode, TooltipPosition } from "../types";
import { Tooltip } from "../Tooltip/Tooltip";
import { useSmartConfig } from "../hook/useSmartConfig";
/**
 * Label definition
 */
interface labelPropTypes {
  id?: string;
  htmlFor?: string;
  className?: string;
  /** Strings render exactly as before; React nodes are rendered as-is. */
  title?: React.ReactNode;
  required?: boolean;
  titleBold?: boolean;
  tooltip?: string;
  toolTipPosition?: TooltipPosition;
  mode?: LabelMode;
  horizontal?: boolean;
  xs?: ColumnSize;
  sm?: ColumnSize;
  md?: ColumnSize;
  lg?: ColumnSize;
  xl?: ColumnSize;
  xxl?: ColumnSize;
  size?: ColumnSize;
  /**
   * Per-instance classes merged after the configured label classes.
   * (`className` is kept for backwards compatibility and, as in 1.1.0, is not applied.)
   */
  labelClassName?: string;
  /** Per-instance classes for the tooltip bubble. */
  tooltipClassName?: string;
}

export function Label(props: labelPropTypes) {
  const {
    id,
    htmlFor,
    required = false,
    titleBold = false,
    title,
    tooltip,
    toolTipPosition = TooltipPosition.Top,
    horizontal = false,
    mode = LabelMode.Normal,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    size,
    labelClassName,
    tooltipClassName,
  } = props;
  const config = useSmartConfig();
  // The grid default (e.g. Tailwind `col-span-12`) only matters when the label
  // is itself a grid item, i.e. in horizontal layout.
  const colClasses = getGridColumnClasses(
    horizontal ? config : { ...config, grid: { ...config.grid, columnDefault: "" } },
    { size, xs, sm, md, lg, xl, xxl }
  );

  const labelAttributes: Record<string, string> = {};
  if (id) {
    const labelId = "lbl" + id;
    labelAttributes["id"] = labelId;
  }

  if (htmlFor) {
    labelAttributes["htmlFor"] = htmlFor;
  }

  labelAttributes["data-smarteditor"] = "label";

  let labelClasses;

  if (!horizontal) {
    switch (mode) {
      case LabelMode.CheckBox:
        labelClasses = config.components.checkbox.classes.label;
        break;
      case LabelMode.RadioButton:
        labelClasses = config.components.radio.classes.label;
        break;
      case LabelMode.Normal:
      default:
        labelClasses = config.components.editor.classes.label;
        break;
    }
  } else {
    // Keeps horizontalLabel for horizontal layout
    labelClasses = config.components.editor.classes.horizontalLabel;
  }

  if (required) {
    labelClasses += ` ${config.components.editor.classes.required}`;
  }
  if (titleBold) {
    labelClasses += ` ${config.components.editor.classes.titleBold}`;
  }

  labelClasses = mapToCssModules(
    cx(config, colClasses, labelClasses, labelClassName)
  );

  let labelChildren = null;
  if (!tooltip) {
    // strings (and undefined, numbers…) exactly as 1.1.0; React nodes as-is
    labelChildren =
      React.isValidElement(title) || Array.isArray(title) ? title : String(title);
  } else {
    const tooltipIcon = config.resources.icons.tooltip;
    if (shouldRenderIconSlot(config, tooltipIcon)) {
      labelChildren = (
        <>
          {title}{" "}
          <Tooltip
            position={toolTipPosition}
            text={tooltip}
            className={tooltipClassName}
          >
            {renderTooltipIcon(tooltipIcon)}
          </Tooltip>
        </>
      );
    } else {
      // No tooltip icon (e.g. unstyled preset, or `icons.tooltip: false`):
      // keep the tooltip reachable through a minimal, focusable text trigger.
      labelChildren = (
        <>
          {title}{" "}
          <Tooltip
            position={toolTipPosition}
            text={tooltip}
            className={tooltipClassName}
            accessible
          >
            <button
              type="button"
              aria-label={tooltip}
              className={config.components.tooltip.classes.trigger || undefined}
              data-smartr-tooltip-trigger=""
            >
              ?
            </button>
          </Tooltip>
        </>
      );
    }
  }

  return React.createElement(
    "label",
    {
      ...labelAttributes,
      ...dataAttrs(config, { required }),
      className: labelClasses,
    },
    labelChildren
  );
}

/**
 * The tooltip trigger must be a single element able to receive mouse events
 * and a ref; React-node/component icons are wrapped in a `<span>`.
 */
function renderTooltipIcon(icon: any) {
  if (icon === undefined || icon === null || typeof icon === "string") {
    return renderIcon(icon);
  }
  return <span>{renderIcon(icon)}</span>;
}
