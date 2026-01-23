import {
  Fragment,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import styled from 'styled-components';

import Loader from '@/components/common/Loader/Loader';
import { Row } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/AdvancedTable';
import { CellRenderer } from '@/components/ui/AdvancedTable/components/CellRenderer/CellRenderer';
import { CenteredText } from '@/components/ui/CentredText';
import type { TableRow } from '@/components/ui/AdvancedTable/types/ColumnTypes';

const Body = styled.div`
  position: relative;
`;

const renderCell = <RowData extends TableRow>(
  col: AdvancedTableColumn<RowData>,
  value: unknown,
  row: RowData,
): ReactNode => {
  if (col.cell) {
    return col.cell({ value, row });
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

interface TableBodyProps<RowData extends TableRow> {
  loading?: boolean;
  shouldGroup?: boolean;
  groupedData: Record<string, RowData[]> | RowData[];
  currentData: RowData[];
  columnOrder: AdvancedTableColumn<RowData>[];
  onRowClick?: (row: RowData) => void;
  emptyText?: ReactNode;
  isWideScreen?: boolean;
  isWideLayout?: boolean;
  expandedRowRender?: (row: RowData) => ReactNode;
  rowExpandable?: (row: RowData) => boolean;
  getRowId?: (row: RowData, index?: number) => string | number;
  rowSize?: 'small' | 'medium' | 'large';
  rowBorder?: boolean | string;
}

export const TableBody = <RowData extends TableRow>({
  loading = false,
  shouldGroup,
  groupedData,
  currentData,
  columnOrder,
  onRowClick,
  emptyText,
  isWideScreen: _isWideScreen,
  isWideLayout: _isWideLayout,
  expandedRowRender,
  rowExpandable,
  getRowId,
  rowSize = 'medium',
  rowBorder,
}: TableBodyProps<RowData>) => {
  const activeColumns = columnOrder.filter((col) => col.status === 'active');

  const handleCellClick = (
    _event: MouseEvent<HTMLDivElement>,
    col: AdvancedTableColumn<RowData>,
    row: RowData,
  ) => {
    if (onRowClick && col?.clickable !== false) onRowClick(row);
  };

  // Estado local de filas expandidas
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleRow = (row: RowData) => {
    const rowRecord = row as Record<string, unknown>;
    const id = getRowId ? getRowId(row) : (rowRecord?.id ?? rowRecord?.key);
    if (id == null) return;
    const key = String(id);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const containerStyle =
    typeof rowBorder === 'string'
      ? ({ ['--row-border-color']: rowBorder } as CSSProperties)
      : undefined;
  const tableContent = (
    <Container data-border={rowBorder ? 'on' : 'off'} style={containerStyle}>
      {shouldGroup
        ? Object.entries(groupedData as Record<string, RowData[]>).map(
            ([groupKey, groupItems]) => (
              <Fragment key={groupKey}>
                <GroupHeader>{groupKey}</GroupHeader>
                {groupItems.map((row, rowIndex) => (
                  <Row
                    key={String(rowIndex)}
                    $columns={activeColumns}
                    data-border={rowBorder ? 'on' : undefined}
                  >
                    {activeColumns.map((col, colIndex) => (
                      <BodyCell
                        key={colIndex}
                        $align={col.align}
                        $fixed={col.fixed}
                        $clickable={col?.clickable !== false}
                        data-size={rowSize}
                        data-row-border={rowBorder ? 'on' : 'off'}
                        onClick={(e) => handleCellClick(e, col, row)}
                      >
                        {renderCell(col, row[col.accessor], row)}
                      </BodyCell>
                    ))}
                  </Row>
                ))}
              </Fragment>
            ),
          )
        : currentData.map((row, rowIndex) => {
          const rowRecord = row as Record<string, unknown>;
          const rowId = getRowId
            ? getRowId(row, rowIndex)
            : (rowRecord?.id ?? rowRecord?.key ?? rowIndex);
          const rowKey = String(rowId);
          const canExpand =
            !!expandedRowRender &&
            (rowExpandable ? rowExpandable(row) : true);
          const rowWithExpanderData = canExpand
            ? ({
              ...row,
              _expander: {
                expanded: !!expanded[rowKey],
                toggle: () => toggleRow(row),
              },
            } as RowData)
            : row;
          return (
            <Fragment key={rowKey}>
              <Row
                $columns={activeColumns}
                data-border={rowBorder ? 'on' : undefined}
              >
                {activeColumns.map((col, colIndex) => (
                  <BodyCell
                    key={colIndex}
                    $align={col.align}
                    $fixed={col.fixed}
                    $clickable={col?.clickable !== false}
                    data-size={rowSize}
                    data-row-border={rowBorder ? 'on' : 'off'}
                    onClick={(e) => handleCellClick(e, col, row)}
                  >
                    {renderCell(
                      col,
                      rowWithExpanderData[col.accessor],
                      rowWithExpanderData,
                    )}
                  </BodyCell>
                ))}
              </Row>
              {canExpand && expanded[rowKey] && (
                <ExpandedRow>{expandedRowRender(row)}</ExpandedRow>
              )}
            </Fragment>
          );
        })}
      {!currentData.length && <CenteredText text={emptyText} />}
    </Container>
  );

  return (
    <Body>
      <Loader loading={loading} overlay>
        {tableContent}
      </Loader>
    </Body>
  );
};

const Container = styled.div`
  display: grid;
  gap: 0.2em 1em;
  align-content: flex-start;

  &[data-border='on'] {
    row-gap: 0;
  }
`;
const GroupHeader = styled.div`
  padding: 10px;
  font-weight: bold;
  background-color: #f0f0f09e;
`;

const ExpandedRow = styled.div`
  padding: 1em;
  background-color: var(--background-100, #f9f9f9);
  border-top: 1px solid var(--gray-1);
`;

const BodyCell = styled.div`
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
    right: 0;
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
