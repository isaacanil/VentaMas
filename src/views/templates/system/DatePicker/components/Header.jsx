import { faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

/**
 * Componente que representa el encabezado del calendario con navegación
 */
const Header = ({
  currentViewDate,
  goToPreviousMonth,
  goToNextMonth,
  goToPreviousYear,
  goToNextYear,
  goToCurrentMonth
}) => {
  const monthName = currentViewDate.toFormat('MMMM');
  const year = currentViewDate.year;
  
  return (
    <StyledHeader>
      <YearMonthContainer>
        <MonthYear onClick={goToCurrentMonth} title="Ir al mes actual">
          <Month>{monthName}</Month>
          <Year>{year}</Year>
        </MonthYear>
      </YearMonthContainer>
      
      <NavigationContainer>        <NavButton onClick={goToPreviousYear} title="Año anterior">
          <FontAwesomeIcon icon={faAnglesLeft} />
        </NavButton>
        <NavButton onClick={goToPreviousMonth} title="Mes anterior">
          <FontAwesomeIcon icon={faChevronLeft} />
        </NavButton>
        <NavButton onClick={goToNextMonth} title="Mes siguiente">
          <FontAwesomeIcon icon={faChevronRight} />
        </NavButton>
        <NavButton onClick={goToNextYear} title="Año siguiente">
          <FontAwesomeIcon icon={faAnglesRight} />
        </NavButton>
      </NavigationContainer>
    </StyledHeader>
  );
};

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: white;
  border-bottom: 1px solid #e8e8e8;
`;

const YearMonthContainer = styled.div`
  display: flex;
  align-items: center;
`;

const MonthYear = styled.div`
  cursor: pointer;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  transition: color 0.2s;
  
  &:hover {
    color: #2772e4;
  }
`;

const Month = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: capitalize;
`;

const Year = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
`;

const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e6f0ff;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export default Header;
