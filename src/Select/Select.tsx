import { useState, useEffect, useRef, ChangeEvent } from "react";
import { EditorInput } from "../EditorInput/EditorInput";
import { Input } from "../types";
import { mapToCssModules } from "../Utils/utils";
import { cx, dataAttrs, legacyClass, translateText } from "../Utils/styling";
import { useSmartConfig } from "../hook/useSmartConfig";
import type { SmartRControlComponent } from "../config/defaultConfig";
import { SelectOption } from "./SelectOption";

interface SelectPropTypes {
  options: any[];
  optionsId: string;
  optionsDescription: string;
  optionsGrouped?: boolean;
  optionsGroup?: string;
  optionGetDescription?: (option: any) => string;
  optionGetGroup?: (option: any) => string;
  optionsFirstSelected: boolean;
  optionsNoneSelectedValue: any;
  optionsNoneSelectedText: string;
  optionsFilter: boolean;
  optionsMultiple: boolean;
  optionsLimiteDescriptionSelected: number;
  optionsMultipleSeparatorValue: string;
  optionsMultipleSeparatorDescription: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: any;
  enabled?: boolean;
  readOnly?: boolean;
  children?: any;
  editorAttributes: Record<string, any>;
  optionRenderer?: (
    option: any,
    isSelected: boolean,
    searchText: string
  ) => React.ReactNode;
  onBlurEvent: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  onChangeEvent: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  inputRef: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  className?: string;
  /** Render slot for the native `<select>` (see `SmartRControlProps`). */
  control?: SmartRControlComponent;
  /** Semantic state passed to custom controls / data-attributes. */
  controlState?: { required?: boolean; invalid?: boolean };
  /** Data passed to the select render slot only (`options`, `multiple`, `noneOption`). */
  controlData?: Record<string, any>;
}

interface CustomSelectState {
  isOpen: boolean;
  searchText: string;
}

