// @ts-nocheck
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import styled from 'styled-components';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

export const UserActivityCharts = ({ stats }) => {
  if (!stats) return null;

  // Radar Data
  const radarData = {
    labels: ['Ventas', 'Productos', 'Compras', 'Gastos', 'Cuentas x Cobrar'],
    datasets: [
      {
        label: 'Actividad',
        data: [
          stats.radar.sales,
          stats.radar.products,
          stats.radar.purchases,
          stats.radar.expenses,
          stats.radar.ar,
        ],
        backgroundColor: 'rgba(34, 202, 236, 0.2)',
        borderColor: 'rgba(34, 202, 236, 1)',
        borderWidth: 1,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        ticks: { display: false }, // Hide numbers for cleaner look
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Heatmap Data
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getIntensity = (day, hour) => {
    const count = stats.heatmap[`${day}-${hour}`] || 0;
    if (count === 0) return 0;
    if (count < 2) return 0.3;
    if (count < 5) return 0.6;
    return 1;
  };

  return (
    <ChartsWrapper>
      <Card>
        <Title>Desempeño (Radar)</Title>
        <ChartContainer>
          <Radar data={radarData} options={radarOptions} />
        </ChartContainer>
      </Card>

      <Card>
        <Title>Hábitos (Mapa de Calor)</Title>
        <HeatmapContainer>
          <HeaderRow>
            <div />
            {hours.map((h) => (
              <HeaderCell key={h}>{h}</HeaderCell>
            ))}
          </HeaderRow>
          {days.map((dayLabel, dayIndex) => (
            <Row key={dayLabel}>
              <DayLabel>{dayLabel}</DayLabel>
              {hours.map((hour) => (
                <Cell
                  key={hour}
                  $intensity={getIntensity(dayIndex, hour)}
                  title={`${dayLabel} ${hour}:00 - ${stats.heatmap[`${dayIndex}-${hour}`] || 0
                    } acciones`}
                />
              ))}
            </Row>
          ))}
        </HeatmapContainer>
      </Card>
    </ChartsWrapper>
  );
};

const ChartsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #555;
`;

const ChartContainer = styled.div`
  width: 100%;
  max-width: 300px;
`;

const HeatmapContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  overflow-x: auto;
  padding: 10px; /* Add padding to accommodate scale(1.2) on hover */
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 40px repeat(24, 1fr);
  gap: 2px;
  margin-bottom: 4px;
`;

const HeaderCell = styled.div`
  font-size: 0.6rem;
  text-align: center;
  color: #888;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 40px repeat(24, 1fr);
  gap: 2px;
`;

const DayLabel = styled.div`
  font-size: 0.7rem;
  color: #666;
  display: flex;
  align-items: center;
`;

const Cell = styled.div`
  aspect-ratio: 1;
  background-color: #22caec;
  opacity: ${({ $intensity }) => ($intensity > 0 ? $intensity : 0.1)};
  border-radius: 2px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
    transform: scale(1.2);
  }
`;
