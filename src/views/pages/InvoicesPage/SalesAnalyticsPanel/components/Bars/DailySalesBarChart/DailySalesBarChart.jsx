import {
  LinearScale,
  CategoryScale,
  BarElement,
  Chart,
  Tooltip,
} from 'chart.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import Typography from '../../../../../../templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

// Función para crear opciones del gráfico dinámicamente
const createChartOptions = (isMobile, salesByDay, sortedDateKeys) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Monto de Ventas',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Fecha',
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          if (isMobile && context.dataset.label === 'Total Ventas') {
            // En móvil, mostrar desglose detallado en el tooltip
            const dateKey = sortedDateKeys[context.dataIndex];
            const dayData = salesByDay[dateKey];

            return [
              `Total: ${useFormatPrice(dayData.total)}`,
              `Efectivo: ${useFormatPrice(dayData.cash)}`,
              `Tarjeta: ${useFormatPrice(dayData.card)}`,
              `Transferencia: ${useFormatPrice(dayData.transfer)}`,
              `Nota de Crédito: ${useFormatPrice(dayData.creditNote)}`,
            ];
          } else {
            // En desktop, mostrar normal
            let label = context.dataset.label || '';
            if (label) {
              label += ': ' + useFormatPrice(context.parsed.y);
            }
            return label;
          }
        },
      },
    },
  },
});

const formatDate = (seconds, byMonth = false) => {
  const date = new Date(seconds * 1000);
  return byMonth
    ? date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : date.toLocaleDateString();
};

// Función para obtener el período (mes o trimestre) de una fecha
const getPeriod = (date, periodType) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (periodType === 'monthly') {
    return `${year}-${month.toString().padStart(2, '0')}`;
  } else if (periodType === 'quarterly') {
    const quarter = Math.floor(month / 3) + 1;
    return `${year}-Q${quarter}`;
  }
  return date.toISOString().split('T')[0];
};

// Función para formatear el período para mostrar
const formatPeriodDisplay = (period, periodType) => {
  if (periodType === 'monthly') {
    const [year, month] = period.split('-');
    const date = new Date(year, parseInt(month), 1);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  } else if (periodType === 'quarterly') {
    const [year, quarter] = period.split('-');
    return `${quarter} ${year}`;
  }
  return period;
};

// Función para obtener todos los períodos disponibles
const getAvailablePeriods = (sales, periodType) => {
  const periods = new Set();
  sales.forEach((sale) => {
    const date = new Date(sale.data.date.seconds * 1000);
    const period = getPeriod(date, periodType);
    periods.add(period);
  });
  return Array.from(periods).sort();
};

// Función para filtrar ventas por período
const filterSalesByPeriod = (sales, period, periodType) => {
  return sales.filter((sale) => {
    const date = new Date(sale.data.date.seconds * 1000);
    const salePeriod = getPeriod(date, periodType);
    return salePeriod === period;
  });
};

const accumulateSalesData = (sales, byMonth = false) => {
  return sales.reduce((acc, sale) => {
    // Crear una clave de fecha que sea fácil de ordenar (YYYY-MM-DD)
    const dateObj = new Date(sale.data.date.seconds * 1000);
    const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    const displayDate = formatDate(sale.data.date.seconds, byMonth);

    // Usar la fecha formateada para mostrar, pero mantener la clave ordenable
    acc[dateKey] = acc[dateKey] || {
      total: 0,
      taxes: 0,
      invoices: 0,
      products: 0,
      discounts: 0,
      cash: 0,
      card: 0,
      transfer: 0,
      creditNote: 0,
      displayDate: displayDate, // Guardar la fecha para mostrar
    };
    acc[dateKey].total += sale.data.totalPurchase.value;

    acc[dateKey].invoices += 1;
    acc[dateKey].products += sale.data.totalShoppingItems.value;
    acc[dateKey].discounts += sale?.data?.discount?.value;
    const paymentValue = sale.data?.payment?.value;
    sale.data.paymentMethod.forEach((method) => {
      if (method.status) {
        switch (method.method) {
          case 'cash':
            acc[dateKey].cash += paymentValue;
            break;
          case 'card':
            acc[dateKey].card += paymentValue;
            break;
          case 'transfer':
            acc[dateKey].transfer += paymentValue;
            break;
          case 'creditNote':
            acc[dateKey].creditNote += paymentValue;
            break;
          default:
            break;
        }
      }
    });
    return acc;
  }, {});
};

