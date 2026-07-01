import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { filterData } from '@/utils/search/filterData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import useViewportWidth from '@/hooks/useViewportWidth';
import { MillisRangeDatePicker as DatePicker } from '@/components/common/DatePicker';

import { ColumnMenu } from './components/ColumnMenu/ColumnMenu';
import { FilterUI } from './components/MenuFilter/MenuFilter';
import { TableBody } from './components/Table/TableBody/TableBody';
import { VirtualTableBody } from './components/Table/TableBody/VirtualTableBody';
import TableFooter from './components/Table/TableFooter/TableFooter';
import { TableHeader } from './components/Table/TableHeader/TableHeader';
import { ExpanderButton } from './components/Table/TableRow.styles';
import { useColumnOrder } from './hooks/useColumnOrder';
import { useTablePagination } from './hooks/usePagination';
import useTableFiltering, {
  useDynamicFilterConfig,
} from './hooks/useTableFilter';
import useTableSorting from './hooks/useTableSorting';

import type { TableRow } from './types/ColumnTypes';
import type {
  AdvancedTableColumn,
  AdvancedTableFilterConfig,
  AdvancedTableProps,
  AdvancedTableScrollMetrics,
} from './types/AdvancedTableTypes';
import type { DefaultTheme } from 'styled-components';

interface UserSliceState {
  uid?: string | null;
}

interface UserStoreState {
  user?: {
    user?: UserSliceState | null;
  };
}

const EMPTY_COLUMNS: AdvancedTableColumn<TableRow>[] = [];
const EMPTY_ROWS: TableRow[] = [];
const EMPTY_FILTER_CONFIG: AdvancedTableFilterConfig[] = [];

const toGroupKey = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return '';
};

