import React from 'react'
import styled from 'styled-components'
import { Row } from '../../../AdvancedTable'
import { motion } from 'framer-motion'
import { icons } from '../../../../../../../constants/icons/icons'

export const TableHeader = ({ handleSort, columnOrder, sortConfig, isWideScreen, isWideLayout, rowSize = 'medium' }) => {

  const activeColumns = columnOrder.filter(col => col.status === 'active');

  return (
    <Container columns={activeColumns}>
      <Row columns={activeColumns} isWideScreen={isWideScreen} isWideLayout={isWideLayout}>
        {activeColumns.map((col, index) => (
          <HeaderCell
            key={index}
            align={col.align}
            fixed={col.fixed}
            minWidth={col.minWidth}
            maxWidth={col.maxWidth}
            data-size={rowSize}
            onClick={() => col.sortable ? handleSort(col.accessor) : null}
          >
            {col.Header}
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
    width: 100%;
`
const sizeHeights = {
  small: '2.1em',
  medium: '2.75em', // existing
  large: '3.4em' // slightly larger than previous 3.25em
};

const HeaderCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: ${() => sizeHeights.medium};
  &[data-size='small'] { height: ${sizeHeights.small}; }
  &[data-size='large'] { height: ${sizeHeights.large}; }
  font-weight: bold;
  gap: 0.6em;
  position: ${props => props.fixed ? 'sticky' : 'relative'};
  ${props => props.fixed === 'left' && `
    left: 0;
    z-index: 2;
    background-color: #ffffff;
    border-right: 1px solid var(--Gray3);
  `}
  ${props => props.fixed === 'right' && `
    right: 0;
    z-index: 2;
    background-color: #ffffff;
    border-left: 1px solid var(--Gray3);
  `}
  justify-content: ${props => props.align || 'flex-start'};
  text-align: ${props => props.align || 'left'};
  overflow: hidden;
  white-space: nowrap;
    @media (width <= 1600px) {
  min-width: ${props => props.minWidth || '100px'};
  max-width: ${props => props.maxWidth || '1fr'};
    }
  
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
