import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  type UIEvent,
} from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { filterData } from '../../../../hooks/search/useSearch';
import { useWindowWidth } from '../../../../hooks/useWindowWidth';
import { DatePicker } from '../Dates/DatePicker/DatePicker';

import { ColumnMenu } from './components/ColumnMenu/ColumnMenu';
import { FilterUI } from './components/MenuFilter/MenuFilter';
import { TableBody } from './components/Table/TableBody/TableBody';
import TableFooter from './components/Table/TableFooter/TableFooter';
import { TableHeader } from './components/Table/TableHeader/TableHeader';
import { useColumnOrder } from './hooks/useColumnOrder';
import { useTablePagination } from './hooks/usePagination';
import useTableFiltering, {
  useDynamicFilterConfig,
} from './hooks/useTableFilter';
import useTableSorting from './hooks/useTableSorting';

import type { ColumnConfig } from './types/ColumnTypes';
import type { DefaultTheme } from 'styled-components';

type TableRow = Record<string, unknown>;

interface UserSliceState {
  uid?: string | null;
}

interface UserStoreState {
  user?: {
    user?: UserSliceState | null;
  };
}

type SortDirection = 'asc' | 'desc' | 'none';

interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

type FilterState = Record<string, unknown>;

interface AdvancedTableFilterOption {
  label: ReactNode;
  value: unknown;
  [key: string]: unknown;
}

interface AdvancedTableFilterConfig {
  accessor: string;
  defaultValue?: unknown;
  options?: AdvancedTableFilterOption[];
  format?: (value: unknown) => ReactNode;
  [key: string]: unknown;
}

interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}

type InternalColumn<Row> = Omit<ColumnConfig, 'cell'> & {
  accessor: string;
  status?: ColumnConfig['status'];
  reorderable?: boolean;
  originalPosition?: number;
  sortableValue?: (value: unknown) => unknown;
  cell?: (props: { value: unknown; row?: Row; rowIndex?: number }) => ReactNode;
};

export interface AdvancedTableProps<Row = TableRow> {
  columns?: InternalColumn<Row>[];
  data?: Row[];
  loading?: boolean;
  numberOfElementsPerPage?: number;
  groupBy?: string | null;
  rowSize?: 'small' | 'medium' | 'large';
  rowBorder?: boolean | string;
  headerComponent?: ReactNode;
  filterUI?: boolean;
  datePicker?: boolean;
  footerLeftSide?: ReactNode;
  footerRightSide?: ReactNode;
  filterConfig?: AdvancedTableFilterConfig[];
  searchTerm?: string;
  elementName?: string;
  tableName?: string;
  dateRange?: unknown;
  defaultDate?: unknown;
  setDateRange?: (value: unknown) => void;
  emptyText?: ReactNode;
  onRowClick?: (row: Row) => void;
  title?: ReactNode;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  onScrollMetrics?: (metrics: ScrollMetrics) => void;
  expandedRowRender?: (row: Row) => ReactNode;
  rowExpandable?: (row: Row) => boolean;
  getRowId?: (row: Row, index: number) => string | number;
}

interface PaginationUtilities<Row> {
  currentData: Row[];
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  currentPage: number;
  pageCount: number;
}

interface SortUtilities<Row> {
  handleSort: (key: string, sortable?: boolean) => void;
  sortedData: Row[];
  sortConfig: SortConfig;
}

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

