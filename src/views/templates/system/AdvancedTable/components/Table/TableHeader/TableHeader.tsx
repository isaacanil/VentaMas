// @ts-nocheck
import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { Row } from '@/views/templates/system/AdvancedTable/AdvancedTable';

export const TableHeader = ({
  handleSort,
  columnOrder,
  sortConfig,
  isWideScreen: _isWideScreen,
  isWideLayout: _isWideLayout,
  rowSize = 'medium',
}) => {
  const activeColumns = columnOrder.filter((col) => col.status === 'active');

  return (
    <Container>
      <Row $columns={activeColumns}>
        {activeColumns.map((col, index) => (
          <HeaderCell
            key={index}
            $align={col.align}
            $fixed={col.fixed}
            $minWidth={col.minWidth}
            $maxWidth={col.maxWidth}
            data-size={rowSize}
            onClick={() => (col.sortable ? handleSort(col.accessor) : null)}
          >
            {col.Header}
            {sortConfig.key === col.accessor ? (
              sortConfig.direction === 'asc' ? (
                <MotionIcon key="up">{icons.arrows.caretUp}</MotionIcon>
              ) : sortConfig.direction === 'desc' ? (
                <MotionIcon key="down">{icons.arrows.caretDown}</MotionIcon>
              ) : (
                <MotionIcon key="minus">
                  {icons.mathOperations.subtract}
                </MotionIcon>
              )
            ) : (
              col.sortable && (
                <MotionIcon key="minus">
                  {icons.mathOperations.subtract}
                </MotionIcon>
              )
            )}
          </HeaderCell>
        ))}
      </Row>
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: grid;
  gap: 1em;
  align-items: center;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray7);
  background-color: white;
  border-top: var(--border-primary);
  border-bottom: var(--border-primary);
`;
const sizeHeights = {
  small: '2.1em',
  medium: '2.75em', // existing
  large: '3.4em', // slightly larger than previous 3.25em
};

const HeaderCell = styled.div`
  align-items: center;
  display: flex;
  font-weight: bold;
  gap: 0.6em;
  height: ${() => sizeHeights.medium};
  justify-content: ${(props) => props.$align || 'flex-start'};
  overflow: hidden;
  min-width: 0;
  padding: 0 10px;
  position: ${(props) => (props.$fixed ? 'sticky' : 'relative')};
  text-align: ${(props) => props.$align || 'left'};
  white-space: nowrap;
  z-index: 4;

    &[data-size='small'] {
    height: ${sizeHeights.small};
  }

    &[data-size='large'] {
    height: ${sizeHeights.large};
  }

  ${(props) =>
    props.$fixed === 'left' &&
    `
    left: 0;
    z-index: 6;
    background-color: #ffffff;
    border-right: 1px solid var(--gray-3);
  `}
  ${(props) =>
    props.$fixed === 'right' &&
    `
    right: 0;
    z-index: 6;
    background-color: #ffffff;
    border-left: 1px solid var(--gray-3);
  `}

  @media (width <= 1600px) {
    min-width: ${(props) => props.$minWidth || '100px'};
    max-width: ${(props) => props.$maxWidth || '1fr'};
  }
`;

const MotionIcon = styled(motion.div)`
  display: flex;
  place-items: center center;
  justify-content: center;
  min-width: 1em;
  font-size: 1.4em;
  color: var(--color);

  svg {
    font-size: inherit;
    color: inherit;
  }
`;
