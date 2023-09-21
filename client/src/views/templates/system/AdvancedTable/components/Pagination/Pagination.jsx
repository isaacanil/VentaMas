import React from 'react'
import styled from 'styled-components';
import { icons } from '../../../../../../constants/icons/icons';

export const Pagination = ({ firstPage, prevPage, nextPage, lastPage, pageCount, currentPage, }) => {
  return (
    <PaginationContainer>
      <PageSwitch onClick={firstPage} disabled={currentPage === 0} responsive>{icons.arrows.AnglesLeft}</PageSwitch>
      <PageSwitch onClick={prevPage} disabled={currentPage === 0}>{icons.arrows.chevronLeft}</PageSwitch>
      <PageCount>{currentPage + 1} / {pageCount}</PageCount>
      <PageSwitch onClick={nextPage} disabled={currentPage === pageCount - 1}>{icons.arrows.chevronRight}</PageSwitch>
      <PageSwitch onClick={lastPage} disabled={currentPage === pageCount - 1} responsive>{icons.arrows.AnglesRight}</PageSwitch>
    </PaginationContainer>
  )
}
const PaginationContainer = styled.div`
  display: flex;
  justify-self: center;
  justify-content: space-between;
  align-items: center;

  height: 100%;
 
`;

const PageCount = styled.div`
  width: 100px;
  display: flex;
  justify-content: center;
`
const PageSwitch = styled.button`
 
  margin: 0 0.5em;
  cursor: pointer;
  height: 2em;
  width: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100px;
  border: none;

  ${props => {
    switch (props.responsive) {
      case true:
        return `
        @media (max-width: 600px){
          display: none;
        }
        `
      default:
        break;
    }
  }
  }
`;