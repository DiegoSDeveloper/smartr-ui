import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { configManager } from "../src/config/configManager";

afterEach(() => {
  cleanup();
  configManager.resetConfig();
  delete (window as any).SmartRConfig;
});