// Hook para detectar tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // Consideramos móvil si es menor a 768px
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export const DailySalesBarChart = ({ sales }) => {
  const [periodType, setPeriodType] = useState('monthly'); // 'monthly' o 'quarterly'
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const isMobile = useIsMobile();

  if (!sales || !Array.isArray(sales)) {
    return null;
  }

  // Obtener períodos disponibles
  const availablePeriods = useMemo(
    () => getAvailablePeriods(sales, periodType),
    [sales, periodType],
  );

  // Establecer el período actual (el más reciente por defecto)
  useEffect(() => {
    if (availablePeriods.length > 0) {
      setCurrentPeriodIndex(availablePeriods.length - 1);
    }
  }, [availablePeriods]);

  // Filtrar ventas por período actual
  const currentPeriod = availablePeriods[currentPeriodIndex];
  const filteredSales = useMemo(() => {
    if (!currentPeriod) return [];
    return filterSalesByPeriod(sales, currentPeriod, periodType);
  }, [sales, currentPeriod, periodType]);

  // Determinar si mostrar por mes basado en el span de fechas del período actual
  const byMonth = useMemo(() => {
    if (filteredSales.length === 0) return false;

    const dateSpan = filteredSales.reduce(
      (span, sale) => {
        const date = sale.data.date.seconds * 1000;
        span.min = Math.min(span.min, date);
        span.max = Math.max(span.max, date);
        return span;
      },
      { min: Infinity, max: -Infinity },
    );

    const spanInMonths =
      (dateSpan.max - dateSpan.min) / (1000 * 60 * 60 * 24 * 30);
    return spanInMonths > 2;
  }, [filteredSales]);

  const salesByDay = useMemo(
    () => accumulateSalesData(filteredSales, byMonth),
    [filteredSales, byMonth],
  );

  const data = useMemo(() => {
    // Ordenar las fechas cronológicamente (de izquierda a derecha: antigua -> reciente)
    const sortedDateKeys = Object.keys(salesByDay).sort((a, b) => {
      // Como las claves están en formato YYYY-MM-DD, el sort alfabético funciona
      return a.localeCompare(b);
    });

    // Usar las fechas de visualización para las etiquetas
    const labels = sortedDateKeys.map(
      (dateKey) => salesByDay[dateKey].displayDate,
    );
    const dataTotals = sortedDateKeys.map(
      (dateKey) => salesByDay[dateKey].total,
    );
    const dataCash = sortedDateKeys.map((dateKey) => salesByDay[dateKey].cash);
    const dataCard = sortedDateKeys.map((dateKey) => salesByDay[dateKey].card);
    const dataTransfer = sortedDateKeys.map(
      (dateKey) => salesByDay[dateKey].transfer,
    );
    const dataCreditNote = sortedDateKeys.map(
      (dateKey) => salesByDay[dateKey].creditNote,
    );

    // Crear datasets diferentes para móvil y desktop
    const datasets = isMobile
      ? [
          // En móvil: solo mostrar el total
          {
            label: 'Total Ventas',
            data: dataTotals,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            minBarLength: 5,
          },
        ]
      : [
          // En desktop: mostrar desglose por método de pago
          {
            label: 'Efectivo',
            data: dataCash,
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
            minBarLength: 5,
          },
          {
            label: 'Tarjeta',
            data: dataCard,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            minBarLength: 5,
          },
          {
            label: 'Transferencia',
            data: dataTransfer,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            minBarLength: 5,
          },
          {
            label: 'Nota de Crédito',
            data: dataCreditNote,
            backgroundColor: 'rgba(201, 203, 207, 0.2)',
            borderColor: 'rgba(201, 203, 207, 1)',
            borderWidth: 1,
            minBarLength: 5,
          },
        ];

    return {
      labels,
      datasets,
      sortedDateKeys, // Necesario para el tooltip en móvil
    };
  }, [salesByDay, isMobile]);

  // Crear opciones del gráfico con datos dinámicos
  const chartOptions = useMemo(
    () => createChartOptions(isMobile, salesByDay, data.sortedDateKeys),
    [isMobile, salesByDay, data.sortedDateKeys],
  );

  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      if (chartRef.current && chartRef.current instanceof Chart) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Handlers para navegación
  const handlePreviousPeriod = () => {
    setCurrentPeriodIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextPeriod = () => {
    setCurrentPeriodIndex((prev) =>
      Math.min(availablePeriods.length - 1, prev + 1),
    );
  };

  const handlePeriodTypeChange = (newPeriodType) => {
    setPeriodType(newPeriodType);
    setCurrentPeriodIndex(0); // Reset to first period when changing type
  };

  return (
    <Container>
      <Header>
        <TitleContainer>
          <Typography variant="h3">
            Ventas Totales por Día y Método de Pago
          </Typography>
        </TitleContainer>

        <PeriodControls>
          <PeriodTypeButtons>
            <PeriodButton
              $active={periodType === 'monthly'}
              onClick={() => handlePeriodTypeChange('monthly')}
            >
              Mensual
            </PeriodButton>
            <PeriodButton
              $active={periodType === 'quarterly'}
              onClick={() => handlePeriodTypeChange('quarterly')}
            >
              Trimestral
            </PeriodButton>
          </PeriodTypeButtons>

          <NavigationControls>
            <NavButton
              onClick={handlePreviousPeriod}
              disabled={currentPeriodIndex === 0}
              title="Período anterior"
            >
              ◀
            </NavButton>

            <PeriodDisplay>
              {currentPeriod && formatPeriodDisplay(currentPeriod, periodType)}
            </PeriodDisplay>

            <NavButton
              onClick={handleNextPeriod}
              disabled={currentPeriodIndex === availablePeriods.length - 1}
              title="Período siguiente"
            >
              ▶
            </NavButton>
          </NavigationControls>
        </PeriodControls>
      </Header>

      <ChartContainer>
        <Bar ref={chartRef} data={data} options={chartOptions} />
      </ChartContainer>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  height: 250px;

  @media (width <= 768px) {
    gap: 0.75em;
  }

  @media (width <= 480px) {
    gap: 0.5em;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 1em;

  @media (width <= 768px) {
    gap: 0.75em;
  }
`;

const TitleContainer = styled.div`
  @media (width <= 768px) {
        h3 {
      font-size: 1.3em !important;
      text-align: center;
    }
  }

  @media (width <= 480px) {
        h3 {
      font-size: 1.1em !important;
      line-height: 1.2;
      text-align: center;
    }
  }
`;

const PeriodControls = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 1em;
  align-items: center;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
    gap: 0.75em;
  }

  @media (width <= 480px) {
    gap: 0.5em;
  }
`;

const PeriodTypeButtons = styled.div`
  display: flex;
  gap: 0.5em;

  @media (width <= 768px) {
    justify-content: center;
  }

  @media (width <= 480px) {
    gap: 0.25em;
  }
`;

const PeriodButton = styled.button`
  padding: 0.5em 1em;
  font-size: 0.9em;
  color: ${(props) => (props.$active ? '#fff' : '#333')};
  white-space: nowrap;
  cursor: pointer;
  background-color: ${(props) => (props.$active ? '#007bff' : '#fff')};
  border: 1px solid #ddd;
  border-radius: 0.25em;
  transition: all 0.2s ease;

    &:hover {
    background-color: ${(props) => (props.$active ? '#0056b3' : '#f8f9fa')};
  }

  @media (width <= 768px) {
    padding: 0.4em 0.8em;
    font-size: 0.85em;
  }

  @media (width <= 480px) {
    flex: 1;
    padding: 0.3em 0.6em;
    font-size: 0.8em;
  }
`;

const NavigationControls = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: center;

  @media (width <= 768px) {
    gap: 0.75em;
  }

  @media (width <= 480px) {
    gap: 0.5em;
  }
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0.5em;
  font-size: 1.1em;
  color: #333;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 0.25em;
  transition: all 0.2s ease;

    &:hover:not(:disabled) {
    background-color: #f8f9fa;
    border-color: #007bff;
  }

    &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (width <= 768px) {
    min-width: 36px;
    height: 36px;
    font-size: 1em;
  }

  @media (width <= 480px) {
    min-width: 32px;
    height: 32px;
    font-size: 0.9em;
  }
`;

const PeriodDisplay = styled.div`
  flex: 1;
  min-width: 200px;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  text-align: center;

  @media (width <= 768px) {
    min-width: 150px;
    font-size: 1em;
  }

  @media (width <= 480px) {
    min-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9em;
    white-space: nowrap;
  }
`;

const ChartContainer = styled.div`
  height: 100%;
  overflow: hidden;

  @media (width <= 768px) {
    /* Asegurar que el gráfico sea scrollable horizontalmente si es necesario */
    overflow-x: auto;
  }
`;
