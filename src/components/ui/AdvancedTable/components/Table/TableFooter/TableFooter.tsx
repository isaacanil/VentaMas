import React, { type ReactNode } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { Pagination } from '@/components/ui/AdvancedTable/components/Pagination/Pagination';

interface TableFooterProps {
  elementsShown: number;
  totalElements: number;
  elementName?: ReactNode;
  footerLeftSide?: ReactNode;
  currentPage: number;
  pageCount: number;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  footerRightSide?: ReactNode;
  toggleReorderMenu: () => void;
  showPaginationControls?: boolean;
}

const TableFooter = ({
  elementsShown,
  totalElements,
  elementName,
  footerLeftSide,
  currentPage,
  pageCount,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  footerRightSide,
  toggleReorderMenu,
  showPaginationControls = true,
}: TableFooterProps) => {
  return (
    <Footer>
      <FooterLeftSide>
        <Counter>
          {elementsShown} / {totalElements}
          {elementName && <ElementsName>{elementName}</ElementsName>}
        </Counter>
        {footerLeftSide ? footerLeftSide : ''}
      </FooterLeftSide>
      {showPaginationControls && (
        <PaginationContainer>
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            nextPage={nextPage}
            prevPage={prevPage}
            firstPage={firstPage}
            lastPage={lastPage}
          />
        </PaginationContainer>
      )}
      <FooterRightSide>
        {footerRightSide}
        <ColumnButton
          type="button"
          aria-label="Columnas"
          title="Columnas"
          onClick={toggleReorderMenu}
        >
          {icons.operationModes.setting}
          <ColumnButtonLabel>Columnas</ColumnButtonLabel>
        </ColumnButton>
      </FooterRightSide>
    </Footer>
  );
};

export default TableFooter;
const Footer = styled.div`
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.75em;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 3em;
  padding: 0 1em;
  background-color: white;
  border-top: var(--border-primary);

  @media (width <= 600px) {
    gap: 0.5em;
    padding-inline: 0.45em;
  }
`;
const FooterLeftSide = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-self: start;
  grid-column: 1;
  min-width: 0;

  @media (width <= 600px) {
    gap: 0.45em;
  }
`;

const PaginationContainer = styled.div`
  grid-column: 2;
  justify-self: center;
  min-width: 0;
`;

const FooterRightSide = styled.div`
  justify-self: end;
  grid-column: 3;
  display: flex;
  align-items: center;
  min-width: 0;
`;
const Counter = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  padding: 0.2em 1em;
  font-size: 0.9em;
  font-weight: 600;
  white-space: nowrap;
  background-color: #d3d3d3;
  border-radius: var(--border-radius);

  @media (width <= 600px) {
    padding-inline: 0.65em;
  }
`;
const ElementsName = styled.div`
  font-size: 1em;
  font-weight: 600;
  color: var(--color-gray);
  text-transform: capitalize;

  @media (width <= 1100px) {
    display: none;
  }
`;

const ColumnButton = styled.button`
  display: inline-flex;
  gap: 0.6em;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
  padding: 0 0.6em;
  color: inherit;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;
  cursor: pointer;
  background: var(--color-on-gray, #f1f5f9);
  border: none;
  border-radius: var(--border-radius);

  svg {
    display: flex;
    place-items: center;
    margin: 0;
    font-size: 16px;
  }

  &:hover {
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary, #1677ff);
    outline-offset: 2px;
  }

  @media (width <= 600px) {
    width: 32px;
    padding: 0;
  }
`;

const ColumnButtonLabel = styled.span`
  @media (width <= 600px) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }
`;
