import {
  forwardRef,
  Fragment,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";

import {
  AlignType,
  ColumnType,
  SelectionType,
  TableColumnProps,
  TableProps,
  TableRef,
  TableViewMode,
} from "./types";
import { flushSync } from "react-dom";
import { Util } from "./util";
import { classNames } from "../Utils/utils";
import { useSmartConfig } from "../hook/useSmartConfig";
import { TablePagination } from "./TablePagination";
import { Loading } from "../Loading";
import { ScreenSize } from "../types";

// Determine the default view mode based on screen size
const getDefaultViewMode = (defaultCardBelow: ScreenSize): TableViewMode => {
  const screenSize = Util.getScreenSize();
  const order: ScreenSize[] = [
    ScreenSize.XS,
    ScreenSize.SM,
    ScreenSize.MD,
    ScreenSize.LG,
    ScreenSize.XL,
    ScreenSize.XXL,
  ];

  return order.indexOf(screenSize) < order.indexOf(defaultCardBelow)
    ? TableViewMode.CARD
    : TableViewMode.TABLE;
};

// Helper function to process data for grouping
const processDataForGrouping = (
  data: any[],
  groupFields: string[],
  expandedGroups: Set<string>,
  groupingConfig: any
): any[] => {
  if (!groupFields.length || data.length === 0) return data;

  const result: any[] = [];
  const groups = new Map();

  // Group data by specified fields (mantém igual)
  data.forEach((record) => {
    let currentMap = groups;
    groupFields.forEach((field, level) => {
      const value = record[field];
      const groupKey =
        level === 0 ? value : `${Array.from(currentMap.keys())[0]}_${value}`;

      if (!currentMap.has(groupKey)) {
        currentMap.set(groupKey, {
          records: [],
          children: new Map(),
          groupValue: value,
          groupLevel: level,
          groupValues: groupFields.slice(0, level + 1).map((f) => record[f]),
        });
      }

      const group = currentMap.get(groupKey);
      if (level === groupFields.length - 1) {
        group.records.push(record);
      } else {
        currentMap = group.children;
      }
    });
  });

  // Flatten groups into result array
  const flattenGroups = (map: Map<any, any>, parentKey: string = ""): void => {
    map.forEach((group, key) => {
      const fullKey = parentKey ? `${parentKey}_${key}` : key;

      // CORREÇÃO: Lógica correta para determinar se o grupo está expandido
      const isInitiallyExpanded = groupingConfig.expandAllGroups;
      const wasManuallyCollapsed = expandedGroups.has(`collapsed_${fullKey}`);
      const wasManuallyExpanded = expandedGroups.has(fullKey);

      const isExpanded = wasManuallyExpanded
        ? true
        : wasManuallyCollapsed
        ? false
        : isInitiallyExpanded;

      // Add group header
      result.push({
        __isGroupHeader: true,
        __groupKey: fullKey,
        __groupLevel: group.groupLevel,
        __groupValues: group.groupValues,
        __groupRecords: group.records,
        __isExpanded: isExpanded,
      });

      // Add records if expanded
      if (isExpanded) {
        if (group.children.size > 0) {
          flattenGroups(group.children, fullKey);
        } else {
          result.push(...group.records);
        }
      }

      // Add group footer if defined
      if (groupingConfig.groupFooterRender && group.records.length > 0) {
        result.push({
          __isGroupFooter: true,
          __groupKey: fullKey,
          __groupLevel: group.groupLevel,
          __groupValues: group.groupValues,
          __groupRecords: group.records,
        });
      }
    });
  };

  flattenGroups(groups);
  return result;
};

export const Table = forwardRef<TableRef, TableProps>(
  (
    {
      columns,
      columnsDetail,
      dataDetailProperty,
      showHeader = true,
      showDetailHeader = true,
      enableHoverEffect = true,
      enableHoverEffectDetail = true,
      singleRecordTable = false,
      uniqueHeaderSingleRecordTable = false,
      onDoubleClick,
      onDoubleClickDetail,
      onCheckedChange,
      onCheckedAllChange,
      rowFooterRender,
      rowDetailFooterRender,
      timeZone,
      culture,
      selection = SelectionType.NONE,
      enableSelectAll = false,
      cardViewModeBelow = ScreenSize.MD,
      noRecordMessage,
      sortAscendingIcon,
      sortDescendingIcon,
      sortDefaultIcon,
      viewMode = getDefaultViewMode(cardViewModeBelow),
      rowClassName,
      rowDetailClassName,
      data = [],
      className,
      classNameDetail,
      pagination = {},

      // New data management props
      enableDataManagement = false,
      onFetchData,
      loading: externalLoading = false,
      loadingText,
      autoLoad = true,
      onDataLoaded,
      onLoadingStateChange,
      onError,

      // Grouping props
      grouping,
    },
    ref
  ) => {
    const {
      totalRecords,
      currentPage = 1,
      pageSize = 10,
      totalPages,
      showPagination = false,
      paginationPosition = "bottom",
      customPaginationRender,
      onPageChange,
    } = pagination;

    const config = useSmartConfig();

    const [sortedColumn, setSortedColumn] = useState<TableColumnProps>(null);
    const [isSortedDesc, setIsSortedDesc] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);

    // Internal state for data management
    const [internalData, setInternalData] = useState<any[]>([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalTotalRecords, setInternalTotalRecords] = useState(0);
    const [internalTotalPages, setInternalTotalPages] = useState(0);

    // Grouping state
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
      new Set()
    );
    const [groupedData, setGroupedData] = useState<any[]>([]);

    // Grouping configuration with safe defaults
    const groupingConfig = grouping || {};
    const {
      enableGrouping = false,
      groupBy = [],
      expandAllGroups = false,
      showGroupCount = true,
      collapsibleGroups = true,
      groupSeparator = " > ",
      groupHeaderRender,
      groupFooterRender,
    } = groupingConfig;

    const tableTexts = config.components.table.texts ?? ({} as any);
    const texts = {
      selectAllAriaLabel: tableTexts.selectAllAriaLabel,
      selectRowAriaLabel: tableTexts.selectRowAriaLabel,
      groupCountSingular: tableTexts.groupCountSingular,
      groupCountPlural: tableTexts.groupCountPlural,
      groupHeaderCountFormat: tableTexts.groupHeaderCountFormat,
      groupFooterText: tableTexts.groupFooterText,
      exportNoRowsWarning: tableTexts.exportNoRowsWarning,
    };

    const screenSize = Util.getScreenSize();
    const order: ScreenSize[] = [
      ScreenSize.XS,
      ScreenSize.SM,
      ScreenSize.MD,
      ScreenSize.LG,
      ScreenSize.XL,
      ScreenSize.XXL,
    ];
    const screenIdx = order.indexOf(screenSize);

    const finalTimeZone = timeZone ?? config.components.table.behavior.timeZone;
    const finalCulture = culture ?? config.components.table.behavior.culture;
    const finalNoRecordMessage =
      noRecordMessage ?? config.components.table.texts.noRecordMessage;
    const finalLoadingText =
      loadingText ?? config.components.table.texts.loadingText;
    const finalSortAscendingIcon =
      sortAscendingIcon ??
      config.components.table.icons.sortAscending ??
      "fas fa-sort-up";
    const finalSortDescendingIcon =
      sortDescendingIcon ??
      config.components.table.icons.sortDescending ??
      "fas fa-sort-down";
    const finalSortDefaultIcon =
      sortDefaultIcon ??
      config.components.table.icons.sortDefault ??
      "fas fa-sort";

    // Determine data source and states
    const isManaged = enableDataManagement && onFetchData;
    const displayData = isManaged ? internalData : data;
    const loading = isManaged ? internalLoading : externalLoading;
    const displayCurrentPage = isManaged ? internalCurrentPage : currentPage;
    const displayTotalRecords = isManaged ? internalTotalRecords : totalRecords;
    const displayTotalPages = isManaged
      ? internalTotalPages
      : totalPages || Math.ceil((totalRecords || 0) / pageSize);
    const allSelected =
      displayData.length > 0 && selectedRows.length === displayData.length;
    const someSelected =
      selectedRows.length > 0 && selectedRows.length < displayData.length;
    // Fetch data when enableDataManagement is true
    useEffect(() => {
      if (isManaged && autoLoad) {
        fetchData(internalCurrentPage);
      }
    }, [isManaged, autoLoad, internalCurrentPage]);

    // Process data for grouping
    useEffect(() => {
      if (!enableGrouping || !groupBy || displayData.length === 0) {
        setGroupedData(displayData);
        return;
      }

      useEffect(() => {
        if (
          selection === SelectionType.CHECKBOX ||
          selection === SelectionType.MULTIPLE
        ) {
          setSelectedRows([]);
          onCheckedAllChange?.(false);
        }
      }, [displayData, selection]);

      const groupFields = Array.isArray(groupBy) ? groupBy : [groupBy];
      const processedData = processDataForGrouping(
        displayData,
        groupFields,
        expandedGroups,
        groupingConfig
      );
      setGroupedData(processedData);
    }, [displayData, enableGrouping, groupBy, expandedGroups, groupingConfig]);

    const fetchData = async (page: number) => {
      if (!onFetchData) return;

      const loadingState = true;
      setInternalLoading(loadingState);
      onLoadingStateChange?.(loadingState);

      try {
        const result = await onFetchData({
          page,
          pageSize,
        });

        setInternalData(result.data || []);
        setInternalTotalRecords(result.totalRecords || 0);
        setInternalTotalPages(
          result.totalPages || Math.ceil((result.totalRecords || 0) / pageSize)
        );

        onDataLoaded?.(result.data, result.totalRecords);
      } catch (error) {
        console.error("Error fetching table data:", error);
        setInternalData([]);
        setInternalTotalRecords(0);
        setInternalTotalPages(0);
        onError?.(error);
      } finally {
        const loadingState = false;
        setInternalLoading(loadingState);
        onLoadingStateChange?.(loadingState);
      }
    };

    const clearSelection = () => {
      flushSync(() => setSelectedRows([]));
      onCheckedAllChange?.(false);
    };

    const handlePageChange = (page: number) => {
      if (
        selection === SelectionType.CHECKBOX ||
        selection === SelectionType.MULTIPLE
      ) {
        clearSelection();
      }

      if (isManaged) {
        setInternalCurrentPage(page);
      } else {
        onPageChange?.(page);
      }
    };

    // Group toggle handler
    const handleGroupToggle = (groupKey: string) => {
      if (!collapsibleGroups) return;

      setExpandedGroups((prev) => {
        const newSet = new Set(prev);

        // Se o grupo está atualmente expandido (ou está no estado inicial expandido)
        const isCurrentlyExpanded =
          newSet.has(groupKey) ||
          (expandAllGroups && !newSet.has(`collapsed_${groupKey}`));

        if (isCurrentlyExpanded) {
          // Minimizar: adiciona uma marcação especial para grupos que foram minimizados
          newSet.delete(groupKey);
          newSet.add(`collapsed_${groupKey}`);
        } else {
          // Expandir: remove a marcação de minimizado
          newSet.add(groupKey);
          newSet.delete(`collapsed_${groupKey}`);
        }

        return newSet;
      });
    };

    // Filter visible columns based on responsive rules
    const visibleColumns = columns.filter((c) => {
      // 1) showOn has highest priority
      if (c.showOn?.length) return c.showOn.includes(screenSize);

      // 2) explicitly hide on current breakpoint
      if (c.hiddenOn?.includes(screenSize)) return false;

      // 3) relative rules
      if (c.hideBelow && screenIdx < order.indexOf(c.hideBelow)) return false;
      if (c.hideAbove && screenIdx > order.indexOf(c.hideAbove)) return false;

      return true; // visible by default
    });

    useImperativeHandle(ref, () => ({
      getSelectedRows: () => {
        return selectedRows.map((index) => displayData[index]);
      },
      selectRow: (rowIndex: number) => {
        if (!selectedRows.includes(rowIndex)) {
          setSelectedRows((prevSelected) => [...prevSelected, rowIndex]);
        }
      },
      deselectRow: (rowIndex: number) => {
        setSelectedRows((prevSelected) =>
          prevSelected.filter((index) => index !== rowIndex)
        );
      },
      selectAll: () => {
        const allRows = displayData.map((_, index) => index);
        setSelectedRows(allRows);
        if (onCheckedAllChange) {
          onCheckedAllChange(true);
        }
      },
      deselectAll: () => {
        setSelectedRows([]);
        if (onCheckedAllChange) {
          onCheckedAllChange(false);
        }
      },
      exportData: (format: "csv" | "excel" | "pdf") => {
        // Get rows to be exported (exclude group headers/footers)
        const rowsToExport = displayData.filter(
          (record) => !record.__isGroupHeader && !record.__isGroupFooter
        );

        const rows =
          selection !== SelectionType.CHECKBOX &&
          selection !== SelectionType.MULTIPLE
            ? rowsToExport
            : selectedRows.map((index) => displayData[index]);

        if (rows.length === 0) {
          console.warn(texts.exportNoRowsWarning);
          return;
        }

        // Create headers based on columns
        const headers = columns.map((col) => col.header || col.accessor || "");

        // Process cell values for export
        const processedRows = rows.map((record) =>
          columns.map((column) => renderCellValueForExport(record, column))
        );

        if (format === "csv") {
          // Generate CSV content
          const csvContent = [
            headers.join(","), // Headers
            ...processedRows.map((row) =>
              row
                .map((value) => `"${value}"`) // Escape values
                .join(",")
            ),
          ].join("\n");

          // Create and download CSV file
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "export.csv";
          a.click();
          URL.revokeObjectURL(url);
        }

        // Future implementations for Excel and PDF can be added here
      },
    }));

    const handleSelectAll = (event) => {
      if (event.target.checked) {
        const allRows = displayData.map((_, index) => index);
        flushSync(() => {
          setSelectedRows(allRows);
        });
        if (onCheckedAllChange) {
          onCheckedAllChange(true);
        }
      } else {
        flushSync(() => {
          setSelectedRows([]);
        });
        if (onCheckedAllChange) {
          onCheckedAllChange(false);
        }
      }
    };

    const handleSelect = (event, rowIndex) => {
      if (event.target.checked) {
        flushSync(() => {
          setSelectedRows((prevSelected) => [...prevSelected, rowIndex]);
        });
        if (onCheckedChange) {
          onCheckedChange(displayData[rowIndex], rowIndex, true); // Trigger event when selecting
        }
      } else {
        flushSync(() => {
          setSelectedRows((prevSelected) =>
            prevSelected.filter((index) => index !== rowIndex)
          );
        });
        if (onCheckedChange) {
          onCheckedChange(displayData[rowIndex], rowIndex, false); // Trigger event when unchecking
        }
      }
    };

    const generateSortingIndicator = (column: TableColumnProps) => {
      // ✅ Only show indicator if column is sortable
      if (column.enableSort !== true) {
        return finalSortDefaultIcon ? (
          <i
            className={finalSortDefaultIcon}
            style={{ opacity: 0, visibility: "hidden", marginLeft: "5px" }}
          />
        ) : null;
      }

      if (sortedColumn && sortedColumn.accessor === column.accessor) {
        return (
          <i
            className={
              isSortedDesc ? finalSortDescendingIcon : finalSortAscendingIcon
            }
            style={{ marginLeft: "5px" }}
          />
        );
      }

      return finalSortDefaultIcon ? (
        <i
          className={finalSortDefaultIcon}
          style={{ opacity: 0.3, marginLeft: "5px" }}
        />
      ) : null;
    };

    const handleSort = (column: TableColumnProps) => {
      if (column.enableSort !== true) return;

      if (sortedColumn && sortedColumn.accessor === column.accessor) {
        setIsSortedDesc(!isSortedDesc);
      } else {
        setSortedColumn(column);
        setIsSortedDesc(false);
      }
    };

    const sortedData = [...displayData].sort((a, b) => {
      if (!sortedColumn) return 0;

      const valueA = a.hasOwnProperty(sortedColumn.accessor)
        ? a[sortedColumn.accessor]
        : Util.getDefaultValue(sortedColumn.type);
      const valueB = b.hasOwnProperty(sortedColumn.accessor)
        ? b[sortedColumn.accessor]
        : Util.getDefaultValue(sortedColumn.type);

      if (sortedColumn.type === ColumnType.DATE) {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        if (dateA < dateB) return isSortedDesc ? 1 : -1;
        if (dateA > dateB) return isSortedDesc ? -1 : 1;
        return 0;
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        if (valueA < valueB) return isSortedDesc ? 1 : -1;
        if (valueA > valueB) return isSortedDesc ? -1 : 1;
        return 0;
      }

      if (valueA < valueB) return isSortedDesc ? 1 : -1;
      if (valueA > valueB) return isSortedDesc ? -1 : 1;
      return 0;
    });

    // Determine which data to render
    const dataToRender = enableGrouping ? groupedData : sortedData;

    const renderCellValue = (
      record,
      column: TableColumnProps,
      row: number,
      parent: any = null,
      parentRow?: number
    ) => {
      // Skip rendering for group headers/footers
      if (record.__isGroupHeader || record.__isGroupFooter) {
        return null;
      }

      let value = Util.getColumnValue(column, record);
      if (
        column.hideMinOrDefaultValue &&
        Util.isMinOrDefaultValue(value, column.type)
      ) {
        value = null;
      }

      if (column.renderCell) {
        return column.renderCell({
          record,
          value,
          row,
          parent,
          parentRow,
        });
      }

      if (value !== undefined && value !== null) {
        if (column.sourceList && Array.isArray(column.sourceList)) {
          const sourceValueProperty =
            column.sourceValueProperty ??
            config.components.table.behavior.sourceValueProperty;
          const sourceDescriptionProperty =
            column.sourceDescriptionProperty ??
            config.components.table.behavior.sourceDescriptionProperty;
          if (sourceValueProperty && sourceDescriptionProperty) {
            const foundItem = column.sourceList.find(
              (item) => item[sourceValueProperty] === value
            );

            if (foundItem) {
              value = foundItem[sourceDescriptionProperty];
              if (column.displayBadge) {
                const sourceBadgeProperty =
                  column.sourceBadgeProperty ??
                  config.components.table.behavior.sourceBadgeProperty;
                if (sourceBadgeProperty) {
                  const badgeClasses = Util.mapToCssModules(
                    classNames(
                      config.components.table.classes.badge,
                      foundItem[sourceBadgeProperty]
                    )
                  );
                  return <div className={badgeClasses}>{value}</div>;
                }
              }
              return value;
            }
          }
        }

        if (column.format) {
          const formatOptions = {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          };

          if (column.format.match(/[cdfnp]/i)) {
            const decimalPlaces =
              column.format.length > 1
                ? parseInt(column.format.substring(1))
                : 0;
            formatOptions.minimumFractionDigits = decimalPlaces;
            formatOptions.maximumFractionDigits = decimalPlaces;
          }

          switch (column.format.charAt(0)) {
            case "d":
              return Util.formatDate(
                value,
                finalCulture,
                { year: "numeric", month: "numeric", day: "numeric" },
                finalTimeZone
              );
            case "D":
              return Util.formatDate(
                value,
                finalCulture,
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
                finalTimeZone
              );
            case "t":
              return Util.formatDate(
                value,
                finalCulture,
                { hour: "2-digit", minute: "2-digit" },
                finalTimeZone
              );
            case "T":
              return Util.formatDate(
                value,
                finalCulture,
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                },
                finalTimeZone
              );
            case "c":
            case "C":
              return parseFloat(value).toLocaleString(finalCulture, {
                style: "currency",
                currency: "BRL",
                ...formatOptions,
              });
            case "f":
            case "F":
              return parseFloat(value).toLocaleString(
                finalCulture,
                formatOptions
              );
            case "n":
            case "N":
              return parseInt(value, 10).toLocaleString(
                finalCulture,
                formatOptions
              );
            case "p":
            case "P":
              return `${parseFloat(value).toFixed(2)}%`;
            default:
              return value;
          }
        }

        if (column.mask) {
          return typeof column.mask === "string"
            ? Util.applyMask(value, column.mask)
            : column.mask(record);
        }
        switch (column.type) {
          case ColumnType.FLOAT:
            return parseFloat(value).toLocaleString(finalCulture, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          case ColumnType.DATE:
            return Util.getFormattedDate(value, finalTimeZone, finalCulture);
          case ColumnType.DATETIME:
            return Util.getFormattedDateTime(
              value,
              finalTimeZone,
              finalCulture
            );
          case ColumnType.INT:
            return parseInt(value, 10);
          default: {
            return value;
          }
        }
      }
    };

    const renderCellValueForExport = (record, column: TableColumnProps) => {
      // Skip group headers/footers in export
      if (record.__isGroupHeader || record.__isGroupFooter) {
        return "";
      }

      let value = Util.getColumnValue(column, record);

      if (value !== undefined && value !== null) {
        if (column.format) {
          const formatOptions = {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          };

          if (column.format.match(/[cdfnp]/i)) {
            const decimalPlaces =
              column.format.length > 1
                ? parseInt(column.format.substring(1))
                : 0;
            formatOptions.minimumFractionDigits = decimalPlaces;
            formatOptions.maximumFractionDigits = decimalPlaces;
          }

          switch (column.format.charAt(0)) {
            case "d":
              return Util.formatDate(
                value,
                finalCulture,
                { year: "numeric", month: "numeric", day: "numeric" },
                finalTimeZone
              );
            case "D":
              return Util.formatDate(
                value,
                finalCulture,
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
                finalTimeZone
              );
            case "t":
              return Util.formatDate(
                value,
                finalCulture,
                { hour: "2-digit", minute: "2-digit" },
                finalTimeZone
              );
            case "T":
              return Util.formatDate(
                value,
                finalCulture,
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                },
                finalTimeZone
              );
            case "c":
            case "C":
              return parseFloat(value).toLocaleString(finalCulture, {
                style: "currency",
                currency: "BRL",
                ...formatOptions,
              });
            case "f":
            case "F":
              return parseFloat(value).toLocaleString(
                finalCulture,
                formatOptions
              );
            case "n":
            case "N":
              return parseInt(value, 10).toLocaleString(
                finalCulture,
                formatOptions
              );
            case "p":
            case "P":
              return `${parseFloat(value).toFixed(2)}%`;
            default:
              return value;
          }
        }

        if (column.mask) {
          return typeof column.mask === "string"
            ? Util.applyMask(value, column.mask)
            : column.mask(record);
        }

        switch (column.type) {
          case ColumnType.FLOAT:
            return parseFloat(value).toLocaleString(finalCulture, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          case ColumnType.DATE:
            return Util.getFormattedDate(value, finalTimeZone, finalCulture);
          case ColumnType.DATETIME:
            return Util.getFormattedDateTime(
              value,
              finalTimeZone,
              finalCulture
            );
          case ColumnType.INT:
            return parseInt(value, 10);
          default:
            return value;
        }
      }

      return value || "";
    };

    const classes = Util.mapToCssModules(
      classNames(
        className,
        "table table-bordered",
        enableHoverEffect ? "table-hover" : ""
      )
    );

    const classesDetail = Util.mapToCssModules(
      classNames(
        classNameDetail,
        "table table-bordered",
        enableHoverEffectDetail ? "table-hover" : ""
      )
    );

    const renderHeader = () => {
      return (
        <>
          <thead className="table-light table-nowrap">
            <tr role="row">
              {selection === SelectionType.CHECKBOX && (
                <th
                  role="columnheader"
                  className={`header-checkbox text-center`}
                >
                  {enableSelectAll && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      aria-label={texts.selectAllAriaLabel}
                    />
                  )}
                </th>
              )}
              {visibleColumns.map((column, index) => (
                <th
                  key={`th-header-${index}`}
                  role="columnheader"
                  className={classNames(
                    column.headerClassName,
                    Util.getAlignClassName(column.headerAlign),
                    {
                      "header-filter": !column.disableFilters,
                    }
                  )}
                  style={{
                    ...(column.width ? { width: column.width } : {}),
                  }}
                  onClick={
                    !singleRecordTable && column.enableSort === true
                      ? () => handleSort(column)
                      : null
                  }
                >
                  {column.header}
                  {!singleRecordTable && generateSortingIndicator(column)}
                </th>
              ))}
            </tr>
          </thead>
        </>
      );
    };

    const renderTableHeader = () => {
      return (
        <>
          <div className="table-responsive react-table">
            <table role="table" className={classes}>
              {renderHeader()}
            </table>
          </div>
        </>
      );
    };

    const renderPagination = () => {
      if (!showPagination) {
        return null;
      }

      // Safe calculations to ensure valid numbers
      const safeCurrentPage = Number(displayCurrentPage) || 1;
      const safeTotalRecords = Number(displayTotalRecords) || 0;
      const safeTotalPages =
        Number(displayTotalPages) ||
        Math.ceil(safeTotalRecords / pageSize) ||
        1;

      if (customPaginationRender) {
        return customPaginationRender({
          currentPage: safeCurrentPage,
          totalPages: safeTotalPages,
          totalRecords: safeTotalRecords,
          pageSize: pageSize,
          onPageChange: handlePageChange,
          loading,
        });
      }

      return (
        <TablePagination
          currentPage={safeCurrentPage}
          totalPages={safeTotalPages}
          totalRecords={safeTotalRecords}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
        />
      );
    };

    // Render group header for table view
    const renderGroupHeader = (record: any, rowIndex: number) => {
      const groupLabel = record.__groupValues.join(groupSeparator);
      const recordCount = record.__groupRecords.length;
      const isExpanded = record.__isExpanded;

      const defaultContent = (
        <div
          className={classNames(
            "group-header",
            `group-level-${record.__groupLevel}`,
            {
              "cursor-pointer": collapsibleGroups,
              "group-expanded": isExpanded,
              "group-collapsed": !isExpanded,
            }
          )}
          style={{
            paddingLeft: `${record.__groupLevel * 20}px`,
            backgroundColor: `hsl(${210 - record.__groupLevel * 10}, 80%, 95%)`,
          }}
          onClick={() =>
            collapsibleGroups && handleGroupToggle(record.__groupKey)
          }
        >
          <div className="d-flex align-items-center">
            {collapsibleGroups && (
              <i
                className={classNames(
                  "fas me-2 transition-all",
                  isExpanded ? "fa-chevron-down" : "fa-chevron-right"
                )}
                style={{ fontSize: "0.8rem" }}
              />
            )}
            <strong>
              {groupLabel}
              {showGroupCount &&
                texts.groupHeaderCountFormat
                  .replace("{count}", String(recordCount))
                  .replace(
                    "{label}",
                    recordCount === 1
                      ? texts.groupCountSingular
                      : texts.groupCountPlural
                  )}
            </strong>
          </div>
        </div>
      );

      return (
        <tr key={`group-header-${rowIndex}`} className="group-header-row">
          <td
            colSpan={
              visibleColumns.length +
              (selection === SelectionType.CHECKBOX ? 1 : 0)
            }
            className="group-header-cell p-0"
          >
            {groupHeaderRender
              ? groupHeaderRender(
                  record.__groupValues,
                  record.__groupRecords,
                  record.__groupLevel
                )
              : defaultContent}
          </td>
        </tr>
      );
    };

    // Render group footer for table view
    const renderGroupFooter = (record: any, rowIndex: number) => {
      const defaultContent = (
        <div
          className="group-footer"
          style={{
            paddingLeft: `${record.__groupLevel * 20}px`,
            backgroundColor: `hsl(${210 - record.__groupLevel * 10}, 60%, 97%)`,
          }}
        >
          <em>
            {texts.groupFooterText.replace(
              "{count}",
              String(record.__groupRecords.length)
            )}
          </em>
        </div>
      );

      return (
        <tr key={`group-footer-${rowIndex}`} className="group-footer-row">
          <td
            colSpan={
              visibleColumns.length +
              (selection === SelectionType.CHECKBOX ? 1 : 0)
            }
            className="group-footer-cell p-0"
          >
            {groupFooterRender
              ? groupFooterRender(
                  record.__groupValues,
                  record.__groupRecords,
                  record.__groupLevel
                )
              : defaultContent}
          </td>
        </tr>
      );
    };

    const renderTable = (data) => {
      const handleRowDoubleClick = (
        event: React.MouseEvent<HTMLTableRowElement>,
        rowData: any,
        rowIndex: number
      ) => {
        // Skip group headers/footers
        if (rowData.__isGroupHeader || rowData.__isGroupFooter) return;

        if (onDoubleClick) {
          onDoubleClick(rowData, rowIndex);
        }
      };
      const handleRowDoubleClickDetail = (
        event: React.MouseEvent<HTMLTableRowElement>,
        rowData: any,
        rowDataParent: any,
        rowIndex: number,
        rowIndexParent: number
      ) => {
        if (onDoubleClickDetail) {
          onDoubleClickDetail(rowData, rowDataParent, rowIndex, rowIndexParent);
        }
      };
      const handleCellDoubleClick = (
        rowIndex: number,
        colIndex: number,
        rowData: any,
        column: TableColumnProps
      ) => {
        // Skip group headers/footers
        if (rowData.__isGroupHeader || rowData.__isGroupFooter) return;

        if (column.onDoubleClick) {
          column.onDoubleClick(
            rowIndex,
            colIndex,
            Util.getColumnValue(column, rowData),
            rowData
          );
        }
      };

      const resolveRowClassName = (record: any) => {
        if (record.__isGroupHeader) return "group-header-row";
        if (record.__isGroupFooter) return "group-footer-row";

        if (!rowClassName) return "";
        return typeof rowClassName === "function"
          ? rowClassName(record)
          : rowClassName;
      };

      const resolveDetailRowClassName = (detail: any, parent: any) => {
        if (!rowDetailClassName) return "";
        return typeof rowDetailClassName === "function"
          ? rowDetailClassName(detail, parent)
          : rowDetailClassName;
      };

      return (
        <>
          {data.length > 0 ? (
            <div className="table-responsive react-table">
              <table role="table" className={classes}>
                {showHeader && !uniqueHeaderSingleRecordTable && renderHeader()}

                <tbody>
                  {data.map((record, rowIndex) => (
                    <Fragment key={`fragement-${rowIndex}`}>
                      {/* Group Header */}
                      {record.__isGroupHeader &&
                        renderGroupHeader(record, rowIndex)}

                      {/* Group Footer */}
                      {record.__isGroupFooter &&
                        renderGroupFooter(record, rowIndex)}

                      {/* Regular Data Row */}
                      {!record.__isGroupHeader && !record.__isGroupFooter && (
                        <>
                          <tr
                            key={`tr-${rowIndex}`}
                            role="row"
                            className={classNames(resolveRowClassName(record))}
                            onDoubleClick={(event) =>
                              handleRowDoubleClick(event, record, rowIndex)
                            }
                          >
                            {selection === SelectionType.CHECKBOX && (
                              <td
                                role="cell"
                                className="cell-checkbox text-center"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(
                                    displayData.findIndex(
                                      (item) => item === record
                                    )
                                  )}
                                  onChange={(event) =>
                                    handleSelect(
                                      event,
                                      displayData.findIndex(
                                        (item) => item === record
                                      )
                                    )
                                  }
                                  aria-label={texts.selectRowAriaLabel}
                                />
                              </td>
                            )}
                            {visibleColumns.map((column, colIndex) => (
                              <td
                                key={`td-${colIndex}`}
                                role="cell"
                                className={classNames(
                                  column.contentClassName,
                                  Util.getAlignClassName(column.contentAlign)
                                )}
                                style={{
                                  ...((!showHeader ||
                                    (showHeader &&
                                      uniqueHeaderSingleRecordTable)) &&
                                  column.width
                                    ? { width: column.width }
                                    : {}),
                                }}
                                onDoubleClick={(event) =>
                                  handleCellDoubleClick(
                                    rowIndex,
                                    colIndex,
                                    record,
                                    column
                                  )
                                }
                              >
                                {renderCellValue(record, column, rowIndex)}
                              </td>
                            ))}
                          </tr>

                          {/* ➜ main row footer */}
                          {typeof rowFooterRender === "function" && (
                            <tr
                              key={`tr-footer-${rowIndex}`}
                              className="tr-row-footer"
                            >
                              <td
                                role="cell"
                                className="td-row-footer"
                                colSpan={
                                  (selection === SelectionType.CHECKBOX
                                    ? 1
                                    : 0) + visibleColumns.length
                                }
                              >
                                {rowFooterRender(record, rowIndex)}
                              </td>
                            </tr>
                          )}

                          {columnsDetail && columnsDetail.length > 0 && (
                            <tr
                              key={`tr-detail-${rowIndex}`}
                              role="row"
                              className="tr-detail"
                            >
                              <td
                                colSpan={
                                  visibleColumns.length +
                                  (selection === SelectionType.CHECKBOX ? 1 : 0)
                                }
                              >
                                <table role="table" className={classesDetail}>
                                  {showDetailHeader && (
                                    <thead className="table-light table-nowrap">
                                      <tr
                                        key={`tr-detail-${rowIndex}`}
                                        role="row"
                                      >
                                        {columnsDetail.map(
                                          (columnDetail, index) => (
                                            <th
                                              key={`td-detail-${index}`}
                                              role="columnheader"
                                              className={classNames(
                                                columnDetail.headerClassName,
                                                Util.getAlignClassName(
                                                  columnDetail.headerAlign
                                                ),
                                                {
                                                  "header-filter":
                                                    !columnDetail.disableFilters,
                                                }
                                              )}
                                              style={{
                                                ...(columnDetail.width
                                                  ? {
                                                      width: columnDetail.width,
                                                    }
                                                  : {}),
                                              }}
                                              onClick={() =>
                                                handleSort(columnDetail)
                                              }
                                            >
                                              {columnDetail.header}
                                              {generateSortingIndicator(
                                                columnDetail
                                              )}
                                            </th>
                                          )
                                        )}
                                      </tr>
                                    </thead>
                                  )}

                                  <tbody>
                                    {record[dataDetailProperty].map(
                                      (recordDetail, rowDetailIndex) => (
                                        <Fragment key={rowDetailIndex}>
                                          <tr
                                            role="row"
                                            className={classNames(
                                              resolveDetailRowClassName(
                                                recordDetail,
                                                record
                                              )
                                            )}
                                            onDoubleClick={(event) =>
                                              handleRowDoubleClickDetail(
                                                event,
                                                recordDetail,
                                                record,
                                                rowDetailIndex,
                                                rowIndex
                                              )
                                            }
                                          >
                                            {columnsDetail.map(
                                              (
                                                columnDetail,
                                                colDetailIndex
                                              ) => (
                                                <td
                                                  key={colDetailIndex}
                                                  role="cell"
                                                  className={classNames(
                                                    columnDetail.contentClassName,
                                                    Util.getAlignClassName(
                                                      columnDetail.contentAlign
                                                    )
                                                  )}
                                                  style={{
                                                    ...((!showHeader ||
                                                      (showHeader &&
                                                        uniqueHeaderSingleRecordTable)) &&
                                                    columnDetail.width
                                                      ? {
                                                          width:
                                                            columnDetail.width,
                                                        }
                                                      : {}),
                                                  }}
                                                >
                                                  {renderCellValue(
                                                    recordDetail,
                                                    columnDetail,
                                                    rowDetailIndex,
                                                    record,
                                                    rowIndex
                                                  )}
                                                </td>
                                              )
                                            )}
                                          </tr>

                                          {/* ➜ detail row footer */}
                                          {typeof rowDetailFooterRender ===
                                            "function" && (
                                            <tr className="tr-row-detail-footer">
                                              <td
                                                role="cell"
                                                className="td-row-detail-footer"
                                                colSpan={columnsDetail.length}
                                              >
                                                {rowDetailFooterRender(
                                                  recordDetail,
                                                  record,
                                                  rowDetailIndex,
                                                  rowIndex
                                                )}
                                              </td>
                                            </tr>
                                          )}
                                        </Fragment>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`alert alert-info text-center`} role="alert">
              {finalNoRecordMessage}
            </div>
          )}
        </>
      );
    };

    const renderCards = (data: any[]) => {
      const idx = (s: ScreenSize) => order.indexOf(s);

      const hasValue = (record: any, column: TableColumnProps) => {
        let value = Util.getColumnValue(column, record);
        if (Util.isMinOrDefaultValue(value, column.type)) {
          value = null;
        }
        return value ? true : false;
      };
      // filter detail columns by responsive rules
      const visibleDetailColumns = (columnsDetail ?? []).filter((c) => {
        if (c.showOn?.length) return c.showOn.includes(screenSize);
        if (c.hiddenOn?.includes(screenSize)) return false;
        if (c.hideBelow && idx(screenSize) < idx(c.hideBelow)) return false;
        if (c.hideAbove && idx(screenSize) > idx(c.hideAbove)) return false;
        return true;
      });

      const resolveRowClassName = (record: any) => {
        if (record.__isGroupHeader) return "group-header-card";
        if (record.__isGroupFooter) return "group-footer-card";

        if (!rowClassName) return "";
        return typeof rowClassName === "function"
          ? rowClassName(record)
          : rowClassName;
      };

      const resolveDetailRowClassName = (detail: any, parent: any) => {
        if (!rowDetailClassName) return "";
        return typeof rowDetailClassName === "function"
          ? rowDetailClassName(detail, parent)
          : rowDetailClassName;
      };

      // ➜ No records: show alert
      if (!data || data.length === 0) {
        return (
          <div className={`alert alert-info text-center my-3`} role="alert">
            {finalNoRecordMessage}
          </div>
        );
      }

      return (
        <div className="card-list">
          {data.map((record, rowIndex) => (
            <div
              key={rowIndex}
              className={classNames(
                "card mb-3 p-3 shadow-sm",
                resolveRowClassName(record)
              )}
              onDoubleClick={(e) => {
                if (!record.__isGroupHeader && !record.__isGroupFooter) {
                  onDoubleClick?.(record, rowIndex);
                }
              }}
            >
              {/* Group Header in Card View */}
              {record.__isGroupHeader && (
                <div
                  className={classNames("group-header-card", {
                    "cursor-pointer": collapsibleGroups,
                  })}
                  style={{
                    paddingLeft: `${record.__groupLevel * 15}px`,
                    backgroundColor: `hsl(${
                      210 - record.__groupLevel * 10
                    }, 80%, 95%)`,
                    margin: "-1rem -1rem 1rem -1rem",
                    padding: "1rem",
                    borderBottom: "1px solid #dee2e6",
                  }}
                  onClick={() =>
                    collapsibleGroups && handleGroupToggle(record.__groupKey)
                  }
                >
                  <div className="d-flex align-items-center">
                    {collapsibleGroups && (
                      <i
                        className={classNames(
                          "fas me-2 transition-all",
                          record.__isExpanded
                            ? "fa-chevron-down"
                            : "fa-chevron-right"
                        )}
                        style={{ fontSize: "0.8rem" }}
                      />
                    )}
                    <strong>
                      {record.__groupValues.join(groupSeparator)}
                      {showGroupCount &&
                        ` (${record.__groupRecords.length} registro${
                          record.__groupRecords.length !== 1 ? "s" : ""
                        })`}
                    </strong>
                  </div>
                </div>
              )}

              {/* Group Footer in Card View */}
              {record.__isGroupFooter && (
                <div
                  className="group-footer-card"
                  style={{
                    paddingLeft: `${record.__groupLevel * 15}px`,
                    backgroundColor: `hsl(${
                      210 - record.__groupLevel * 10
                    }, 60%, 97%)`,
                    margin: "1rem -1rem -1rem -1rem",
                    padding: "1rem",
                    borderTop: "1px solid #dee2e6",
                  }}
                >
                  <em>
                    Total do grupo: {record.__groupRecords.length} registros
                  </em>
                </div>
              )}

              {/* Regular Card Content */}
              {!record.__isGroupHeader && !record.__isGroupFooter && (
                <>
                  {/* Main record fields */}
                  {visibleColumns.map((column, colIndex) => {
                    const cellContent = renderCellValue(
                      record,
                      column,
                      rowIndex
                    );

                    const coi = column.cardOnlyIfValue;

                    if (
                      (typeof coi === "function" && !coi(record)) || // function: decides based on record
                      (coi === true && !hasValue(record, column)) // boolean true: only renders if has value
                    ) {
                      return null;
                    }
                    const showHeader = column.cardHeaderVisible !== false;

                    return (
                      <div
                        key={colIndex}
                        className="row gx-2 border-bottom py-2"
                      >
                        {/* Label */}
                        {showHeader && (
                          <div
                            className={classNames(
                              "col-4",
                              column.headerClassName,
                              Util.getAlignClassName(column.headerAlignCard)
                            )}
                          >
                            <strong>{column.header}</strong>
                          </div>
                        )}

                        {/* Value */}
                        <div
                          className={classNames(
                            showHeader ? "col-8" : "col-12",
                            column.contentClassName,
                            Util.getAlignClassName(
                              column.contentAlignCard,
                              AlignType.END
                            )
                          )}
                        >
                          {cellContent}
                        </div>
                      </div>
                    );
                  })}

                  {/* ➜ card footer (main row) */}
                  {typeof rowFooterRender === "function" && (
                    <div className="card-row-footer pt-2">
                      {rowFooterRender(record, rowIndex)}
                    </div>
                  )}

                  {/* Details as nested cards */}
                  {columnsDetail &&
                    columnsDetail.length > 0 &&
                    dataDetailProperty &&
                    Array.isArray(record[dataDetailProperty]) &&
                    record[dataDetailProperty].length > 0 && (
                      <div className="mt-3">
                        {record[dataDetailProperty].map(
                          (recordDetail: any, rowDetailIndex: number) => (
                            <div
                              key={rowDetailIndex}
                              className={classNames(
                                "card mb-2 p-2 bg-light-subtle",
                                resolveDetailRowClassName(recordDetail, record)
                              )}
                              onDoubleClick={() =>
                                onDoubleClickDetail?.(
                                  recordDetail,
                                  record,
                                  rowDetailIndex,
                                  rowIndex
                                )
                              }
                            >
                              {visibleDetailColumns.map(
                                (columnDetail, colDetailIndex) => {
                                  const cellDetail = renderCellValue(
                                    recordDetail,
                                    columnDetail,
                                    rowDetailIndex,
                                    record,
                                    rowIndex
                                  );

                                  const coi = columnDetail.cardOnlyIfValue;

                                  if (
                                    (typeof coi === "function" &&
                                      !coi(recordDetail)) || // function: decides based on record
                                    (coi === true &&
                                      !hasValue(recordDetail, columnDetail)) // boolean true: only renders if has value
                                  ) {
                                    return null;
                                  }

                                  // in CARD, label depends only on cardHeaderVisible
                                  const showHeaderDetail =
                                    columnDetail.cardHeaderVisible !== false;

                                  return (
                                    <div
                                      key={colDetailIndex}
                                      className="row gx-2 border-bottom py-2"
                                    >
                                      {showHeaderDetail && (
                                        <div
                                          className={classNames(
                                            "col-4",
                                            columnDetail.headerClassName,
                                            Util.getAlignClassName(
                                              columnDetail.headerAlignCard ??
                                                columnDetail.headerAlign
                                            )
                                          )}
                                        >
                                          <strong>{columnDetail.header}</strong>
                                        </div>
                                      )}

                                      <div
                                        className={classNames(
                                          showHeaderDetail ? "col-8" : "col-12",
                                          columnDetail.contentClassName,
                                          Util.getAlignClassName(
                                            columnDetail.contentAlignCard ??
                                              columnDetail.contentAlign,
                                            AlignType.END
                                          )
                                        )}
                                      >
                                        {cellDetail}
                                      </div>
                                    </div>
                                  );
                                }
                              )}

                              {/* ➜ detail card footer */}
                              {typeof rowDetailFooterRender === "function" && (
                                <div className="card-row-detail-footer pt-2">
                                  {rowDetailFooterRender(
                                    recordDetail,
                                    record,
                                    rowDetailIndex,
                                    rowIndex
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                </>
              )}
            </div>
          ))}
        </div>
      );
    };

    const renderContent = (rows: any[]) =>
      viewMode === TableViewMode.CARD ? renderCards(rows) : renderTable(rows);

    // Show loading state
    if (loading) {
      return <Loading text={finalLoadingText} />;
    }

    return (
      <div className="smart-table-container">
        {/* Top pagination */}
        {(paginationPosition === "top" || paginationPosition === "both") &&
          renderPagination()}

        {/* Main table content */}
        {!singleRecordTable ? (
          <Fragment>{renderContent(dataToRender)}</Fragment>
        ) : (
          <Fragment>
            {uniqueHeaderSingleRecordTable &&
              viewMode === TableViewMode.TABLE &&
              renderTableHeader()}
            {dataToRender.map((record, index) => (
              <Fragment key={`fra-${index}`}>
                {renderContent([record])}
              </Fragment>
            ))}
          </Fragment>
        )}

        {/* Bottom pagination */}
        {(paginationPosition === "bottom" || paginationPosition === "both") &&
          renderPagination()}
      </div>
    );
  }
);
