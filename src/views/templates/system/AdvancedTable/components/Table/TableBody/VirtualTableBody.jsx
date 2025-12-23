import { Fragment, useState, memo } from 'react';
import { GroupedVirtuoso, Virtuoso } from 'react-virtuoso';
import styled from 'styled-components';

import Loader from '@/views/component/Loader/Loader';
import { CenteredText } from '@/views/templates/system/CentredText';
import { Row } from '@/views/templates/system/AdvancedTable/AdvancedTable';
import { CellRenderer } from '@/views/templates/system/AdvancedTable/components/CellRenderer/CellRenderer';

const Body = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const renderCell = (col, value, row, rowIndex) => {
  if (col.cell) {
    return col.cell({ value, row, rowIndex });
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

// Componente de fila memoizado para evitar re-renders innecesarios
const RowItem = memo(
  ({
    row,
    rowIndex,
    activeColumns,
    isWideScreen: _isWideScreen,
    isWideLayout: _isWideLayout,
    rowBorder,
    rowSize,
    handleCellClick,
    expanded,
    toggleRow,
    expandedRowRender,
    rowExpandable,
    getRowId,
  }) => {
    const rowId = getRowId
      ? getRowId(row, rowIndex)
      : row?.id ?? row?.key ?? rowIndex;

    const canExpand =
      !!expandedRowRender && (rowExpandable ? rowExpandable(row) : true);

    const isExpanded = !!expanded[rowId];

    const rowWithExpanderData = canExpand
      ? {
        ...row,
        _expander: {
          expanded: isExpanded,
          toggle: () => toggleRow(row, rowId),
        },
      }
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
              $clickable={col?.clickable !== false}
              data-size={rowSize}
              data-row-border={rowBorder ? 'on' : 'off'}
              onClick={(e) => handleCellClick(e, col, row)}
            >
              {renderCell(
                col,
                rowWithExpanderData[col.accessor],
                rowWithExpanderData,
                rowIndex,
              )}
            </BodyCell>
          ))}
        </Row>
        {canExpand && isExpanded && (
          <ExpandedRow>{expandedRowRender(row)}</ExpandedRow>
        )}
      </Fragment>
    );
  },
);

RowItem.displayName = 'RowItem';

export const VirtualTableBody = ({
  loading = false,
  currentData, // En modo virtual, esto debería ser la lista COMPLETA de datos
  columnOrder,
  onRowClick,
  emptyText,
  isWideScreen,
  isWideLayout,
  expandedRowRender,
  rowExpandable,
  getRowId,
  rowSize = 'medium',
  rowBorder,
  // Props para grouping
  shouldGroup = false,
  groupCounts = [],
  groupHeaders = [],
  flatGroupedData = [],
}) => {
  const activeColumns = columnOrder.filter((col) => col.status === 'active');

  const handleCellClick = (e, col, row) => {
    if (onRowClick && col?.clickable !== false) onRowClick(row);
  };

  // Estado local de filas expandidas
  const [expanded, setExpanded] = useState({});

  const toggleRow = (row, id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const containerStyle =
    typeof rowBorder === 'string'
      ? { ['--row-border-color']: rowBorder }
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
    <Body>
      <Loader loading={loading} overlay>
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
                return (
                  <RowItem
                    row={row}
                    rowIndex={index}
                    activeColumns={activeColumns}
                    isWideScreen={isWideScreen}
                    isWideLayout={isWideLayout}
                    rowBorder={rowBorder}
                    rowSize={rowSize}
                    handleCellClick={handleCellClick}
                    expanded={expanded}
                    toggleRow={toggleRow}
                    expandedRowRender={expandedRowRender}
                    rowExpandable={rowExpandable}
                    getRowId={getRowId}
                  />
                );
              }}
            />
          ) : (
            <Virtuoso
              data={currentData}
              totalCount={currentData.length}
              style={{ height: '100%' }}
              itemContent={(index, row) => (
                <RowItem
                  row={row}
                  rowIndex={index}
                  activeColumns={activeColumns}
                  isWideScreen={isWideScreen}
                  isWideLayout={isWideLayout}
                  rowBorder={rowBorder}
                  rowSize={rowSize}
                  handleCellClick={handleCellClick}
                  expanded={expanded}
                  toggleRow={toggleRow}
                  expandedRowRender={expandedRowRender}
                  rowExpandable={rowExpandable}
                  getRowId={getRowId}
                />
              )}
            />
          )}
        </Container>
      </Loader>
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
