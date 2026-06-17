import { useMemo } from 'react';
import styled from 'styled-components';

import { LazyLine } from '@/components/charts';
import { formatCount } from '@/utils/formatCounts';
import { formatPrice } from '@/utils/format';

import {
  formatTrendHighlight,
  type SalesAnalyticsSummary,
} from '../../analyticsSummary';

type SalesTrendSectionProps = {
  summary: SalesAnalyticsSummary;
};

const TREND_GROUP_LABELS = {
  hour: 'Agrupado por hora',
  day: 'Agrupado por dia',
  month: 'Agrupado por mes',
} as const;

const STRONGEST_LABELS = {
  hour: 'Hora mas fuerte',
  day: 'Dia mas fuerte',
  month: 'Mes mas fuerte',
} as const;

export const SalesTrendSection = ({ summary }: SalesTrendSectionProps) => {
  const data = useMemo(
    () => ({
      labels: summary.trend.points.map((point) => point.label),
      datasets: [
        {
          label: 'Facturacion',
          data: summary.trend.points.map((point) => point.total),
          borderColor: '#1d69a8',
          backgroundColor: 'rgba(29, 105, 168, 0.14)',
          pointBackgroundColor: '#1d69a8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: summary.trend.points.length > 18 ? 2 : 3,
          pointHoverRadius: 4,
          borderWidth: 2,
          tension: 0.24,
          fill: true,
        },
      ],
    }),
    [summary.trend.points],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (context: { parsed: { y: number } }) =>
              `Facturacion: ${formatPrice(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'rgb(100 100 100)',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit:
              summary.trend.groupBy === 'hour'
                ? 12
                : summary.trend.groupBy === 'day'
                  ? 8
                  : 6,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgb(15 23 42 / 8%)',
          },
          ticks: {
            color: 'rgb(100 100 100)',
            callback: (value: number | string) =>
              formatPrice(Number(value)).replace(/^RD\$/, ''),
          },
        },
      },
    }),
    [summary.trend.groupBy],
  );

  const highlights = [
    {
      label: STRONGEST_LABELS[summary.trend.groupBy],
      value: formatTrendHighlight(summary.trend.strongest),
    },
    {
      label: 'Ultimo corte',
      value: formatTrendHighlight(summary.trend.latest),
    },
    {
      label: 'Promedio del rango',
      value: formatPrice(summary.trend.averageSales),
    },
    {
      label: 'Items vendidos',
      value: formatCount(summary.totals.items),
    },
    {
      label: 'Descuentos otorgados',
      value: formatPrice(summary.totals.discounts),
    },
    {
      label: 'Impuestos cobrados',
      value: formatPrice(summary.totals.taxes),
    },
  ];

  return (
    <Section>
      <Header>
        <TitleGroup>
          <Title>Tendencia de ventas</Title>
          <Subtitle>
            Sigue como se movio la facturacion en el periodo y detecta los
            momentos de mayor y menor venta.
          </Subtitle>
        </TitleGroup>
        <Pill>
          {TREND_GROUP_LABELS[summary.trend.groupBy]}
        </Pill>
      </Header>

      <Body>
        <ChartArea>
          <LazyLine data={data} options={chartOptions} />
        </ChartArea>

        <Highlights>
          {highlights.map((highlight) => (
            <HighlightItem key={highlight.label}>
              <HighlightLabel>{highlight.label}</HighlightLabel>
              <HighlightValue>{highlight.value}</HighlightValue>
            </HighlightItem>
          ))}
        </Highlights>
      </Body>
    </Section>
  );
};

const Section = styled.section`
  display: grid;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const Header = styled.header`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;

  @media (width <= 768px) {
    flex-direction: column;
  }
`;

const TitleGroup = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const Title = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 48rem;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-1) var(--ds-space-2);
  color: var(--ds-color-action-on-primary-subtle);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  background: var(--ds-color-action-primary-subtle);
  border: 1px solid var(--ds-color-interactive-selected-border);
  border-radius: var(--ds-radius-pill);
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(240px, 0.9fr);
  gap: var(--ds-space-4);

  @media (width <= 920px) {
    grid-template-columns: 1fr;
  }
`;

const ChartArea = styled.div`
  min-height: 320px;
  padding-top: 0.2rem;
`;

const Highlights = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  align-content: start;
`;

const HighlightItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding-bottom: var(--ds-space-3);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const HighlightLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const HighlightValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-normal);
`;
