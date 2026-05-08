import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '@/router/routes/routesName';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100vh;
  padding: var(--ds-space-8) var(--ds-space-4);
  background-color: var(--ds-color-bg-page);
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin-bottom: var(--ds-space-5);
  color: var(--ds-color-state-warning-text);
  font-size: 2.5rem;
  background: var(--ds-color-state-warning-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-2xl);
`;

const Title = styled.h1`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
  text-align: center;
`;

const Subtitle = styled.p`
  max-width: 420px;
  margin: var(--ds-space-3) 0 var(--ds-space-6);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  text-align: center;
`;

const Button = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 var(--ds-space-4);
  color: var(--ds-color-action-on-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-normal);
  text-decoration: none;
  cursor: pointer;
  background-color: var(--ds-color-action-primary);
  border: none;
  border-radius: var(--ds-radius-md);
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    color: var(--ds-color-action-on-primary);
    background-color: var(--ds-color-action-primary-hover);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 3px;
  }
`;

export const NotFound = () => {
  const { HOME } = ROUTES_NAME.BASIC_TERM;
  return (
    <Container>
      <IconWrapper>
        <FontAwesomeIcon icon={faExclamationTriangle} />
      </IconWrapper>
      <Title>Pagina no encontrada</Title>
      <Subtitle>
        La ruta no existe, fue movida o ya no esta disponible para este negocio.
      </Subtitle>
      <Button to={HOME}>Volver al inicio</Button>
    </Container>
  );
};
