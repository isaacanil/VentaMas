import React, { Fragment } from 'react'
import { Row } from '../../../AdvancedTable'
import styled from 'styled-components'
import { CenteredText } from '../../../../CentredText'

export const TableBody = ({ shouldGroup, groupedData, currentData, columnOrder, onRowClick, emptyText }) => {
  
  // Filtrar columnOrder para incluir solo columnas con estado 'active'
  const activeColumns = columnOrder.filter(col => col.status === 'active');

  return (
    <Container columns={activeColumns}>
    {
      shouldGroup
        ? Object.entries(groupedData).map(([groupKey, groupItems]) => (
          <Fragment key={groupKey}>
            <GroupHeader>{groupKey}</GroupHeader>
            {groupItems.map((row, rowIndex) => (
              <Row key={rowIndex} columns={activeColumns} onClick={onRowClick ? () => onRowClick(row) : null}>
                {activeColumns.map((col, colIndex) => (
                  <BodyCell key={colIndex} align={col.align} columns={activeColumns}>
                    {col.cell ? col.cell({ value: row[col.accessor] }) : row[col.accessor]}
                  </BodyCell>
                ))}
              </Row>
            ))}
          </Fragment>
        ))
        : currentData.map((row, rowIndex) => (
          <Row key={rowIndex} columns={activeColumns} onClick={onRowClick ? () => onRowClick(row) : null}>
            {activeColumns.map((col, colIndex) => (
              <BodyCell key={colIndex} align={col.align} columns={activeColumns}>
                {col.cell ? col.cell({ value: row[col.accessor] }) : row[col.accessor]}
              </BodyCell>
            ))}
          </Row>
        ))
    }
    {
      !currentData.length && <CenteredText text={emptyText} />
    }
  </Container>
  )
}

const Container = styled.div`
 display: grid;
   align-content: flex-start;
   gap: 0.2em 1em;
`
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
  height: 3.4em;
  justify-content: ${props => props.align || 'flex-start'};
  text-align: ${props => props.align || 'left'};
  ${props => {
    if (props?.columns?.minWidth) {
      return `
      min-width: ${props?.columns?.minWidth};
      `
    }
  }}
`;