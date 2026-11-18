import {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { EditorInput } from "../EditorInput/EditorInput";
import {
  Input,
  LoadOptionsArgs,
  LoadOptionsResult,
  SmartOption,
} from "../types";
import { mapToCssModules } from "../Utils/utils";
import { cx, dataAttrs, legacyClass, translateText } from "../Utils/styling";
import { useSmartConfig } from "../hook/useSmartConfig";
import { SelectOption } from "./SelectOption";

export interface AsyncSelectPropTypes {
  /**
   * Ativa o modo assíncrono: a lib decide QUANDO buscar (debounce, página,
   * cancelamento); o consumidor decide COMO buscar. A lib não faz I/O.
   */
  loadOptions: (args: LoadOptionsArgs) => Promise<LoadOptionsResult>;
  /** Resolve o rótulo do valor já selecionado quando ele não está na lista carregada. */
  loadSelectedOption?: (
    value: any,
    signal: AbortSignal
  ) => Promise<SmartOption | null>;
  /** Alternativa a loadSelectedOption: o consumidor entrega o item já resolvido. */
  selectedOption?: SmartOption | null;
  pageSize?: number;
  searchDebounceMs?: number;
  minSearchLength?: number;
  loadOnOpen?: boolean;
  /**
   * Invalida o cache por termo e recarrega. Troque o valor (ex.: Date.now())
   * depois de cadastrar um registro novo, para que ele passe a aparecer na busca.
   */
  reloadToken?: any;
  /**
   * Exibe a linha "nenhum selecionado" no topo. Default: `!optionsFirstSelected`.
   *
   * ATENCAO: no `Select` sincrono, `optionsFirstSelected` AUTO-SELECIONA a primeira
   * opcao. No modo assincrono isso seria um bug (selecionaria o 1o item da pagina
   * carregada, algo arbitrario), entao aqui ele apenas controla a exibicao da linha
   * "nenhum". Use `showNoneOption` para deixar a intencao explicita.
   */
  showNoneOption?: boolean;
  onSearchChange?: (search: string) => void;
  onOpen?: () => void;
  optionRenderer?: (
    option: any,
    isSelected: boolean,
    searchText: string
  ) => React.ReactNode;
  renderEmpty?: (search: string) => React.ReactNode;
  renderError?: (error: unknown, retry: () => void) => React.ReactNode;
  renderLoading?: () => React.ReactNode;

  optionsId?: string;
  optionsDescription?: string;
  optionsNoneSelectedValue?: any;
  optionsNoneSelectedText?: string;
  optionsFirstSelected?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  value: any;
  enabled?: boolean;
  readOnly?: boolean;
  editorAttributes: Record<string, any>;
  onBlurEvent?: (event: React.FocusEvent<HTMLInputElement>) => Promise<void>;
  onChangeEvent: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  inputRef: React.MutableRefObject<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  className?: string;
  /** Semantic state used for data-attributes. */
  controlState?: { required?: boolean; invalid?: boolean };
}

interface CachedPage {
  options: SmartOption[];
  page: number;
  hasMore: boolean;
}

/**
 * Dropdown assíncrono: carrega opções por página através do handler
 * `loadOptions` do consumidor, com debounce de digitação, scroll infinito,
 * cancelamento de requisições obsoletas e cache leve por termo.
 * Zero I/O dentro da lib — todo acesso a dados é do consumidor.
 *
 * LIMITAÇÃO: seleção múltipla (`optionsMultiple`) NÃO é suportada no modo
 * assíncrono — a prop é ignorada. Use o `Select` síncrono para múltipla escolha.
 */
const AsyncSelect = (props: AsyncSelectPropTypes) => {
  const config = useSmartConfig();
  const {
    loadOptions,
    loadSelectedOption,
    selectedOption,
    pageSize = config.behavior.select.pageSize,
    searchDebounceMs = config.behavior.select.searchDebounceMs,
    minSearchLength = config.behavior.select.minSearchLength,
    loadOnOpen = config.behavior.select.loadOnOpen,
    reloadToken,
    onSearchChange,
    onOpen,
    optionRenderer,
    renderEmpty,
    renderError,
    renderLoading,
    optionsId = config.behavior.select.optionsId,
    optionsDescription = config.behavior.select.optionsDescription,
    optionsNoneSelectedValue = config.behavior.select.optionsNoneSelectedValue,
    optionsNoneSelectedText = config.components.select.texts
      .optionsNoneSelectedText,
    optionsFirstSelected = config.behavior.select.optionsFirstSelected,
    showNoneOption = !optionsFirstSelected,
    placeholder,
    searchPlaceholder,
    value,
    enabled = true,
    readOnly = false,
    editorAttributes,
    onBlurEvent,
    onChangeEvent,
    inputRef,
    className,
    controlState,
  } = props;

  const isDisabled = !enabled || readOnly;

  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<SmartOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<SmartOption | null>(null);
  // true enquanto loadSelectedOption esta em voo — evita o campo piscar em branco
  const [resolvingSelected, setResolvingSelected] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const selectedAbortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  // Handlers em refs: um consumidor que passe arrow functions inline não deve
  // reiniciar os efeitos de carga a cada render
  const loadOptionsRef = useRef(loadOptions);
  loadOptionsRef.current = loadOptions;
  const loadSelectedOptionRef = useRef(loadSelectedOption);
  loadSelectedOptionRef.current = loadSelectedOption;
  const itemsRef = useRef<SmartOption[]>([]);
  const cacheRef = useRef<Map<string, CachedPage>>(new Map());
  const lastRequestRef = useRef<{ term: string; page: number; append: boolean }>(
    { term: "", page: 1, append: false }
  );

  const rawTexts = config.components.select.texts;
  const text = (key: keyof typeof rawTexts, ...params: any[]) =>
    translateText(config, `select.texts.${String(key)}`, rawTexts[key], ...params);
  const texts = {
    loadingText: text("loadingText"),
    loadingMoreText: text("loadingMoreText"),
    noResultsText: text("noResultsText"),
    loadErrorText: text("loadErrorText"),
    retryText: text("retryText"),
  };
  const selectClasses = config.components.select.classes;
  const baseId: string =
    editorAttributes?.id || editorAttributes?.name || "smart-async-select";

  const sameValue = (a: any, b: any) => String(a) === String(b);
  const hasValue =
    value !== undefined &&
    value !== null &&
    String(value) !== "" &&
    !sameValue(value, optionsNoneSelectedValue ?? "");

  const applyItems = (list: SmartOption[]) => {
    itemsRef.current = list;
    setItems(list);
  };

  const resetList = () => {
    seqRef.current++;
    if (abortRef.current) abortRef.current.abort();
    applyItems([]);
    setPage(1);
    setHasMore(false);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  };

  const runLoad = useCallback(
    (term: string, pageToLoad: number, append: boolean) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++seqRef.current;
      lastRequestRef.current = { term, page: pageToLoad, append };

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      loadOptionsRef.current({
        search: term,
        page: pageToLoad,
        pageSize,
        signal: controller.signal,
      })
        .then((result) => {
          // Descarta respostas obsoletas: só a requisição mais recente atualiza a lista
          if (requestId !== seqRef.current || controller.signal.aborted) return;

          const pageOptions = (result && result.options) || [];
          const more =
            result && result.hasMore !== undefined
              ? !!result.hasMore
              : pageOptions.length === pageSize;

          const base = append ? itemsRef.current : [];
          const seen = new Set(base.map((o) => String(o[optionsId])));
          const merged = base.concat(
            pageOptions.filter((o) => !seen.has(String(o[optionsId])))
          );

          cacheRef.current.set(term, {
            options: merged,
            page: pageToLoad,
            hasMore: more,
          });

          applyItems(merged);
          setPage(pageToLoad);
          setHasMore(more);
          setLoading(false);
          setLoadingMore(false);
        })
        .catch((err) => {
          if (requestId !== seqRef.current || controller.signal.aborted) return;
          setError(err);
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [pageSize, optionsId]
  );

  const retry = useCallback(() => {
    const last = lastRequestRef.current;
    runLoad(last.term, last.page, last.append);
  }, [runLoad]);

  // Debounce da digitação: o termo só é efetivado após o intervalo configurado
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchText),
      searchDebounceMs
    );
    return () => clearTimeout(timer);
  }, [searchText, searchDebounceMs]);

  const searchBlocked =
    debouncedSearch.length < minSearchLength ||
    (!loadOnOpen && debouncedSearch.length === 0);

  // Carrega a primeira página do termo atual (ou restaura do cache)
  useEffect(() => {
    if (!isOpen) return;

    if (searchBlocked) {
      resetList();
      return;
    }

    const cached = cacheRef.current.get(debouncedSearch);
    if (cached) {
      seqRef.current++;
      if (abortRef.current) abortRef.current.abort();
      applyItems(cached.options);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      return;
    }

    // Termo novo: sempre volta para a página 1 e descarta o acumulado anterior
    runLoad(debouncedSearch, 1, false);
  }, [isOpen, debouncedSearch, searchBlocked, runLoad]);

  // Scroll infinito: sentinela no fim do dropdown pede a próxima página
  useEffect(() => {
    if (!isOpen || !hasMore || loading || loadingMore || error) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const loadNextPage = () => runLoad(debouncedSearch, page + 1, true);

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            loadNextPage();
          }
        },
        { root: dropdownRef.current, rootMargin: "0px 0px 48px 0px" }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }

    // Fallback sem IntersectionObserver: escuta o scroll do dropdown
    const dropdown = dropdownRef.current;
    if (!dropdown) return;
    const handleScroll = () => {
      if (
        dropdown.scrollTop + dropdown.clientHeight >=
        dropdown.scrollHeight - 48
      ) {
        loadNextPage();
      }
    };
    dropdown.addEventListener("scroll", handleScroll);
    return () => dropdown.removeEventListener("scroll", handleScroll);
  }, [
    isOpen,
    hasMore,
    loading,
    loadingMore,
    error,
    page,
    debouncedSearch,
    items.length,
    runLoad,
  ]);

  // Resolve o rótulo do valor selecionado independente da paginação:
  // o item pode não estar na página carregada (caso clássico de edição)
  useEffect(() => {
    if (!hasValue) {
      setSelected(null);
      setResolvingSelected(false);
      return;
    }
    if (selected && sameValue(selected[optionsId], value)) return;

    if (selectedOption && sameValue(selectedOption[optionsId], value)) {
      setSelected(selectedOption);
      setResolvingSelected(false);
      return;
    }

    const inList = itemsRef.current.find((o) =>
      sameValue(o[optionsId], value)
    );
    if (inList) {
      setSelected(inList);
      setResolvingSelected(false);
      return;
    }

    if (loadSelectedOptionRef.current) {
      if (selectedAbortRef.current) selectedAbortRef.current.abort();
      const controller = new AbortController();
      selectedAbortRef.current = controller;
      setResolvingSelected(true);
      loadSelectedOptionRef.current(value, controller.signal)
        .then((option) => {
          if (controller.signal.aborted) return;
          setSelected(option || null);
          setResolvingSelected(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          // rótulo não resolvido: o editorDescription cai no valor cru,
          // para o campo nunca ficar silenciosamente em branco
          setResolvingSelected(false);
        });
    }
  }, [value, hasValue, selectedOption, optionsId]);

  // Fecha ao clicar fora e foca a busca ao abrir (mesmo comportamento do Select)
  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
      setSearchText("");
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchText("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isDisabled]);

  // Aborta requisições pendentes ao desmontar
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (selectedAbortRef.current) selectedAbortRef.current.abort();
    };
  }, []);

  // reloadToken mudou: invalida o cache e recarrega o termo atual.
  // Caso de uso: o usuário cadastrou um registro novo e ele precisa aparecer na busca.
  const firstReloadToken = useRef(true);
  useEffect(() => {
    if (firstReloadToken.current) {
      firstReloadToken.current = false;
      return;
    }
    cacheRef.current.clear();
    if (isOpen && !searchBlocked) {
      runLoad(debouncedSearch, 1, false);
    } else {
      resetList();
    }
     
  }, [reloadToken]);

  // Dispara a validação (validateOnBlur) SEMPRE com o input escondido como target:
  // é ele que carrega o valor selecionado. Passar o evento do container faria o
  // Editor ler `event.target.value` da div/campo de busca (vazio) e acusar
  // "obrigatório" mesmo com uma opção escolhida.
  const emitBlur = () => {
    if (!onBlurEvent || !inputRef.current) return;
    onBlurEvent({
      target: inputRef.current,
    } as unknown as React.FocusEvent<HTMLInputElement>);
  };

  // Enquanto o usuário interage DENTRO do componente (abrir, digitar, clicar numa
  // opção) o blur não pode validar: a ordem dos eventos é mousedown -> blur -> click,
  // ou seja, o blur aconteceria ANTES de o valor ser gravado — e validaria o valor
  // antigo (vazio). O flag é ligado no mousedown e desligado no mouseup seguinte.
  const interactingRef = useRef(false);
  useEffect(() => {
    const clear = () => {
      interactingRef.current = false;
    };
    document.addEventListener("mouseup", clear);
    return () => document.removeEventListener("mouseup", clear);
  }, []);

  const handleContainerBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (isDisabled || !onBlurEvent) return;
    if (interactingRef.current) return; // clique dentro do próprio componente
    const next = event.relatedTarget as Node | null;
    if (next && containerRef.current && containerRef.current.contains(next)) {
      return; // foco continua dentro (ex.: foi para o campo de busca)
    }
    emitBlur();
  };

  const toggleDropdown = () => {
    if (isDisabled) return;
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && onOpen) onOpen();
    if (!nextOpen) setSearchText("");
    setActiveIndex(-1);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    setSearchText(e.target.value);
    setActiveIndex(-1);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  const handleOptionClick = (option: SmartOption, event: React.MouseEvent) => {
    if (isDisabled) return;
    event.stopPropagation();

    const clickedValue = option[optionsId];
    const isNoneOption = sameValue(clickedValue, optionsNoneSelectedValue ?? "");
    setSelected(isNoneOption ? null : option);
    setIsOpen(false);
    setSearchText("");
    setActiveIndex(-1);

    inputRef.current.value = clickedValue;
    onChangeEvent({
      target: inputRef.current,
    } as React.ChangeEvent<HTMLInputElement>);

    // Revalida JÁ com o valor escolhido: sem isto, uma mensagem de "obrigatório"
    // exibida antes continuaria na tela mesmo depois da seleção (o blur do clique
    // é ignorado de propósito, pois acontece antes do valor ser gravado).
    emitBlur();
  };

  // Monta a lista exibida: opção "nenhum", item selecionado fixado (quando a
  // busca atual não o retorna) e os itens acumulados das páginas carregadas
  const displayOptions: SmartOption[] = [];
  if (showNoneOption && debouncedSearch.length === 0 && !searchBlocked) {
    const noneOption: SmartOption = { id: null, description: "" };
    noneOption[optionsId] = optionsNoneSelectedValue;
    noneOption[optionsDescription] = optionsNoneSelectedText;
    displayOptions.push(noneOption);
  }
  if (
    selected &&
    !searchBlocked &&
    !items.some((o) => sameValue(o[optionsId], selected[optionsId]))
  ) {
    displayOptions.push(selected);
  }
  displayOptions.push(...items);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          toggleDropdown();
          return;
        }
        setActiveIndex((prev) =>
          displayOptions.length === 0
            ? -1
            : Math.min(prev + 1, displayOptions.length - 1)
        );
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) return;
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      }
      case "Enter": {
        if (!isOpen) {
          event.preventDefault();
          toggleDropdown();
          return;
        }
        if (activeIndex >= 0 && activeIndex < displayOptions.length) {
          event.preventDefault();
          handleOptionClick(
            displayOptions[activeIndex],
            event as unknown as React.MouseEvent
          );
        }
        break;
      }
      case "Escape": {
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
          setSearchText("");
          setActiveIndex(-1);
        }
        break;
      }
      case "Tab": {
        if (isOpen) {
          setIsOpen(false);
          setSearchText("");
          setActiveIndex(-1);
        }
        break;
      }
    }
  };

  // Mantém a opção ativa visível durante a navegação por teclado
  useEffect(() => {
    if (activeIndex < 0) return;
    const activeElement = document.getElementById(
      `${baseId}-option-${activeIndex}`
    );
    if (activeElement && activeElement.scrollIntoView) {
      activeElement.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, baseId]);

  // Nunca deixar o campo em branco quando HA valor. Se o rótulo ainda esta sendo
  // resolvido, mostra o texto de carregando; se o consumidor nao informou
  // selectedOption/loadSelectedOption, cai no valor cru — feio, mas VISIVEL.
  // Antes retornava "", e o combo aparecia vazio mesmo com valor selecionado
  // (o bug classico de editar um registro cujo item nao esta na 1a pagina).
  const editorDescription = selected
    ? selected[optionsDescription]
    : hasValue
    ? resolvingSelected
      ? texts.loadingText
      : String(value)
    : placeholder || optionsNoneSelectedText;

  const minLengthForHint = Math.max(minSearchLength, 1);
  let dropdownContent: React.ReactNode;
  if (error) {
    dropdownContent = renderError ? (
      renderError(error, retry)
    ) : (
      <div
        className={cx(
          config,
          selectClasses.optionsMessage,
          selectClasses.optionsError
        )}
      >
        <span>{texts.loadErrorText}</span>{" "}
        <a
          href="#!"
          className={selectClasses.optionsRetry}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            retry();
          }}
        >
          {texts.retryText}
        </a>
      </div>
    );
  } else if (loading) {
    dropdownContent = renderLoading ? (
      renderLoading()
    ) : (
      <div className={selectClasses.optionsMessage}>{texts.loadingText}</div>
    );
  } else if (searchBlocked) {
    dropdownContent = (
      <div className={selectClasses.optionsMessage}>
        {text("minSearchText", minLengthForHint)}
      </div>
    );
  } else if (displayOptions.length === 0) {
    dropdownContent = renderEmpty ? (
      renderEmpty(debouncedSearch)
    ) : (
      <div className={selectClasses.optionsMessage}>{texts.noResultsText}</div>
    );
  } else {
    dropdownContent = (
      <>
        {displayOptions.map((option, index) => (
          <SelectOption
            key={`${index}-${String(option[optionsId])}`}
            id={`${baseId}-option-${index}`}
            option={option}
            optionsId={optionsId}
            optionsDescription={optionsDescription}
            isSelected={hasValue && sameValue(option[optionsId], value)}
            isActive={index === activeIndex}
            isDisabled={isDisabled}
            searchText={debouncedSearch}
            optionRenderer={optionRenderer}
            onOptionClick={handleOptionClick}
          />
        ))}
        {loadingMore ? (
          <div className={selectClasses.optionsMessage}>
            {texts.loadingMoreText}
          </div>
        ) : null}
        {hasMore ? (
          <div
            ref={sentinelRef}
            className={selectClasses.optionsSentinel}
            aria-hidden="true"
          />
        ) : null}
      </>
    );
  }

  const classes = mapToCssModules(
    cx(config, className, selectClasses.container, {
      [config.components.editor.classes.controlGroupDisabledControl]:
        isDisabled,
    })
  );
  const openClass = isOpen ? selectClasses.open : "";

  return (
    <div
      ref={containerRef}
      tabIndex={isDisabled ? -1 : 0}
      className={classes}
      {...dataAttrs(config, {
        state: isOpen ? "open" : "closed",
        disabled: isDisabled,
        invalid: controlState?.invalid,
        required: controlState?.required,
      })}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-owns={`${baseId}-listbox`}
      onClick={isDisabled ? undefined : toggleDropdown}
      onKeyDown={handleKeyDown}
      onMouseDown={() => {
        interactingRef.current = true;
      }}
      onBlur={handleContainerBlur}
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
          className={selectClasses.optionsContainer}
          style={{ width: `${containerWidth}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {!isDisabled ? (
            <input
              type="text"
              className={selectClasses.searchInput}
              value={searchText}
              ref={searchInputRef}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              disabled={isDisabled}
              role="searchbox"
              aria-autocomplete="list"
              aria-controls={`${baseId}-listbox`}
              aria-activedescendant={
                activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined
              }
            />
          ) : null}

          <div
            ref={dropdownRef}
            id={`${baseId}-listbox`}
            role="listbox"
            className={selectClasses.dropdown}
          >
            {dropdownContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export { AsyncSelect };
export default AsyncSelect;
