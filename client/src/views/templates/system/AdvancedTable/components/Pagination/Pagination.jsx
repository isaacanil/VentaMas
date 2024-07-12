import React from 'react'
import styled from 'styled-components';
import { icons } from '../../../../../../constants/icons/icons';

export const Pagination = ({
  firstPage,
  prevPage,
  nextPage,
  lastPage,
  pageCount,
  currentPage,
}) => {
  // Validar que pageCount sea un número positivo
  const validPageCount = Math.max(1, pageCount);

  // Asegurarse de que currentPage esté dentro de los límites válidos
  const validCurrentPage = Math.max(0, Math.min(currentPage, validPageCount - 1));

  const isFirstPage = validCurrentPage === 0;
  const isLastPage = validCurrentPage === validPageCount - 1;
  return (
    <PaginationContainer>
      <PageSwitch
        onClick={firstPage}
        disabled={isFirstPage}
        responsive
        aria-label="Primera página"
      >
        {icons.arrows.AnglesLeft}
      </PageSwitch>
      <PageSwitch
        onClick={prevPage}
        disabled={isFirstPage}
        aria-label="Página anterior"
      >
        {icons.arrows.chevronLeft}
      </PageSwitch>
      <PageCount>
        {validCurrentPage + 1} / {validPageCount}
      </PageCount>
      <PageSwitch
        onClick={nextPage} 
        disabled={isLastPage}
        aria-label="Página siguiente"
      >
        {icons.arrows.chevronRight}
      </PageSwitch>
      <PageSwitch
        onClick={lastPage}
        disabled={isLastPage}
        responsive
        aria-label="Última página"
      >
        {icons.arrows.AnglesRight}
      </PageSwitch>
    </PaginationContainer>
  )
}
const PaginationContainer = styled.div`
  display: flex;
  gap: 0.5em;
  justify-self: center;
  justify-content: space-between;
  align-items: center;

  height: 100%;
 
`;

const PageCount = styled.div`
 

  display: flex;
  justify-content: center;
`
const PageSwitch = styled.button`
 

  cursor: pointer;
  height: 2em;
  width: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100px;
  border: none;
  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
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