// src/components/NavBar.jsx
import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import Button from '../Button/Button';


const NavBarContainer = styled.nav`
  background-color: #1E3A8A; /* bg-primary */
  color: #FFFFFF; /* text-primary-foreground */
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const NavBarWrapper = styled.div`
  max-width: 1280px; /* container mx-auto */
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem; /* space-x-4 */
`;

const Title = styled.h1`
  font-size: 1.25rem; /* text-xl */
  font-weight: 700; /* font-bold */
`;

const NavBar = () => {
  return (
    <NavBarContainer>
      <NavBarWrapper>
        <LeftSection>
          <Button variant="ghost" style={{ padding: '0.5rem' }}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '0.5rem', height: '1.25rem', width: '1.25rem' }} />
            Volver
          </Button>
          <Title>Gestión de Preventas</Title>
        </LeftSection>
        <Button variant="secondary">
          <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '0.5rem', height: '1.25rem', width: '1.25rem' }} />
          Ir a Facturas
        </Button>
      </NavBarWrapper>
    </NavBarContainer>
  );
};

export default NavBar;
