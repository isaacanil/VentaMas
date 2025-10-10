import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Typography from '../../../../../templates/system/Typografy/Typografy';

// Hook para detectar tamaño de pantalla
export const useIsMobile = () => {
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

// Función para crear opciones base del gráfico
export const createBaseChartOptions = (isMobile, customOptions = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: !isMobile,
        text: customOptions.yAxisTitle || 'Valores',
      },
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        }
      }
    },
    x: {
      title: {
        display: !isMobile,
        text: customOptions.xAxisTitle || 'Categorías',
      },
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
        maxRotation: isMobile ? 45 : 0,
      }
    },
  },
  plugins: {
    legend: {
      display: customOptions.showLegend !== false ? !isMobile : false,
    },
    tooltip: {
      titleFont: {
        size: isMobile ? 12 : 14,
      },
      bodyFont: {
        size: isMobile ? 11 : 13,
      }
    }
  },
  ...customOptions.additionalOptions
});

// Componente base para gráficos
export const BaseChartContainer = ({ title, children, height = '200px' }) => {
  const isMobile = useIsMobile();
  
  return (
    <Container $isMobile={isMobile} $height={height}>
      <TitleContainer>
        <Typography variant='h3'>{title}</Typography>
      </TitleContainer>
      <ChartContainer>
        {children}
      </ChartContainer>
    </Container>
  );
};

const Container = styled.div`
    height: ${props => {
      const baseHeight = parseInt(props.$height);
      return props.$isMobile ? `${baseHeight - 20}px` : props.$height;
    }};
    display: grid;
    gap: ${props => props.$isMobile ? '0.5em' : '1em'};
    
    @media (max-width: 768px) {
      height: ${props => {
        const baseHeight = parseInt(props.$height);
        return `${baseHeight - 20}px`;
      }};
      gap: 0.5em;
    }
    
    @media (max-width: 480px) {
      height: ${props => {
        const baseHeight = parseInt(props.$height);
        return `${baseHeight - 40}px`;
      }};
      gap: 0.25em;
    }
`;

const TitleContainer = styled.div`
    @media (max-width: 768px) {
      h3 {
        font-size: 1.1em !important;
        text-align: center;
      }
    }
    
    @media (max-width: 480px) {
      h3 {
        font-size: 1em !important;
        line-height: 1.2;
      }
    }
`;

const ChartContainer = styled.div`
    height: 100%;
    overflow: hidden;
    
    @media (max-width: 768px) {
      overflow-x: auto;
    }
`; 