const groupDataByField = <Row extends TableRow>(
  data: Row[],
  field: string,
): Record<string, Row[]> =>
  data.reduce<Record<string, Row[]>>((acc, item) => {
    const key = toGroupKey((item as TableRow)[field]);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

const invokeScrollHandler = (
  handler: ((event: UIEvent<HTMLDivElement>) => void) | undefined,
  event: UIEvent<HTMLDivElement>,
) => {
  if (!handler) return;
  try {
    handler(event);
  } catch {
    // Ignore consumer scroll handler failures.
  }
};

const invokeScrollMetricsHandler = (
  handler: ((metrics: AdvancedTableScrollMetrics) => void) | undefined,
  metrics: AdvancedTableScrollMetrics,
) => {
  if (!handler) return;
  try {
    handler(metrics);
  } catch {
    // Ignore consumer metric handler failures.
  }
};

const useWideLayout = (): boolean => {
  return useMediaQuery('(min-width: 1600px)');
};

const selectUserUid = (state: UserStoreState): string | undefined => {
  const maybeUser = state.user?.user;
  return typeof maybeUser?.uid === 'string' ? maybeUser.uid : undefined;
};

const AdvancedTableInner = <Row extends TableRow = TableRow>({
  // Behaviour
  groupBy,
  numberOfElementsPerPage = 30,
  loading = false,
  // UI sizing
  rowSize = 'medium',
  rowBorder,

  // Custom UI hooks
  headerComponent,
  filterUI = false,
  datePicker = false,
  footerLeftSide,
  footerRightSide,

  // Data / config
  columns = EMPTY_COLUMNS as AdvancedTableColumn<Row>[],
  data = EMPTY_ROWS as Row[],
  filterConfig = EMPTY_FILTER_CONFIG,
  searchTerm = '',
  elementName,
  tableName,

  // Date filter
  dateRange,
  defaultDate,
  setDateRange,

  // Misc
  emptyText = 'No hay datos para mostrar',
  onRowClick,
  title,
  // Scroll events (optional)
  onScroll,
  onScrollMetrics,

  // Expandable rows (optional)
  expandedRowRender,
  rowExpandable,
  getRowId,
  enableVirtualization = false,
  paginateVirtualizedData = false,
  showPagination = true,
}: AdvancedTableProps<Row>) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const userUid = useSelector<UserStoreState, string | undefined>(
    selectUserUid,
  );

  const columnsWithExpander = useMemo(() => {
    if (!expandedRowRender) return columns;

    const expanderCol: AdvancedTableColumn<Row> = {
      Header: '',
      accessor: '_expander',
      minWidth: '36px',
      maxWidth: '36px',
      keepWidth: true,
      fixed: 'left',
      sortable: false,
      clickable: false,
      cell: ({ value }) => {
        const expanderValue = value as
          | { expanded?: boolean; toggle?: () => void }
          | undefined;
        const isExpanded = !!expanderValue?.expanded;
        const toggle = expanderValue?.toggle;
        return (
          <ExpanderButton
            type="button"
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
            onClick={(event) => {
              event.stopPropagation();
              if (toggle) toggle();
            }}
          >
            {isExpanded ? icons.arrows.caretDown : icons.arrows.caretRight}
          </ExpanderButton>
        );
      },
    };

    return [expanderCol, ...columns];
  }, [columns, expandedRowRender]);

  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);
  const [columnOrder, setColumnOrder, resetColumnOrder] = useColumnOrder<
    AdvancedTableColumn<Row>
  >(columnsWithExpander, tableName, userUid);

  const toggleReorderMenu = () => {
    setIsReorderMenuOpen((prev) => !prev);
  };

  const [filter, setFilter, setDefaultFilter, defaultFilter, filteredData] =
    useTableFiltering(filterConfig, data);

  const dynamicFilterConfig = useDynamicFilterConfig(filterConfig, data);

  const searchTermFilteredData = useMemo(() => {
    if (!searchTerm) return filteredData;
    return filterData(filteredData, searchTerm) ?? filteredData;
  }, [filteredData, searchTerm]);

  const { handleSort, sortedData, sortConfig } = useTableSorting(
    searchTermFilteredData,
    columnsWithExpander,
  );

  const {
    currentData,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    currentPage,
    pageCount,
  } = useTablePagination(
    data,
    sortedData,
    searchTermFilteredData,
    numberOfElementsPerPage,
    wrapperRef,
  );

  const shouldUseVirtualization = enableVirtualization && !loading;
  const shouldPaginateVirtualized =
    shouldUseVirtualization && paginateVirtualizedData && showPagination;

  const shouldGroup = Boolean(
    (sortConfig.direction === 'none' || sortConfig.key === null) && groupBy,
  );

  // Si hay virtualización con paginación, agrupamos solo la página actual.
  // En caso contrario, la virtualización agrupa todo el dataset (sortedData).
  const dataToGroup = useMemo(
    () =>
      shouldUseVirtualization
        ? shouldPaginateVirtualized
          ? currentData
          : sortedData
        : currentData,
    [
      shouldUseVirtualization,
      shouldPaginateVirtualized,
      currentData,
      sortedData,
    ],
  );

  const groupedData: Record<string, Row[]> | Row[] = useMemo(
    () =>
      shouldGroup && groupBy
        ? groupDataByField(dataToGroup, groupBy)
        : dataToGroup,
    [shouldGroup, groupBy, dataToGroup],
  );

  // Preparar datos planos para GroupedVirtuoso
  const { groupCounts, groupHeaders, flatGroupedData } = useMemo(() => {
    if (!shouldGroup || !groupBy || !shouldUseVirtualization) {
      return { groupCounts: [], groupHeaders: [], flatGroupedData: [] };
    }

    // En este punto groupedData es un objeto Record<string, Row[]>
    const groups = groupedData as Record<string, Row[]>;
    const headers = Object.keys(groups);
    const counts: number[] = [];
    const flatData: Row[] = [];

    headers.forEach((header) => {
      const rows = groups[header];
      counts.push(rows.length);
      flatData.push(...rows);
    });

    return {
      groupCounts: counts,
      groupHeaders: headers,
      flatGroupedData: flatData,
    };
  }, [shouldGroup, groupBy, shouldUseVirtualization, groupedData]);

  const totalElements = data.length;
  const elementsShown = shouldUseVirtualization
    ? shouldPaginateVirtualized
      ? currentData.length
      : sortedData.length
    : currentData.length;
  const virtualData = shouldPaginateVirtualized ? currentData : sortedData;

  const viewportWidth = useViewportWidth();
  const isWideScreen = viewportWidth === 0 ? true : viewportWidth > 1366;
  const isWideLayout = useWideLayout();

  const handleWrapperScroll = (() => {
    if (!onScroll && !onScrollMetrics) return undefined;

    return (event: UIEvent<HTMLDivElement>) => {
      invokeScrollHandler(onScroll, event);

      if (typeof onScrollMetrics === 'function') {
        const element = event.currentTarget;
        const scrollTop = element.scrollTop || 0;
        const scrollHeight = element.scrollHeight || 0;
        const clientHeight = element.clientHeight || 0;
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 8;

        invokeScrollMetricsHandler(onScrollMetrics, {
          scrollTop,
          scrollHeight,
          clientHeight,
          isAtTop,
          isAtBottom,
        });
      }
    };
  })();

  useEffect(() => {
    if (typeof onScrollMetrics !== 'function') return undefined;
    const element = wrapperRef.current;
    if (!element) return undefined;

    const emitMetrics = () => {
      const scrollTop = element.scrollTop || 0;
      const scrollHeight = element.scrollHeight || 0;
      const clientHeight = element.clientHeight || 0;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 8;

      invokeScrollMetricsHandler(onScrollMetrics, {
        scrollTop,
        scrollHeight,
        clientHeight,
        isAtTop,
        isAtBottom,
      });
    };

    emitMetrics();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const resizeObserver = new ResizeObserver(() => emitMetrics());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [onScrollMetrics]);

  return (
    <Container
      $hasTitle={!!title}
      $hasHeader={!!headerComponent}
      $hasFilterBar={Boolean(filterUI || datePicker || dateRange)}
    >
      {title && <TableTitle>{title}</TableTitle>}

      {headerComponent && <div>{headerComponent}</div>}

      {(filterUI || dateRange) && (
        <FilterBar>
          {filterUI && (
            <FilterUI
              setFilter={setFilter}
              filterConfig={dynamicFilterConfig}
              filter={filter}
              defaultFilter={defaultFilter}
              setDefaultFilter={setDefaultFilter}
            />
          )}
          {datePicker && (
            <DatePicker
              dates={dateRange}
              setDates={setDateRange}
              datesDefault={defaultDate}
            />
          )}
        </FilterBar>
      )}

      <TableContainer>
        <Wrapper
          ref={wrapperRef}
          onScroll={handleWrapperScroll}
          style={
            shouldUseVirtualization
              ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' }
              : undefined
          }
        >
          <TableHeader
            columnOrder={columnOrder}
            handleSort={handleSort}
            sortConfig={sortConfig}
            isWideScreen={isWideScreen}
            isWideLayout={isWideLayout}
            rowSize={rowSize}
          />
          {shouldUseVirtualization ? (
            <VirtualTableBody
              columnOrder={columnOrder}
              currentData={virtualData}
              emptyText={emptyText}
              onRowClick={onRowClick}
              loading={loading}
              isWideScreen={isWideScreen}
              isWideLayout={isWideLayout}
              expandedRowRender={expandedRowRender}
              rowExpandable={rowExpandable}
              getRowId={getRowId}
              rowSize={rowSize}
              rowBorder={rowBorder}
              shouldGroup={shouldGroup}
              groupCounts={groupCounts}
              groupHeaders={groupHeaders}
              flatGroupedData={flatGroupedData}
            />
          ) : (
            <TableBody
              columnOrder={columnOrder}
              currentData={currentData}
              emptyText={emptyText}
              groupedData={groupedData}
              onRowClick={onRowClick}
              shouldGroup={shouldGroup}
              loading={loading}
              isWideScreen={isWideScreen}
              isWideLayout={isWideLayout}
              expandedRowRender={expandedRowRender}
              rowExpandable={rowExpandable}
              getRowId={getRowId}
              rowSize={rowSize}
              rowBorder={rowBorder}
            />
          )}
        </Wrapper>
        {loading ? (
          <TableLoadingOverlay>
            <TableSpinner />
          </TableLoadingOverlay>
        ) : null}
        <TableFooter
          currentPage={currentPage}
          elementName={elementName}
          elementsShown={elementsShown}
          firstPage={firstPage}
          footerLeftSide={footerLeftSide}
          footerRightSide={footerRightSide}
          lastPage={lastPage}
          nextPage={nextPage}
          pageCount={pageCount}
          prevPage={prevPage}
          toggleReorderMenu={toggleReorderMenu}
          totalElements={totalElements}
          showPaginationControls={
            showPagination &&
            (!shouldUseVirtualization || shouldPaginateVirtualized)
          }
        />
        <ColumnMenu
          resetColumnOrder={resetColumnOrder}
          isOpen={isReorderMenuOpen}
          toggleOpen={toggleReorderMenu}
          columns={columns}
          columnOrder={columnOrder}
          setColumnOrder={setColumnOrder}
        />
      </TableContainer>
    </Container>
  );
};

export const AdvancedTable = memo(
  AdvancedTableInner,
) as typeof AdvancedTableInner;

export type {
  AdvancedTableColumn,
  AdvancedTableFilterConfig,
  AdvancedTableFilterOption,
  AdvancedTableProps,
  AdvancedTableScrollMetrics,
  ScrollMetrics,
} from './types/AdvancedTableTypes';
export type { CellType, ColumnConfig, TableRow } from './types/ColumnTypes';

export {
  ExpandedRow,
  ExpanderButton,
  Row,
} from './components/Table/TableRow.styles';
export { ImgCell, TextCell } from './components/Cells';

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  padding: 0.2em 0.4em;
`;

type AdvancedTheme = DefaultTheme & {
  bg?: {
    shade?: string;
    primary?: string;
  };
};

const Container = styled.div<{
  $hasTitle: boolean;
  $hasHeader: boolean;
  $hasFilterBar: boolean;
}>`
  display: grid;
  grid-template-rows: ${({ $hasTitle, $hasHeader, $hasFilterBar }) =>
    [
      $hasTitle ? 'min-content' : null,
      $hasHeader ? 'min-content' : null,
      $hasFilterBar ? 'min-content' : null,
      '1fr',
    ]
      .filter(Boolean)
      .join(' ')};
  height: 100%;
  overflow: hidden;
  background-color: ${({ theme }) =>
    (theme as AdvancedTheme)?.bg?.shade ?? 'transparent'};
  border: var(--border-primary);
  border-radius: 0.4em;
`;

const TableTitle = styled.div`
  height: min-content;
  padding: 0.8em 1em;
  font-size: 1.1em;
  font-weight: 600;
  background-color: ${({ theme }) =>
    (theme as AdvancedTheme)?.bg?.primary ?? 'transparent'};
  border-bottom: var(--border-primary);
`;

const TableContainer = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
`;

const TableLoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 70%);
`;

const TableSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgb(0 0 0 / 10%);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: advtable-spin 0.8s linear infinite;

  @keyframes advtable-spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

const Wrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  height: 100%;
  overflow: auto scroll;
  background-color: #fff;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
`;
