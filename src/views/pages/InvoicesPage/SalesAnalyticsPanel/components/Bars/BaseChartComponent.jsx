import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Typography from '@/views/templates/system/Typografy/Typografy';

// Hook para detectar tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Componente base para gráficos
export const BaseChartContainer = ({ title, children, height = '200px' }) => {
  const isMobile = useIsMobile();

  return (
    <Container $isMobile={isMobile} $height={height}>
      <TitleContainer>
        <Typography variant="h3">{title}</Typography>
      </TitleContainer>
      <ChartContainer>{children}</ChartContainer>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: ${(props) => (props.$isMobile ? '0.5em' : '1em')};
  height: ${(props) => {
    const baseHeight = parseInt(props.$height);
    return props.$isMobile ? `${baseHeight - 20}px` : props.$height;
  }};

  @media (width <= 768px) {
    gap: 0.5em;
    height: ${(props) => {
      const baseHeight = parseInt(props.$height);
      return `${baseHeight - 20}px`;
    }};
  }

  @media (width <= 480px) {
    gap: 0.25em;
    height: ${(props) => {
      const baseHeight = parseInt(props.$height);
      return `${baseHeight - 40}px`;
    }};
  }
`;

const TitleContainer = styled.div`
  @media (width <= 768px) {
    h3 {
      font-size: 1.1em !important;
      text-align: center;
    }
  }

  @media (width <= 480px) {
    h3 {
      font-size: 1em !important;
      line-height: 1.2;
    }
  }
`;

const ChartContainer = styled.div`
  height: 100%;
  overflow: hidden;

  @media (width <= 768px) {
    overflow-x: auto;
  }
`;
