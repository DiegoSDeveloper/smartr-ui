import React from "react";
import { mapToCssModules } from "../Utils/utils";
import { cx, renderIcon } from "../Utils/styling";
import { TooltipPosition } from "../types";
import { Tooltip } from "../Tooltip/Tooltip";
import { useSmartConfig } from "../hook/useSmartConfig";
import type { IconValue } from "../config/defaultConfig";

export interface editorButtonPropTypes {
  tag?: string;
  className?: string;
  text?: string;
  tooltip?: string;
  toolTipPosition?: TooltipPosition;
  /** Icon class (`"fas fa-search"`), React node or React component. */
  icon?: IconValue;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EditorButton(props: editorButtonPropTypes) {
  const config = useSmartConfig();
  const {
    className,
    tag = config.tags.editorButtonTag,
    icon,
    text,
    tooltip,
    toolTipPosition = TooltipPosition.Top,
    onClick,
    ...attributes
  } = props;
  const classes = mapToCssModules(
    cx(config, config.components.editor.classes.inputGroupButton, className)
  );

  const innerContent = (
    <>
      {icon && renderIcon(icon)}
      {text}
    </>
  );
  let content: React.ReactElement = React.createElement(
    tag,
    {
      ...attributes,
      className: classes,
      onClick: onClick,
    },
    innerContent
  );
  if (tooltip) {
    content = (
      <Tooltip position={toolTipPosition} text={tooltip}>
        {content}
      </Tooltip>
    );
  }
  return (
    <>
      <div className={config.components.editor.classes.inputGroupAppendButton}>
        {content}
      </div>
    </>
  );
}
