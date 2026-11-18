/**
 * `smartr-ui/config` — the configuration layer without any component:
 * `configManager`, `createConfig`, `SmartRProvider` / `useSmartConfig`, the
 * presets, the translation keys and the phone masks.
 *
 * Import it from modules that only configure smartr-ui (an app bootstrap, a
 * lazily loaded settings module, a test setup) so they do not pull the Editor
 * (or the Table) into their bundle:
 *
 * ```ts
 * import { configManager, shadcnPreset } from "smartr-ui/config";
 * configManager.setPreset(shadcnPreset, { mergeClasses: cn });
 * ```
 *
 * The modules are shared with `smartr-ui` and `smartr-ui/core` (same chunks):
 * one configuration singleton and one `SmartRProvider` context, whichever
 * entry imports them.
 */
export * from './config/configManager';
export * from './config/defaultConfig';
export { createConfig } from './config/merge';
export { SmartRProvider, SmartRConfigContext } from './context/SmartRProvider';
export type { SmartRProviderProps } from './context/SmartRProvider';
export { useSmartConfig } from './hook/useSmartConfig';
export * from './presets/index';
export { translationKeyPath } from './Utils/translate';
export {
  smartrTranslationKeys,
  defaultTexts,
  defaultTextsTree,
  translationKeyAliases,
  getTranslationKeys,
} from './config/translationKeys';
export type { SmartRTranslationKey } from './config/translationKeys';
export { phoneMasks } from './config/sharedConfig';
export type { SmartRValidateMode } from './config/sharedConfig';
