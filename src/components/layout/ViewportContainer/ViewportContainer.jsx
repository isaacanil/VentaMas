import React from 'react'
import styled from 'styled-components'

import { useViewportHeight } from '../../../hooks/windows/useViewportHeight'

export const ViewportContainer = ({ children }) => {
  const viewportHeight = useViewportHeight()

  return (
    <Container viewportHeight={viewportHeight}>
      {children}
    </Container>
  )
}

const Container = styled.div`
  /* Usar la altura dinámica del viewport */
  height: ${props => props.viewportHeight}px;
  
  /* Fallback para navegadores que soportan dvh */
  height: 100dvh;
  
  /* Fallback tradicional */
  @supports not (height: 100dvh) {
    height: 100vh;
  }
  
  /* Para dispositivos móviles, evitar el scroll causado por la barra de navegación */
  @media (max-width: 768px) {
    height: ${props => props.viewportHeight}px;
    overflow: hidden;
  }
  
  /* Asegurar que no hay scroll horizontal */
  overflow-x: hidden;
  
  /* Posicionamiento para que sea el contenedor raíz */
  position: relative;
  width: 100%;
` 