import React from 'react'
import styled from 'styled-components'
import { Row } from '../../../AdvancedTable'
import { motion } from 'framer-motion'
import { icons } from '../../../../../../../constants/icons/icons'

export const TableHeader = ({handleSort, columnOrder, sortConfig,}) => {
    
    return (
        <Container columns={columnOrder}>
            <Row columns={columnOrder}>
                {columnOrder.map((col, index) => (
                    <HeaderCell
                        key={index}
                        align={col.align}
                        onClick={() => handleSort(col.accessor, col.sortable)} // pasar col.sortable aquí
                    >
                        {col.Header}
                        {/* {(col.sortable && sortConfig.direction !== 'asc' && sortConfig.direction !== 'desc') ? <span>{icons.mathOperations.subtract}</span> : ''}  */}
                        {sortConfig.key === col.accessor
                            ? (sortConfig.direction === 'asc'
                                ? <MotionIcon key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.arrows.caretUp}</MotionIcon>
                                : sortConfig.direction === 'desc'
                                    ? <MotionIcon key="down" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.arrows.caretDown}</MotionIcon>
                                    : <MotionIcon key="minus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.mathOperations.subtract}</MotionIcon>)
                            : col.sortable && <MotionIcon key="minus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.mathOperations.subtract}</MotionIcon>}

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
