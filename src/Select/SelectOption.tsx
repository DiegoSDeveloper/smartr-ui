import React from "react";
import { cx, dataAttrs } from "../Utils/styling";
import { useSmartConfig } from "../hook/useSmartConfig";

interface SelectOptionPropTypes {
  option: any;
  optionsId: string;
  optionsDescription: string;
  isSelected: boolean;
  isDisabled: boolean;
  searchText: string;
  optionsMultiple?: boolean;
  isActive?: boolean;
  id?: string;
  optionRenderer?: (
    option: any,
    isSelected: boolean,
    searchText: string
  ) => React.ReactNode;
  onOptionClick: (option: any, event: React.MouseEvent) => void;
}

/**
 * Renderização de uma opção do dropdown, compartilhada entre o Select
 * (filtro em memória) e o AsyncSelect (busca via handler do consumidor).
 */
export const SelectOption = (props: SelectOptionPropTypes) => {
  const {
    option,
    optionsId,
    optionsDescription,
    isSelected,
    isDisabled,
    searchText,
    optionsMultiple = false,
    isActive = false,
    id,
    optionRenderer,
    onOptionClick,
  } = props;
  const config = useSmartConfig();

  const containerProps = {
    id,
    role: "option",
    "aria-selected": isSelected,
    className: cx(config, config.components.select.classes.option, {
      [config.components.select.classes.optionDisabled]: isDisabled,
      [config.components.select.classes.optionActive]: isActive,
    }),
    ...dataAttrs(config, {
      disabled: isDisabled,
      state: isSelected ? "checked" : isActive ? "active" : undefined,
    }),
    onClick: isDisabled
      ? undefined
      : (e: React.MouseEvent) => onOptionClick(option, e),
  };

  // Se optionRenderer foi fornecido, use-o (exceto para a opção "nenhum selecionado")
  if (option[optionsId] && optionRenderer) {
    return (
      <div {...containerProps}>
        {optionRenderer(option, isSelected, searchText)}
      </div>
    );
  }

  // Renderização padrão com destaque do termo buscado
  const optionText = String(option[optionsDescription] ?? "");
  const startIndex = searchText
    ? optionText.toLowerCase().indexOf(searchText.toLowerCase())
    : -1;
  const endIndex = startIndex + searchText.length;

  return (
    <div {...containerProps}>
      {optionsMultiple ? (
        <input
          data-smarteditor="CheckBox"
          type="checkbox"
          className={config.components.checkbox.classes.input}
          checked={isSelected}
          value={option[optionsId]}
          disabled={isDisabled}
          readOnly
        ></input>
      ) : null}

      <span>
        {startIndex >= 0 ? (
          <>
            {optionText.substring(0, startIndex)}
            <strong>{optionText.substring(startIndex, endIndex)}</strong>
            {optionText.substring(endIndex)}
          </>
        ) : (
          optionText
        )}
      </span>
    </div>
  );
};
