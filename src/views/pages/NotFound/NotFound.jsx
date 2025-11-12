import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '../../../routes/routesName';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
      height: 100%;
  background-color: #f8f8f8;
`;

const IconWrapper = styled.div`
  font-size: 6rem;
  color: #ff8c00;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  color: #333;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  margin: 1rem 0 3.4rem;
  color: #555;
  text-align: center;
`;

const Button = styled(Link)`
  font-size: 1.2rem;
  background-color: var(--color);
  color: #fff;
  border: none;
  padding: 0.4em 1.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color:var(--color);
    transform: translateY(-2px);
  }
`;

export const NotFound = () => {
  const {HOME} = ROUTES_NAME.BASIC_TERM
  return (
    <Container>
      <IconWrapper>
        <FontAwesomeIcon icon={faExclamationTriangle} />
      </IconWrapper>
      <Title>¡Vaya!</Title>
      <Subtitle>No pudimos encontrar la página que estás buscando.</Subtitle>
      <Button to={HOME}>Volver al inicio</Button>
    </Container>
  );
};


