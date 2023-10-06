import React from 'react'
import styled from 'styled-components';
import { Pagination } from '../../Pagination/Pagination';
import { icons } from '../../../../../../../constants/icons/icons';
import { Button } from '../../../../Button/Button';

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
      <Pagination
        currentPage={currentPage}
        pageCount={pageCount}
        nextPage={nextPage}
        prevPage={prevPage}
        firstPage={firstPage}
        lastPage={lastPage}
      />
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
   padding: 0 1em;
    z-index: 1;
    grid-template-columns: 1fr 1fr 1fr;
    display: grid;
    align-items: center;
    background-color: white;
  height: 3em;
  border-top: var(--border-primary);
`;
const FooterLeftSide = styled.div`
  justify-self: start;
  display: flex;
  gap: 1em;
  align-items: center;
`

const FooterRightSide = styled.div`
  justify-self: end;
`
const Counter = styled.div`
  display: flex;
  align-items: center;
  border-radius: var(--border-radius);
  gap: 0.5em;
  padding: 0.2em 1em;
  font-weight: 600;
  font-size: 0.9em;
  background-color: #d3d3d3;
`
const ElementsName = styled.div`
  font-weight: 600;
  font-size: 1em;
  color: var(--color-gray);
  text-transform: capitalize;
  @media (max-width: 868px) {
    display: none;
  }
`