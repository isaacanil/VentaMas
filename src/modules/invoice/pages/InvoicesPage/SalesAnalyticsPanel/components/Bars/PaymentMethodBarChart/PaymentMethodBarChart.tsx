import React, { useEffect, useMemo, useState } from 'react';
import type { SalesRecord } from '../../../utils';
import { toNumber } from '../../../utils';
import { LazyBar } from '@/components/charts/LazyCharts';
import styled from 'styled-components';

import Typography from '@/components/ui/Typografy/Typografy';

// Hook para detectar tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const translatePaymentMethod = (method: string) => {
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
const createChartOptions = (isMobile: boolean) => ({
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

const accumulatePaymentMethodData = (sales: SalesRecord[]) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    (sale.data.paymentMethod ?? []).forEach((method) => {
      if (method.status) {
        const methodType = translatePaymentMethod(method.method ?? '');
        acc[methodType] = (acc[methodType] || 0) + toNumber(method.value);
      }
    });
    return acc;
  }, {});
};

export const PaymentMethodBarChart = ({ sales }: { sales: SalesRecord[] }) => {
  const isMobile = useIsMobile();
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const salesByPaymentMethod = useMemo(
    () => accumulatePaymentMethodData(normalizedSales),
    [normalizedSales],
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

  if (!normalizedSales.length) {
    return null;
  }

  return (
    <Container $isMobile={isMobile}>
      <TitleContainer>
        <Typography variant="h3">Ventas por Método de Pago</Typography>
      </TitleContainer>
      <ChartContainer>
        <LazyBar data={data} options={chartOptions} />
      </ChartContainer>
    </Container>
  );
};

const Container = styled.div<{ $isMobile: boolean }>`
  display: grid;
  gap: ${(props) => (props.$isMobile ? '0.5em' : '1em')};
  height: ${(props) => (props.$isMobile ? '180px' : '200px')};

  @media (width <= 768px) {
    gap: 0.5em;
    height: 180px;
  }

  @media (width <= 480px) {
    gap: 0.25em;
    height: 160px;
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

