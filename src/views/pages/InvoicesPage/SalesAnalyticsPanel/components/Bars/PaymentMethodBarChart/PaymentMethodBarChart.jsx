import {
  LinearScale,
  CategoryScale,
  BarElement,
  Chart,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import Typography from '../../../../../../templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

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

const translatePaymentMethod = (method) => {
  switch (method) {
    case 'card':
      return 'Tarjeta';
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    default:
      return method;
  }
};

// Función para crear opciones del gráfico dinámicamente
const createChartOptions = (isMobile) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: !isMobile, // Ocultar título en móvil para ahorrar espacio
        text: 'Ventas ($)',
      },
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
      },
    },
    x: {
      title: {
        display: !isMobile, // Ocultar título en móvil
        text: 'Método de Pago',
      },
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
        maxRotation: isMobile ? 45 : 0, // Rotar etiquetas en móvil si es necesario
      },
    },
  },
  plugins: {
    legend: {
      display: !isMobile, // Ocultar leyenda en móvil
    },
    tooltip: {
      titleFont: {
        size: isMobile ? 12 : 14,
      },
      bodyFont: {
        size: isMobile ? 11 : 13,
      },
    },
  },
});

const accumulatePaymentMethodData = (sales) => {
  return sales.reduce((acc, sale) => {
    sale.data.paymentMethod.forEach((method) => {
      if (method.status) {
        const methodType = translatePaymentMethod(method.method);
        acc[methodType] = (acc[methodType] || 0) + method.value;
      }
    });
    return acc;
  }, {});
};

export const PaymentMethodBarChart = ({ sales }) => {
  const isMobile = useIsMobile();

  if (!sales || !Array.isArray(sales)) {
    return null;
  }

  const salesByPaymentMethod = useMemo(
    () => accumulatePaymentMethodData(sales),
    [sales],
  );

  const data = useMemo(() => {
    const labels = Object.keys(salesByPaymentMethod);
    const dataTotals = labels.map((label) => salesByPaymentMethod[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas ($)',
          data: dataTotals,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [salesByPaymentMethod]);

  // Crear opciones del gráfico dinámicamente
  const chartOptions = useMemo(() => createChartOptions(isMobile), [isMobile]);

  return (
    <Container $isMobile={isMobile}>
      <TitleContainer>
        <Typography variant="h3">Ventas por Método de Pago</Typography>
      </TitleContainer>
      <ChartContainer>
        <Bar data={data} options={chartOptions} />
      </ChartContainer>
    </Container>
  );
};

const Container = styled.div`
  height: ${(props) => (props.$isMobile ? '180px' : '200px')};
  display: grid;
  gap: ${(props) => (props.$isMobile ? '0.5em' : '1em')};

  @media (max-width: 768px) {
    height: 180px;
    gap: 0.5em;
  }

  @media (max-width: 480px) {
    height: 160px;
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
