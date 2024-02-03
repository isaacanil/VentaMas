import React from 'react'
import styled from 'styled-components'
import { Row } from '../../../AdvancedTable'
import { motion } from 'framer-motion'
import { icons } from '../../../../../../../constants/icons/icons'

export const TableHeader = ({ handleSort, columnOrder, sortConfig }) => {
    
  // Filtrar columnOrder para incluir solo columnas con estado 'active'
  const activeColumns = columnOrder.filter(col => col.status === 'active');

  return (
      <Container columns={activeColumns}>
          <Row columns={activeColumns}>
              {activeColumns.map((col, index) => (
                  <HeaderCell
                      key={index}
                      align={col.align}
                      onClick={() => col.sortable ? handleSort(col.accessor) : null}
                  >
                      {col.Header}
                      {/* Lógica para mostrar iconos de ordenamiento */}
                      {sortConfig.key === col.accessor
                          ? (sortConfig.direction === 'asc'
                              ? <MotionIcon key="up">{icons.arrows.caretUp}</MotionIcon>
                              : sortConfig.direction === 'desc'
                                  ? <MotionIcon key="down">{icons.arrows.caretDown}</MotionIcon>
                                  : <MotionIcon key="minus">{icons.mathOperations.subtract}</MotionIcon>)
                          : col.sortable && <MotionIcon key="minus">{icons.mathOperations.subtract}</MotionIcon>}
                  </HeaderCell>
              ))}
          </Row>
      </Container>
  )
}

const Container = styled.div`
    display: grid;  
    align-items: center;
    gap: 1em;
    color: var(--Gray7);
    font-size: 14px;
    border-bottom: var(--border-primary);
    border-top: var(--border-primary);
    font-weight: 500;
    background-color: white;
    position: sticky;
    top: 0;
    z-index: 1;
`
const HeaderCell = styled.div`
  font-weight: bold;
  padding: 0 10px;
  display: flex;
  gap: 0.6em;
  height: 2.75em;
  svg{
    display: flex;
    align-items: center;
    color: var(--color);
    font-size: 1.4em;
  }
  align-items: center;
  
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

const MotionIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  color: var(--color);
  font-size: 1.4em;
  min-width: 1em;
  display: flex;
  justify-items: center;
  justify-content: center;
  svg {
    color: inherit;
    font-size: inherit;
  }
`;
