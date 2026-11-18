import { useSmartConfig } from "../hook/useSmartConfig";
import { mapToCssModules } from "../Utils/utils";
import { cx, dataAttrs } from "../Utils/styling";

export enum AlertType {
  Success = 1,
  Warning = 2,
  Danger = 3,
  Info = 4,
}

// Alert configuration (global config `components.alert` or per instance)
export interface AlertConfig {
  textAlign?: "center" | "left" | "right";
  classes: {
    container: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    textCenter?: string;
    textLeft?: string;
    textRight?: string;
  };
}

interface AlertProps {
  type: AlertType;
  className?: string;
  children?: React.ReactNode;
  config?: Partial<AlertConfig>; // Optional per-instance configuration
}

const ALERT_STATE: Record<number, string> = {
  [AlertType.Success]: "success",
  [AlertType.Warning]: "warning",
  [AlertType.Danger]: "danger",
  [AlertType.Info]: "info",
};

export function Alert(props: AlertProps) {
  const { type, children, className, config = {} } = props;

  // User configuration (provider or global configManager)
  const userConfig = useSmartConfig();

  // Fallback configuration (Bootstrap)
  const defaultConfig: AlertConfig = {
    textAlign: "center",
    classes: {
      container: "alert",
      success: "alert-success",
      warning: "alert-warning",
      danger: "alert-danger",
      info: "alert-info",
      textCenter: "text-center",
      textLeft: "text-left",
      textRight: "text-right",
    },
  };

  // Merge configurations
  const mergedConfig: AlertConfig = {
    ...defaultConfig,
    ...(userConfig.components?.alert as any), // smart config
    ...config, // per instance
    classes: {
      ...defaultConfig.classes,
      ...userConfig.components.alert.classes,
      ...config.classes,
    },
  };

  let typeClass = "";
  switch (type) {
    case AlertType.Danger:
      typeClass = mergedConfig.classes.danger;
      break;
    case AlertType.Warning:
      typeClass = mergedConfig.classes.warning;
      break;
    case AlertType.Success:
      typeClass = mergedConfig.classes.success;
      break;
    case AlertType.Info:
      typeClass = mergedConfig.classes.info;
      break;
  }

  const alignClass =
    mergedConfig.textAlign === "center"
      ? mergedConfig.classes.textCenter
      : mergedConfig.textAlign === "left"
      ? mergedConfig.classes.textLeft
      : mergedConfig.textAlign === "right"
      ? mergedConfig.classes.textRight
      : null;

  const classes = mapToCssModules(
    cx(userConfig, mergedConfig.classes.container, typeClass, alignClass, className)
  );

  return (
    <div
      className={classes}
      role="alert"
      {...dataAttrs(userConfig, { state: ALERT_STATE[type] })}
    >
      {children}
    </div>
  );
}
