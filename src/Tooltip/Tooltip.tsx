import { useCallback, useRef, useState } from "react";
import { TooltipPosition } from "../types";
import { mapToCssModules } from "../Utils/utils";
import { cxInstance, dataAttrs } from "../Utils/styling";
import React from "react";
import { useSmartConfig } from "../hook/useSmartConfig";

/**
 * Reads the ref of a React element in a way that works on React 16.8 – 19.
 * React 19 moved `ref` into `props` and warns when `element.ref` is accessed.
 */
function getElementRef(element: React.ReactElement): any {
  if (!element) return undefined;
  const major = parseInt(String(React.version || "0").split(".")[0], 10);
  if (major >= 19) {
    return (element.props as any)?.ref;
  }
  return (element as any).ref;
}

interface TooltipPropTypes {
  className?: string;
  text?: string;
  position?: TooltipPosition;
  children?: React.ReactNode;
  /**
   * Keyboard/screen-reader support: the trigger also opens on focus (closes on
   * blur / Escape), the bubble gets `role="tooltip"` + an id and the trigger
   * `aria-describedby` while open. Off by default (1.1.0 markup/behavior).
   */
  accessible?: boolean;
}

let tooltipIdCounter = 0;

export function Tooltip(props: TooltipPropTypes) {
  const {
    className,
    children,
    text,
    position = TooltipPosition.Top,
    accessible = false,
  } = props;
  const config = useSmartConfig();
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipIdRef = useRef<string | null>(null);
  if (accessible && tooltipIdRef.current === null) {
    tooltipIdRef.current = `smartr-tooltip-${++tooltipIdCounter}`;
  }

  const tooltipElementRef = useRef<HTMLElement | null>(null);

  const handleTooltipMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
  };

  const tooltipRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node !== null && tooltipElementRef.current) {
        const overlayRect = tooltipElementRef.current.getBoundingClientRect();
        const tooltipRect = node.getBoundingClientRect();
        let top, left;

        switch (position) {
          case TooltipPosition.Top:
            top = overlayRect.top - tooltipRect.height - 10;
            left =
              overlayRect.left + overlayRect.width / 2 - tooltipRect.width / 2;
            break;
          case TooltipPosition.Bottom:
            top = overlayRect.top + overlayRect.height + 10;
            left =
              overlayRect.left + overlayRect.width / 2 - tooltipRect.width / 2;
            break;
          case TooltipPosition.Left:
            top =
              overlayRect.top + overlayRect.height / 2 - tooltipRect.height / 2;
            left = overlayRect.left - tooltipRect.width - 10;
            break;
          case TooltipPosition.Right:
            top =
              overlayRect.top + overlayRect.height / 2 - tooltipRect.height / 2;
            left = overlayRect.left + overlayRect.width + 10;
            break;
          default:
            break;
        }

        node.style.top = `${top}px`;
        node.style.left = `${left}px`;
        node.style.visibility = "visible";
      }
    },
    [position, config.components.tooltip.width]
  );

  let tooltipClass =
    position === TooltipPosition.Top
      ? config.components.tooltip.classes.top
      : position === TooltipPosition.Bottom
      ? config.components.tooltip.classes.bottom
      : position === TooltipPosition.Left
      ? config.components.tooltip.classes.left
      : config.components.tooltip.classes.right;

  tooltipClass = mapToCssModules(cxInstance(config, className, tooltipClass));

  const toolTipDiv = showTooltip ? (
    <div
      ref={tooltipRef}
      style={{ visibility: "hidden" }}
      className={tooltipClass}
      {...(accessible ? { id: tooltipIdRef.current, role: "tooltip" } : {})}
      {...dataAttrs(config, { state: "open" })}
    >
      {text}
    </div>
  ) : null;

  const accessibleProps = accessible
    ? {
        onFocus: handleTooltipMouseEnter,
        onBlur: handleTooltipMouseLeave,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === "Escape") setShowTooltip(false);
        },
        "aria-describedby": showTooltip ? tooltipIdRef.current : undefined,
      }
    : {};

  const childrenWithEvents = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        ...accessibleProps,
        onMouseEnter: handleTooltipMouseEnter,
        onMouseLeave: handleTooltipMouseLeave,
        ref: (node: HTMLElement | null) => {
          const updateRef = (node: HTMLElement | null) => {
            (
              tooltipElementRef as React.MutableRefObject<HTMLElement | null>
            ).current = node;
          };
          updateRef(node);

          if (children) {
            const childRef = getElementRef(children as React.ReactElement);
            if (typeof childRef === "function") {
              childRef(node);
            } else if (
              childRef &&
              typeof childRef === "object" &&
              "current" in childRef
            ) {
              childRef.current = node;
            }
          }
        },
      })
    : children;

  return (
    <>
      {childrenWithEvents}
      {toolTipDiv}
    </>
  );
}
