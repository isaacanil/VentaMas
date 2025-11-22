import React from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../../../constants/icons/icons';
import { Button } from '../../../../Button/Button';
import { Pagination } from '../../Pagination/Pagination';

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
}) => {
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
        {footerRightSide && footerRightSide}
        <Button
          title={'columnas'}
          onClick={toggleReorderMenu}
          startIcon={icons.operationModes.setting}
        />
      </FooterRightSide>
    </Footer>
  );
};

export default TableFooter;
const Footer = styled.div`
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 3em;
  padding: 0 1em;
  background-color: white;
  border-top: var(--border-primary);
`;
const FooterLeftSide = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-self: start;
  grid-column: 1;
`;

const PaginationContainer = styled.div`
  grid-column: 2;
  justify-self: center;
`;

const FooterRightSide = styled.div`
  justify-self: end;
  grid-column: 3;
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
