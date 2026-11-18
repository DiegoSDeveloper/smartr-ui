/**
 * `smartr-ui/core` — the form building blocks without the heavy parts.
 *
 * - `Editor` code-splits the async select (`loadOptions`) and `Input.File`
 *   (`React.lazy`), so a form that only uses text / select / checkbox / radio
 *   inputs does not download them.
 * - `Table` (and its helpers) is not exported here: import it from
 *   `smartr-ui` when needed.
 *
 * Everything shares the same modules as the main entry (same configuration
 * singleton, same `SmartRProvider` context), so `smartr-ui` and
 * `smartr-ui/core` can be mixed freely in one app.
 */
export * from './Alert/index';
export * from './CheckboxGroup/CheckboxGroup';
export * from './Column/Column';
export * from './Container/Container';
export { Editor } from './Editor/EditorLazy';
export { createEditor } from './Editor/EditorCore';
export type { EditorComponent, EditorControls, EditorRef } from './Editor/EditorCore';
export * from './Editor/EditorPropType';
export * from './EditorButton/EditorButton';
export * from './EditorInput/EditorInput';
export * from './Label/Label';
export * from './Loading/index';
export * from './Radio/Radio';
export * from './Row/Row';
export * from './Tooltip/Tooltip';
export * from './Utils/utils';
export * from './ValidationResult';
export * from './config/configManager';
export * from './config/defaultConfig';
export * from './hook/useSmartConfig';
export * from './types';
export { createConfig } from './config/merge';
export { SmartRProvider, SmartRConfigContext } from './context/SmartRProvider';
export type { SmartRProviderProps } from './context/SmartRProvider';
export * from './presets/index';
export { renderIcon } from './Utils/styling';
export { translationKeyPath } from './Utils/translate';
export {
  smartrTranslationKeys,
  defaultTexts,
  defaultTextsTree,
  translationKeyAliases,
  getTranslationKeys,
} from './config/translationKeys';
export type { SmartRTranslationKey } from './config/translationKeys';
export * from './Chips/Chips';
export * from './FormMessage/FormMessage';
export { phoneMasks } from './config/sharedConfig';
export type { SmartRValidateMode } from './config/sharedConfig';
