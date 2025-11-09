import { useCallback, useRef, useState } from "react";
import { TooltipPosition } from "../types";
import { classNames, mapToCssModules } from "../Utils/utils";
import React from "react";
import { useSmartConfig } from "../hook/useSmartConfig";

interface TooltipPropTypes {
  className?: string;
  text?: string;
  position?: TooltipPosition;
  children?: React.ReactNode;
}

export function Tooltip(props: TooltipPropTypes) {
  const { className, children, text, position = TooltipPosition.Top } = props;
  const config = useSmartConfig();
  const [showTooltip, setShowTooltip] = useState(false);

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
        const tooltipWidth =
          node.getBoundingClientRect().width < config.components.tooltip.width
            ? node.getBoundingClientRect().width
            : config.components.tooltip.width;
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

  tooltipClass = mapToCssModules(classNames(className, tooltipClass));

  const toolTipDiv = showTooltip ? (
    <div
      ref={tooltipRef}
      style={{ visibility: "hidden" }}
      className={tooltipClass}
    >
      {text}
    </div>
  ) : null;

  const childrenWithEvents = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
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
            const childRef = (children as any).ref;
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
