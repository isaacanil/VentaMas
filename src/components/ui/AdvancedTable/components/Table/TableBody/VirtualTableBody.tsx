import {
  Fragment,
  memo,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { GroupedVirtuoso, Virtuoso } from 'react-virtuoso';
import styled from 'styled-components';

import { Row } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/AdvancedTable';
import { CellRenderer } from '@/components/ui/AdvancedTable/components/CellRenderer/CellRenderer';
import { CenteredText } from '@/components/ui/CentredText';
import type { TableRow } from '@/components/ui/AdvancedTable/types/ColumnTypes';

const Body = styled.div<{ $loading?: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};
  transition: opacity 0.3s ease-in-out;
`;

interface VirtualTableBodyCellContentProps<RowData extends TableRow> {
  col: AdvancedTableColumn<RowData>;
  value: unknown;
  row: RowData;
  rowIndex: number;
}

const VirtualTableBodyCellContent = <RowData extends TableRow>({
  col,
  value,
  row,
  rowIndex,
}: VirtualTableBodyCellContentProps<RowData>): ReactElement => {
  if (col.cell) {
    return <>{col.cell({ value, row, rowIndex })}</>;
  }

  return (
    <CellRenderer
      type={col.type}
      value={value}
      cellProps={col.cellProps}
      format={col.format}
    />
  );
};

type RowSize = 'small' | 'medium' | 'large';
const EMPTY_GROUP_COUNTS: number[] = [];
const EMPTY_GROUP_HEADERS: string[] = [];
const EMPTY_GROUPED_ROWS: TableRow[] = [];

interface RowItemProps<RowData extends TableRow> {
  row: RowData;
  rowIndex: number;
  rowId: string;
  activeColumns: AdvancedTableColumn<RowData>[];
  rowBorder?: boolean | string;
  rowSize: RowSize;
  handleCellClick: (
    event: MouseEvent<HTMLDivElement>,
    col: AdvancedTableColumn<RowData>,
    row: RowData,
  ) => void;
  isExpanded: boolean;
  toggleRow: (id: string) => void;
  expandedRowRender?: (row: RowData) => ReactNode;
  rowExpandable?: (row: RowData) => boolean;
}

type RowItemComponent = (<RowData extends TableRow>(
  props: RowItemProps<RowData>,
) => ReactElement) & {
  displayName?: string;
};

// Componente de fila memoizado para evitar re-renders innecesarios
const RowItem = memo(
  <RowData extends TableRow>({
    row,
    rowIndex,
    rowId,
    activeColumns,
    rowBorder,
    rowSize,
    handleCellClick,
    isExpanded,
    toggleRow,
    expandedRowRender,
    rowExpandable,
  }: RowItemProps<RowData>) => {
    const canExpand =
      !!expandedRowRender && (rowExpandable ? rowExpandable(row) : true);

    const rowWithExpanderData = canExpand
      ? ({
          ...row,
          _expander: {
            expanded: isExpanded,
            toggle: () => toggleRow(rowId),
          },
        } as RowData)
      : row;

    return (
      <Fragment>
        <Row
          $columns={activeColumns}
          data-border={rowBorder ? 'on' : undefined}
        >
          {activeColumns.map((col, colIndex) => (
            <BodyCell
              key={colIndex}
              $align={col.align}
              $fixed={col.fixed}
              $right={col.right}
              $clickable={col?.clickable !== false}
              data-size={rowSize}
              data-row-border={rowBorder ? 'on' : 'off'}
              onClick={(e) => handleCellClick(e, col, row)}
            >
              <VirtualTableBodyCellContent
                col={col}
                value={rowWithExpanderData[col.accessor]}
                row={rowWithExpanderData}
                rowIndex={rowIndex}
              />
            </BodyCell>
          ))}
        </Row>
        {canExpand && isExpanded && (
          <ExpandedRow>{expandedRowRender(row)}</ExpandedRow>
        )}
      </Fragment>
    );
  },
) as RowItemComponent;

RowItem.displayName = 'RowItem';

interface VirtualTableBodyProps<RowData extends TableRow> {
  loading?: boolean;
  currentData: RowData[];
  columnOrder: AdvancedTableColumn<RowData>[];
  onRowClick?: (row: RowData) => void;
  emptyText?: ReactNode;
  expandedRowRender?: (row: RowData) => ReactNode;
  rowExpandable?: (row: RowData) => boolean;
  getRowId?: (row: RowData, index?: number) => string | number;
  rowSize?: RowSize;
  rowBorder?: boolean | string;
  isWideScreen?: boolean;
  isWideLayout?: boolean;
  shouldGroup?: boolean;
  groupCounts?: number[];
  groupHeaders?: string[];
  flatGroupedData?: RowData[];
}

export const VirtualTableBody = <RowData extends TableRow>({
  loading = false,
  currentData, // En modo virtual puede ser la lista completa o una página.
  columnOrder,
  onRowClick,
  emptyText,
  expandedRowRender,
  rowExpandable,
  getRowId,
  rowSize = 'medium',
  rowBorder,
  isWideScreen: _isWideScreen,
  isWideLayout: _isWideLayout,
  // Props para grouping
  shouldGroup = false,
  groupCounts = EMPTY_GROUP_COUNTS,
  groupHeaders = EMPTY_GROUP_HEADERS,
  flatGroupedData = EMPTY_GROUPED_ROWS as RowData[],
}: VirtualTableBodyProps<RowData>) => {
  const activeColumns = useMemo(
    () => columnOrder.filter((col) => col.status === 'active'),
    [columnOrder],
  );

  const handleCellClick = useCallback(
    (
      _event: MouseEvent<HTMLDivElement>,
      col: AdvancedTableColumn<RowData>,
      row: RowData,
    ) => {
      if (onRowClick && col?.clickable !== false) onRowClick(row);
    },
    [onRowClick],
  );

  // Estado local de filas expandidas
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resolveRowKey = useCallback(
    (row: RowData, rowIndex: number) => {
      const rowRecord = row as Record<string, unknown>;
      const id = getRowId
        ? getRowId(row, rowIndex)
        : (rowRecord?.id ?? rowRecord?.key ?? rowIndex);
      return String(id);
    },
    [getRowId],
  );

  const containerStyle =
    typeof rowBorder === 'string'
      ? ({ ['--row-border-color']: rowBorder } as CSSProperties)
      : undefined;

  // Determinar si hay datos para mostrar
  const hasData = shouldGroup
    ? flatGroupedData.length > 0
    : currentData.length > 0;

  if (!hasData && !loading) {
    return (
      <Body>
        <CenteredText text={emptyText} />
      </Body>
    );
  }

  return (
    <Body $loading={loading}>
      <Container
        data-border={rowBorder ? 'on' : 'off'}
        style={{ ...containerStyle, height: '100%' }}
      >
        {shouldGroup ? (
          <GroupedVirtuoso
            groupCounts={groupCounts}
            style={{ height: '100%' }}
            groupContent={(index) => (
              <GroupHeader>{groupHeaders[index]}</GroupHeader>
            )}
            itemContent={(index) => {
              const row = flatGroupedData[index];
              const rowId = resolveRowKey(row, index);
              const isExpanded = !!expanded[rowId];
              return (
                <RowItem
                  row={row}
                  rowIndex={index}
                  rowId={rowId}
                  activeColumns={activeColumns}
                  rowBorder={rowBorder}
                  rowSize={rowSize}
                  handleCellClick={handleCellClick}
                  isExpanded={isExpanded}
                  toggleRow={toggleRow}
                  expandedRowRender={expandedRowRender}
                  rowExpandable={rowExpandable}
                />
              );
            }}
          />
        ) : (
          <Virtuoso
            data={currentData}
            totalCount={currentData.length}
            style={{ height: '100%' }}
            itemContent={(index, row) => {
              const rowId = resolveRowKey(row, index);
              const isExpanded = !!expanded[rowId];
              return (
                <RowItem
                  row={row}
                  rowIndex={index}
                  rowId={rowId}
                  activeColumns={activeColumns}
                  rowBorder={rowBorder}
                  rowSize={rowSize}
                  handleCellClick={handleCellClick}
                  isExpanded={isExpanded}
                  toggleRow={toggleRow}
                  expandedRowRender={expandedRowRender}
                  rowExpandable={rowExpandable}
                />
              );
            }}
          />
        )}
      </Container>
    </Body>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;

  /* Ajustes para que Virtuoso funcione bien dentro del layout existente */
  & .virtuoso-scroller {
    /* Opcional: Estilos para el scrollbar si se desean personalizar aquí */
  }
`;

const GroupHeader = styled.div`
  padding: 10px;
  font-weight: bold;
  background-color: #f0f0f09e;

  /* Aseguramos que el header ocupe todo el ancho y sea sticky si Virtuoso lo soporta por defecto */
  width: 100%;
`;

const ExpandedRow = styled.div`
  padding: 1em;
  background-color: var(--background-100, #f9f9f9);
  border-top: 1px solid var(--gray-1);

  /* Asegurar que ocupe todo el ancho disponible */
  width: 100%;
`;

type BodyCellAlign = AdvancedTableColumn<TableRow>['align'];
type BodyCellFixed = AdvancedTableColumn<TableRow>['fixed'];

interface BodyCellProps {
  $fixed?: BodyCellFixed;
  $right?: string;
  $align?: BodyCellAlign;
  $clickable?: boolean;
}

const BodyCell = styled.div<BodyCellProps>`
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;
  padding: 0 10px;
  height: 100%;

  /* base (medium) height */
  height: 3.4em;

  &[data-size='small'] {
    height: 2.6em;
  }

  &[data-size='large'] {
    height: 4.6em;
  }

  position: ${(props) => (props.$fixed ? 'sticky' : 'relative')};
  ${(props) =>
    props.$fixed === 'left' &&
    `
    left: 0;
    z-index: 2;
    background-color: white;
    border-right: 1px solid var(--gray-1);
  `}
  ${(props) =>
    props.$fixed === 'right' &&
    `
    right: ${props.$right || '0'};
    z-index: 2;
    background-color: white;
    border-left: 1px solid var(--gray-1);
  `}
  justify-content: ${(props) => props.$align || 'flex-start'};
  text-align: ${(props) => props.$align || 'left'};
  ${(props) =>
    props.$clickable &&
    `
    cursor: pointer;
  `}
`;
