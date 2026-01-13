import {
  LinearScale,
  CategoryScale,
  BarElement,
  Chart,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useMemo, useState } from 'react';
import type { SalesRecord } from '../../../utils';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import Typography from '@/components/ui/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

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

// Función para crear opciones del gráfico dinámicamente
const createChartOptions = (isMobile: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: !isMobile,
        text: 'Número de Ventas',
      },
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
      },
    },
    x: {
      title: {
        display: !isMobile,
        text: 'Tipo de Compra',
      },
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
        maxRotation: isMobile ? 45 : 0,
      },
    },
  },
  plugins: {
    legend: {
      display: !isMobile,
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

const accumulatePurchaseTypeData = (sales: SalesRecord[]) => {
  return sales.reduce<Record<string, number>>((acc, sale) => {
    const type = sale.data.sourceOfPurchase || 'Sin tipo';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
};

export const PurchaseTypeBarChart = ({ sales }: { sales: SalesRecord[] }) => {
  const isMobile = useIsMobile();
  const normalizedSales = useMemo(
    () => (Array.isArray(sales) ? sales : []),
    [sales],
  );

  const salesByType = useMemo(
    () => accumulatePurchaseTypeData(normalizedSales),
    [normalizedSales],
  );

  const data = useMemo(() => {
    const labels = Object.keys(salesByType);
    const dataTotals = labels.map((label) => salesByType[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Número de Ventas',
          data: dataTotals,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [salesByType]);

  const chartOptions = useMemo(() => createChartOptions(isMobile), [isMobile]);

  if (!normalizedSales.length) {
    return null;
  }

  return (
    <Container $isMobile={isMobile}>
      <TitleContainer>
        <Typography variant="h3">Ventas por Tipo de Compra</Typography>
      </TitleContainer>
      <ChartContainer>
        <Bar data={data} options={chartOptions} />
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