const Select = (props: SelectPropTypes) => {
  const {
    options,
    optionsId,
    optionsDescription,
    optionsGrouped = false,
    optionsGroup,
    optionGetDescription,
    optionGetGroup,
    optionsFirstSelected,
    optionsFilter,
    optionsMultiple,
    optionsLimiteDescriptionSelected,
    optionsMultipleSeparatorValue,
    optionsNoneSelectedValue,
    optionsNoneSelectedText,
    editorAttributes,
    searchPlaceholder,
    value,
    enabled = true,
    readOnly = false,
    optionRenderer,
    onBlurEvent,
    onChangeEvent,
    inputRef,
    className,
    children,
    control,
    controlState,
    controlData,
  } = props;
  const config = useSmartConfig();
  const selectTexts = config.components.select.texts;
  const text = (key: keyof typeof selectTexts, ...params: any[]) =>
    translateText(config, `select.texts.${String(key)}`, selectTexts[key], ...params);
  // Se não tem filter, não é multiple, não tem render customizado e não é agrupado,
  // renderiza o select nativo simples
  const shouldUseNativeSelect =
    !optionsFilter && !optionsMultiple && !optionRenderer && !optionsGrouped;

  // Verifica se o componente está desabilitado ou somente leitura
  const isDisabled = !enabled || readOnly;

  // Hooks of the custom select, declared before the native early return so the
  // hook order never changes between renders (rules of hooks). The effect does
  // nothing for the native select.
  const [filterState, setFilterState] = useState<CustomSelectState>({
    isOpen: false,
    searchText: "",
  });
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (shouldUseNativeSelect) return;
    if (isDisabled) {
      setFilterState((prevState) => ({
        ...prevState,
        isOpen: false,
        searchText: "",
      }));
      return;
    }

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setFilterState((prevState) => ({
          ...prevState,
          searchText: "",
          isOpen: false,
        }));
      }
    };

    if (filterState.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        setContainerWidth(width);
      }
      if (optionsFilter) {
        searchInputRef.current.focus();
      }
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterState.isOpen, isDisabled]);

  if (shouldUseNativeSelect) {
    return (
      <EditorInput
        type={Input.Select}
        inputType="select"
        editorAttributes={{
          ...editorAttributes,
          disabled: isDisabled,
          readOnly: readOnly,
        }}
        onBlurEvent={isDisabled ? undefined : onBlurEvent}
        onChangeEvent={isDisabled ? undefined : onChangeEvent}
        inputRef={inputRef}
        children={children}
        className={cx(config, className, {
          [config.components.editor.classes.controlGroupDisabledControl]:
            isDisabled,
        })}
        control={control}
        controlState={controlState}
        controlData={controlData}
      ></EditorInput>
    );
  }

  // Código do select customizado continua aqui...
  const { searchText } = filterState;

  let innerChildren = null;
  let editorValue = value;

  let editorDescription = null;
  let selecteds = [];
  let selectLabelText = text("multipleSelectAll");

  const toggleDropdown = () => {
    if (isDisabled) return;

    setFilterState((prevState) => ({
      ...prevState,
      isOpen: !prevState.isOpen,
    }));
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    setFilterState((prevState) => ({
      ...prevState,
      searchText: e.target.value,
    }));
  };

  const selectAllClick = (select: boolean) => {
    if (isDisabled) return;

    if (select) {
      selecteds = options.map((item) => String(item[optionsId]));
    } else {
      selecteds = [];
    }
    editorValue = selecteds.join(optionsMultipleSeparatorValue);
    inputRef.current.value = editorValue;

    onChangeEvent({
      target: inputRef.current,
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleOptionClick = (option: any, event: React.MouseEvent) => {
    if (isDisabled) return;

    event.stopPropagation();
    editorValue = option[optionsId];
    editorDescription = option[optionsDescription];
    setFilterState((prevState) => ({
      ...prevState,
      isOpen: !optionsMultiple ? false : true,
      searchText: "",
    }));
    let clickedValue = option[optionsId];
    if (optionsMultiple) {
      if (!selecteds.includes(String(clickedValue))) {
        selecteds.push(String(clickedValue));
      } else {
        selecteds = selecteds.filter(
          (Filter) => Filter !== String(clickedValue)
        );
      }
      clickedValue = selecteds.join(optionsMultipleSeparatorValue);
    }

    inputRef.current.value = clickedValue;

    onChangeEvent({
      target: inputRef.current,
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Função para obter o grupo de uma opção
  const getOptionGroup = (option: any): string => {
    if (optionsGroup && option[optionsGroup]) {
      return option[optionsGroup];
    }
    if (optionGetGroup) {
      return optionGetGroup(option);
    }
    return "";
  };

  if (options) {
    const dataSource =
      options && typeof options[Symbol.iterator] === "function"
        ? [...options]
        : [];
    if (!optionsMultiple) {
      if (!optionsFirstSelected) {
        const noneSelectOption = {};
        noneSelectOption[optionsId] = optionsNoneSelectedValue;
        noneSelectOption[optionsDescription] = optionsNoneSelectedText;
        dataSource.unshift(noneSelectOption);
        if (!editorValue) {
          editorValue = optionsNoneSelectedValue;
        }
      } else {
        if (!editorValue && dataSource.length > 0) {
          editorValue = dataSource[0][optionsId];
        }
      }
      const option = dataSource.find(
        (Filter) => Filter[optionsId] === editorValue
      );
      if (option) {
        editorDescription = optionGetDescription
          ? optionGetDescription(option)
          : option[optionsDescription];
      }
    } else {
      if (editorValue) {
        if (!Array.isArray(editorValue)) {
          if (typeof editorValue === "string") {
            if (editorValue.includes(optionsMultipleSeparatorValue)) {
              selecteds = String(editorValue).split(
                optionsMultipleSeparatorValue
              );
            } else {
              const option = dataSource.find(
                (Filter) => Filter[optionsId] === editorValue
              );
              if (option) {
                selecteds = [editorValue];
              } else {
                const editorNumber = parseInt(editorValue);
                if (!isNaN(editorNumber)) {
                  dataSource.forEach((item) => {
                    if (
                      (editorNumber & parseInt(item[optionsId])) ===
                      parseInt(item[optionsId])
                    ) {
                      selecteds.push(String(item[optionsId]));
                    }
                  });
                }
              }
            }
          } else if (typeof editorValue === "number") {
            dataSource.forEach((item) => {
              if (
                (editorValue & parseInt(item[optionsId])) ===
                parseInt(item[optionsId])
              ) {
                selecteds.push(String(item[optionsId]));
              }
            });
          }
        } else {
          selecteds = editorValue.map(String);
        }
      } else {
        selecteds = [];
      }

      if (selecteds.length === 0) {
        selectLabelText = text("multipleSelectAll");
        editorDescription = text("multipleNoneSelected");
      } else if (selecteds.length === dataSource.length) {
        selectLabelText = text("multipleSelectNone");
      }
      if (selecteds.length > 0) {
        if (selecteds.length <= optionsLimiteDescriptionSelected) {
          const descriptions = options
            .filter((item) => selecteds.includes(String(item[optionsId])))
            .map((item) => item[optionsDescription]);

          editorDescription = descriptions.join(
            config.behavior.select.optionsMultipleSeparatorDescription
          );
        } else {
          editorDescription = `${selecteds.length} ${text("multipleSelected")}`;
        }
      }
    }

    const items = dataSource.map((option, index) => {
      // Se houver optionRenderer, não executa optionGetDescription
      if (optionRenderer) return option;

      option[optionsDescription] =
        !optionGetDescription ||
        (index === 0 && optionGetDescription && !optionsFirstSelected)
          ? option[optionsDescription]
          : optionGetDescription(option);

      return option;
    });

    // Filtra os itens baseado no texto de busca
    const filteredItems = items.filter((option) =>
      option[optionsDescription]
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );

    // Lógica para opções agrupadas
    if (optionsGrouped) {
      const groupedOptions = new Map<string, any[]>();

      // Agrupar as opções filtradas
      filteredItems.forEach((option) => {
        const group = getOptionGroup(option);
        if (!groupedOptions.has(group)) {
          groupedOptions.set(group, []);
        }
        groupedOptions.get(group)!.push(option);
      });

      // Criar elementos React agrupados
      innerChildren = Array.from(groupedOptions.entries()).map(
        ([groupName, groupOptions], groupIndex) => {
          const optionElements = groupOptions.map((option, optionIndex) => (
            <SelectOption
              key={`group-${groupIndex}-option-${optionIndex}`}
              option={option}
              optionsId={optionsId}
              optionsDescription={optionsDescription}
              isSelected={selecteds.includes(String(option[optionsId]))}
              isDisabled={isDisabled}
              searchText={searchText}
              optionsMultiple={optionsMultiple}
              optionRenderer={optionRenderer}
              onOptionClick={handleOptionClick}
            />
          ));

          return (
            <div key={`group-${groupIndex}`}>
              <div className={config.components.select.classes.groupHeader}>
                {groupName}
              </div>
              {optionElements}
            </div>
          );
        }
      );
    } else {
      // Lógica original para opções não agrupadas
      innerChildren = filteredItems.map((option, index) => (
        <SelectOption
          key={index}
          option={option}
          optionsId={optionsId}
          optionsDescription={optionsDescription}
          isSelected={selecteds.includes(String(option[optionsId]))}
          isDisabled={isDisabled}
          searchText={searchText}
          optionsMultiple={optionsMultiple}
          optionRenderer={optionRenderer}
          onOptionClick={handleOptionClick}
        />
      ));
    }
  }

  const selectClasses = config.components.select.classes;
  const classes = mapToCssModules(
    cx(config, className, selectClasses.container, {
      [config.components.editor.classes.controlGroupDisabledControl]:
        isDisabled,
    })
  );
  const openClass = filterState.isOpen ? selectClasses.open : "";

  return (
    <div
      ref={containerRef}
      tabIndex={isDisabled ? -1 : 0}
      className={classes}
      onClick={isDisabled ? undefined : toggleDropdown}
      {...dataAttrs(config, {
        state: filterState.isOpen ? "open" : "closed",
        disabled: isDisabled,
        invalid: controlState?.invalid,
        required: controlState?.required,
      })}
    >
      <EditorInput
        type={Input.Hidden}
        inputType="input"
        editorAttributes={{
          ...editorAttributes,
          type: "hidden",
          disabled: isDisabled,
          readOnly: readOnly,
        }}
        inputRef={inputRef}
      ></EditorInput>
      <div
        className={legacyClass(
          config,
          `${selectClasses.innerContainer} ${openClass}`,
          [selectClasses.innerContainer, openClass]
        )}
      >
        <div
          className={legacyClass(
            config,
            `${selectClasses.optionSelectedInput} ${openClass}`,
            [selectClasses.optionSelectedInput, openClass]
          )}
        >
          {editorDescription}
        </div>
        <div
          className={config.components.select.classes.optionsContainer}
          style={{ width: `${containerWidth}px` }}
        >
          {optionsMultiple && !isDisabled ? (
            <a
              href="#!"
              onClick={(e) => {
                e.preventDefault();
                selectAllClick(selecteds.length < options.length);
              }}
              className={config.components.select.classes.selectAll}
            >
              {selectLabelText}
            </a>
          ) : null}
          {optionsFilter && !isDisabled ? (
            <input
              type="text"
              className={config.components.select.classes.searchInput}
              value={searchText}
              ref={searchInputRef}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              disabled={isDisabled}
            />
          ) : null}

          <div className={config.components.select.classes.dropdown}>
            {innerChildren}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Select;
