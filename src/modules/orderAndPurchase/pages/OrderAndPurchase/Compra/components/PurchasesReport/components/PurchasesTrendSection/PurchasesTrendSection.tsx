import { useMemo } from 'react';
import styled from 'styled-components';

import { LazyLine } from '@/components/charts/LazyCharts';
import { formatPrice } from '@/utils/format';

import {
  formatPurchaseTrendHighlight,
  type PurchasesAnalyticsSummary,
} from '../../utils/purchasesAnalyticsSummary';

type PurchasesTrendSectionProps = {
  summary: PurchasesAnalyticsSummary;
};

export const PurchasesTrendSection = ({
  summary,
}: PurchasesTrendSectionProps) => {
  const data = useMemo(
    () => ({
      labels: summary.trend.points.map((point) => point.label),
      datasets: [
        {
          label: 'Comprado',
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
              `Comprado: ${formatPrice(context.parsed.y)}`,
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
            maxTicksLimit: summary.trend.groupBy === 'day' ? 8 : 6,
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
      label:
        summary.trend.groupBy === 'month' ? 'Mes mas fuerte' : 'Dia mas fuerte',
      value: formatPurchaseTrendHighlight(summary.trend.strongest),
    },
    {
      label: 'Ultimo corte',
      value: formatPurchaseTrendHighlight(summary.trend.latest),
    },
    {
      label: 'Promedio del rango',
      value: formatPrice(summary.trend.averageSpend),
    },
    {
      label: 'Items registrados',
      value: new Intl.NumberFormat('es-DO').format(summary.totals.items),
    },
    {
      label: 'Balance pendiente',
      value: formatPrice(summary.totals.pending),
    },
    {
      label: 'Compras con saldo',
      value: new Intl.NumberFormat('es-DO').format(
        summary.totals.purchasesWithBalance,
      ),
    },
  ];

  return (
    <Section>
      <Header>
        <TitleGroup>
          <Title>Tendencia de compras</Title>
          <Subtitle>
            Sigue como se movio el gasto en el periodo y detecta cuando se
            concentraron mas compras.
          </Subtitle>
        </TitleGroup>
        <Pill>
          {summary.trend.groupBy === 'month'
            ? 'Agrupado por mes'
            : 'Agrupado por dia'}
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
  gap: 1rem;
  padding: 1.15rem;
  background: var(--white);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 10px;
`;

const Header = styled.header`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  justify-content: space-between;

  @media (width <= 768px) {
    flex-direction: column;
  }
`;

const TitleGroup = styled.div`
  display: grid;
  gap: 0.25rem;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--black-3);
  font-size: 1rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 48rem;
  color: var(--gray-6);
  font-size: 0.84rem;
  line-height: 1.45;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.65rem;
  color: #1d69a8;
  font-size: 0.76rem;
  font-weight: 600;
  background: rgba(29, 105, 168, 0.08);
  border: 1px solid rgba(29, 105, 168, 0.16);
  border-radius: 999px;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(240px, 0.9fr);
  gap: 1rem;

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
  gap: 0.75rem;
  align-content: start;
`;

const HighlightItem = styled.div`
  display: grid;
  gap: 0.2rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(15 23 42 / 8%);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const HighlightLabel = styled.span`
  color: var(--gray-7);
  font-size: 0.76rem;
  font-weight: 500;
`;

const HighlightValue = styled.strong`
  color: var(--black-3);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.4;
`;