const useWideLayout = (): boolean => {
  const [isWide, setIsWide] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1600,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setIsWide(window.innerWidth >= 1600);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isWide;
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
  columns = [] as InternalColumn<Row>[],
  data = [] as Row[],
  filterConfig = [],
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
}: AdvancedTableProps<Row>) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const userUid = useSelector<UserStoreState, string | undefined>(
    selectUserUid,
  );

  const columnsWithExpander = useMemo<InternalColumn<Row>[]>(() => {
    if (!expandedRowRender) return columns;

    const expanderCol: InternalColumn<Row> = {
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
  const [columnOrder, setColumnOrder, resetColumnOrder] = useColumnOrder(
    columnsWithExpander,
    tableName,
    userUid,
  ) as [
    InternalColumn<Row>[],
    Dispatch<SetStateAction<InternalColumn<Row>[]>>,
    () => void,
  ];

  const toggleReorderMenu = () => {
    setIsReorderMenuOpen((prev) => !prev);
  };

  const [filter, setFilter, setDefaultFilter, defaultFilter, filteredData] =
    useTableFiltering(filterConfig, data) as [
      FilterState,
      Dispatch<SetStateAction<FilterState>>,
      () => void,
      FilterState,
      Row[],
    ];

  const dynamicFilterConfig = useDynamicFilterConfig(
    filterConfig,
    data,
  ) as AdvancedTableFilterConfig[];

  const searchTermFilteredData = searchTerm
    ? (filterData(filteredData, searchTerm) as Row[])
    : filteredData;

  const { handleSort, sortedData, sortConfig } = useTableSorting(
    searchTermFilteredData,
    columnsWithExpander,
  ) as SortUtilities<Row>;

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
  ) as PaginationUtilities<Row>;

  const shouldGroup = Boolean(
    (sortConfig.direction === 'none' || sortConfig.key === null) && groupBy,
  );
  const groupedData =
    shouldGroup && groupBy
      ? groupDataByField(currentData, groupBy)
      : sortedData;

  const totalElements = data.length;
  const elementsShown = currentData.length;

  const isWideScreen = useWindowWidth(1366);
  const isWideLayout = useWideLayout();

  const handleWrapperScroll = useMemo<
    ((event: UIEvent<HTMLDivElement>) => void) | undefined
  >(() => {
    if (!onScroll && !onScrollMetrics) return undefined;

    return (event: UIEvent<HTMLDivElement>) => {
      try {
        onScroll?.(event);
      } catch {
        /* ignore */
      }

      if (typeof onScrollMetrics === 'function') {
        const element = event.currentTarget;
        const scrollTop = element.scrollTop || 0;
        const scrollHeight = element.scrollHeight || 0;
        const clientHeight = element.clientHeight || 0;
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 8;

        try {
          onScrollMetrics({
            scrollTop,
            scrollHeight,
            clientHeight,
            isAtTop,
            isAtBottom,
          });
        } catch {
          /* ignore */
        }
      }
    };
  }, [onScroll, onScrollMetrics]);

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

      try {
        onScrollMetrics({
          scrollTop,
          scrollHeight,
          clientHeight,
          isAtTop,
          isAtBottom,
        });
      } catch {
        /* ignore */
      }
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
      $hasToolbar={Boolean(
        filterUI || datePicker || headerComponent || dateRange,
      )}
    >
      {title && <TableTitle>{title}</TableTitle>}

      {filterUI || dateRange ? (
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
      ) : (
        headerComponent && <div>{headerComponent}</div>
      )}

      <TableContainer>
        <Wrapper
          ref={wrapperRef}
          isWideScreen={isWideScreen}
          onScroll={handleWrapperScroll}
        >
          <TableHeader
            columnOrder={columnOrder}
            handleSort={handleSort}
            sortConfig={sortConfig}
            isWideScreen={isWideScreen}
            isWideLayout={isWideLayout}
            rowSize={rowSize}
          />
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
        </Wrapper>
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
  InternalColumn as AdvancedTableColumn,
  AdvancedTableFilterConfig,
  AdvancedTableFilterOption,
  ScrollMetrics as AdvancedTableScrollMetrics,
};

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

const Container = styled.div<{ $hasTitle: boolean; $hasToolbar: boolean }>`
  display: grid;
  grid-template-rows: ${({ $hasTitle, $hasToolbar }) =>
    [
      $hasTitle ? 'min-content' : null,
      $hasToolbar ? 'min-content' : null,
      '1fr',
    ]
      .filter(Boolean)
      .join(' ')};
  height: 100%;
  overflow: hidden;
  background-color: ${({ theme }) =>
    (theme as AdvancedTheme).bg?.shade ?? 'transparent'};
  border: var(--border-primary);
  border-radius: 0.4em;
`;

const TableTitle = styled.div`
  height: min-content;
  padding: 0.8em 1em;
  font-size: 1.1em;
  font-weight: 600;
  background-color: ${({ theme }) =>
    (theme as AdvancedTheme).bg?.primary ?? 'transparent'};
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

const Wrapper = styled.div<{ isWideScreen: boolean }>`
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

export const ExpanderButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--gray-7);
  cursor: pointer;
  background: transparent;
  border: none;

  &:hover {
    color: var(--gray-9);
  }
`;

export const ExpandedRow = styled.div`
  grid-column: 1 / -1;
  padding: 8px 12px;
  background: #fafafa;
  border-right: 2px solid var(--gray-3);
  border-bottom: 1px dashed var(--gray-3);
  border-left: 2px solid var(--gray-3);
`;

type StyledColumn = InternalColumn<TableRow>;

export const Row = styled.div<{
  columns: StyledColumn[];
  isWideLayout: boolean;
  isWideScreen: boolean;
}>`
  position: relative;
  display: grid;
  grid-template-columns: ${(props) => {
    if (!props.columns.length) return '1fr';

    const template = props.isWideLayout
      ? props.columns.map((col) =>
          col.keepWidth
            ? `minmax(${col.minWidth || '100px'}, ${col.maxWidth || '1fr'})`
            : '1fr',
        )
      : props.columns.map(
          (col) =>
            `minmax(${col.minWidth || '100px'}, ${col.maxWidth || '1fr'})`,
        );

    const value = template.join(' ');
    return value || '1fr';
  }};
  gap: 0.6em;
  align-items: center;
  width: 100%;
  min-width: fit-content;
`;
