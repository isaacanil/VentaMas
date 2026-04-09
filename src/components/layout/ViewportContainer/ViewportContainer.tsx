import React, { type ReactNode } from 'react';
import styled from 'styled-components';

import { useViewportHeight } from '@/hooks/windows/useViewportHeight';

type ViewportContainerProps = {
  children: ReactNode;
};

type ViewportContainerStyleProps = {
  $viewportHeight: number;
};

export const ViewportContainer = ({ children }: ViewportContainerProps) => {
  const viewportHeight = useViewportHeight();

  return <Container $viewportHeight={viewportHeight}>{children}</Container>;
};

const Container = styled.div<ViewportContainerStyleProps>`
  /* Posicionamiento para que sea el contenedor raíz */
  position: relative;
  width: 100%;

  /* Usar la altura dinámica del viewport */
  height: ${({ $viewportHeight }) => $viewportHeight}px;

  /* Fallback para navegadores que soportan dvh */
  height: 100dvh;

  /* Asegurar que no hay scroll horizontal */
  overflow-x: hidden;

  /* Fallback tradicional */
  @supports not (height: 100dvh) {
    height: 100vh;
  }

  /* Para dispositivos móviles, evitar el scroll causado por la barra de navegación */
  @media (width <= 768px) {
    height: ${({ $viewportHeight }) => $viewportHeight}px;
    overflow: hidden;
  }
`;
