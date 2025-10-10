import React, { Fragment } from 'react';
import styled from 'styled-components';

import Loader from '../../../../../../component/Loader/Loader';
import { CenteredText } from '../../../../CentredText';
import { Row } from '../../../AdvancedTable';
import { CellRenderer } from '../../CellRenderer/CellRenderer';

const Body = styled.div`
  position: relative;
`;

const renderCell = (col, value) => {
  if (col.cell) {
    return col.cell({ value });
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

export const TableBody = ({ 
  loading = false, 
  shouldGroup, 
  groupedData, 
  currentData, 
  columnOrder, 
  onRowClick, 
  emptyText, 
  isWideScreen,
  isWideLayout,
  expandedRowRender,
  rowExpandable,
  getRowId,
  rowSize = 'medium',
  rowBorder
}) => {
  const activeColumns = columnOrder.filter(col => col.status === 'active');
  
  const handleCellClick = (e, col, row) => {
    if (onRowClick && col?.clickable !== false) onRowClick(row);
  };

  // Estado local de filas expandidas
  const [expanded, setExpanded] = React.useState({});
  const toggleRow = (row) => {
    const id = getRowId ? getRowId(row) : row?.id ?? row?.key;
    if (id == null) return;
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const containerStyle = typeof rowBorder === 'string' ? { ['--row-border-color']: rowBorder } : undefined;
  const tableContent = (
    <Container 
      columns={activeColumns} 
      data-border={rowBorder ? 'on' : 'off'} 
      style={containerStyle}
    >
      {shouldGroup
        ? Object.entries(groupedData).map(([groupKey, groupItems]) => (
          <Fragment key={groupKey}>
            <GroupHeader>{groupKey}</GroupHeader>
            {groupItems.map((row, rowIndex) => (
              <Row 
                key={rowIndex} 
                columns={activeColumns} 
                isWideScreen={isWideScreen} 
                isWideLayout={isWideLayout}
                data-border={rowBorder ? 'on' : undefined}
              >
                {activeColumns.map((col, colIndex) => (
                  <BodyCell 
                    key={colIndex} 
                    align={col.align}
                    fixed={col.fixed}
                    clickable={col?.clickable !== false ? true : false} 
                    columns={activeColumns} 
                    data-size={rowSize}
                    onClick={(e) => handleCellClick(e, col, row)}
                  >
                    {renderCell(col, row[col.accessor])}
                  </BodyCell>
                ))}
              </Row>
            ))}
          </Fragment>
        ))
        : currentData.map((row, rowIndex) => {
          const rowId = getRowId ? getRowId(row, rowIndex) : row?.id ?? row?.key ?? rowIndex;
          const canExpand = !!expandedRowRender && (rowExpandable ? rowExpandable(row) : true);
          const rowWithExpanderData = canExpand
            ? {
                ...row,
                _expander: { expanded: !!expanded[rowId], toggle: () => toggleRow(row) }
              }
            : row;
          return (
            <Fragment key={rowId}>
              <Row 
                columns={activeColumns} 
                isWideScreen={isWideScreen} 
                isWideLayout={isWideLayout}
                data-border={rowBorder ? 'on' : undefined}
              >
                {activeColumns.map((col, colIndex) => (
                  <BodyCell 
                    key={colIndex} 
                    align={col.align}
                    fixed={col.fixed}
                    clickable={col?.clickable !== false ? true : false} 
                    columns={activeColumns} 
                    data-size={rowSize}
                    onClick={(e) => handleCellClick(e, col, row)}
                  >
                    {renderCell(col, rowWithExpanderData[col.accessor])}
                  </BodyCell>
                ))}
              </Row>
              {canExpand && expanded[rowId] && (
                <ExpandedRow>
                  {expandedRowRender(row)}
                </ExpandedRow>
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
  align-content: flex-start;
  gap: 0.2em 1em;
  &[data-border='on'] { row-gap: 0; }
`;
const GroupHeader = styled.div`
  background-color: #f0f0f09e;
  padding: 10px;
  font-weight: bold;
  // Otros estilos que desees agregar
`;
const BodyCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 100%;
  /* base (medium) height */
  height: 3.4em;
  &[data-size='small'] { height: 2.6em; }
  &[data-size='large'] { height: 4.6em; }
  position: ${props => props.fixed ? 'sticky' : 'relative'};
  ${props => props.fixed === 'left' && `
    left: 0;
    z-index: 1;
    background-color: white;
    border-right: 1px solid var(--Gray1);
  `}
  ${props => props.fixed === 'right' && `
    right: 0;
    z-index: 1;
    background-color: white;
    border-left: 1px solid var(--Gray1);
  `}
  justify-content: ${props => props.align || 'flex-start'};
  text-align: ${props => props.align || 'left'};
  ${props => props.clickable && `
    cursor: pointer;
  `}
  ${props => props?.columns?.minWidth && `
    min-width: ${props?.columns?.minWidth};
  `}
`;