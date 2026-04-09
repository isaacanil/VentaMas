import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import { m } from 'framer-motion';
import { useMemo, type JSX } from 'react';
import styled, { keyframes } from 'styled-components';

import { designSystemV2 } from '@/theme/designSystemV2';
import { buildBusinessInsights } from '@/modules/utility/pages/Utility/utils/buildBusinessInsights';
import { SimpleTypography } from '@/components/ui/Typografy/SimpleTypography';
import type {
  UtilityCurrencyFormatter,
  UtilityDailyMetric,
  UtilityInsightMeta,
  UtilitySummary,
} from '@/modules/utility/pages/Utility/types';

const { colors, spacing, radii, shadows } = designSystemV2;

interface BestDayHighlightCardProps {
  summary: UtilitySummary;
  dailyMetrics: UtilityDailyMetric[];
  formatCurrency: UtilityCurrencyFormatter;
  loading: boolean;
}

export const BestDayHighlightCard = ({
  summary,
  dailyMetrics,
  formatCurrency,
  loading,
}: BestDayHighlightCardProps): JSX.Element => {
  const insights = useMemo(
    () =>
      buildBusinessInsights({
        summary,
        dailyMetrics,
        formatCurrency,
      }),
    [summary, dailyMetrics, formatCurrency],
  );

  const bestDayInsight = useMemo(
    () => insights.find((insight) => insight.key === 'bestDay'),
    [insights],
  );

  const meta: UtilityInsightMeta = bestDayInsight?.meta ?? {};

  const formattedSales =
    typeof meta.sales === 'number' ? formatCurrency(meta.sales) : null;
  const formattedExpenses =
    typeof meta.expenses === 'number' ? formatCurrency(meta.expenses) : null;

  return (
    <Card
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 210, damping: 20 }}
    >
      <CardHeader role="heading" aria-level="3">
        <SimpleTypography as="span" size="medium" weight="bold">
          Mejor día del período
        </SimpleTypography>
        {bestDayInsight?.measurement && (
          <Tooltip title={bestDayInsight.measurement} placement="topRight">
            <MeasurementIcon
              role="img"
              aria-label={`Método de medición: ${bestDayInsight.measurement}`}
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </MeasurementIcon>
          </Tooltip>
        )}
      </CardHeader>

      {loading ? (
        <LoadingState aria-label="Cargando insight operativo">
          <LoadingBar $width="82%" />
          <LoadingBar $width="60%" $height="12px" />
          <LoadingBar $width="90%" $height="10px" />
        </LoadingState>
      ) : bestDayInsight ? (
        <Content>
          {meta.dateLabel && <DatePill>{meta.dateLabel}</DatePill>}

          {(formattedSales || formattedExpenses) && (
            <MetaRow>
              {bestDayInsight?.value && (
                <MetaItem>
                  <MetaLabel>Ganancia</MetaLabel>
                  <MetaValue>{bestDayInsight.value}</MetaValue>
                </MetaItem>
              )}
              {formattedSales && (
                <MetaItem>
                  <MetaLabel>Ventas</MetaLabel>
                  <MetaValue>{formattedSales}</MetaValue>
                </MetaItem>
              )}
            </MetaRow>
          )}
        </Content>
      ) : (
        <EmptyHint>
          <SimpleTypography as="span" size="small" color="secondary">
            No se pudo identificar el mejor día para este rango.
          </SimpleTypography>
        </EmptyHint>
      )}
    </Card>
  );
};

const Card = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
  width: 100%;
  max-width: 360px;
  padding: ${spacing.lg};
  background: ${colors.background.surface};
  border: 1px solid ${colors.stroke.subtle};
  border-radius: ${radii.lg};
  box-shadow: ${shadows.md};
`;

const CardHeader = styled.div`
  display: flex;
  gap: ${spacing.sm};
  align-items: center;
  justify-content: space-between;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const DatePill = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${colors.text.secondary};
  letter-spacing: 0.02em;
  background: ${colors.layers.neutralSoft};
  border-radius: ${radii.pill};
`;

const EmptyHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 90px;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.md};
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const MetaLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const MetaValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const MeasurementIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${colors.text.secondary};
  cursor: help;
  background: rgb(148 163 184 / 18%);
  border-radius: 50%;

  svg {
    font-size: 0.95rem;
  }

  &:hover {
    color: ${colors.brand.primary};
    background: rgb(59 130 246 / 15%);
  }
`;

const loadingShimmer = keyframes`
    0% {
        background-position: -120px 0;
    }

    100% {
        background-position: 120px 0;
    }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
  width: 100%;
`;

const LoadingBar = styled.span<{ $width?: string; $height?: string }>`
  display: block;
  width: ${({ $width }) => $width || '100%'};
  height: ${({ $height }) => $height || '14px'};
  background: linear-gradient(
    90deg,
    ${colors.skeleton.base} 0%,
    ${colors.skeleton.highlight} 50%,
    ${colors.skeleton.base} 100%
  );
  background-size: 200% 100%;
  border-radius: ${radii.pill};
  animation: ${loadingShimmer} 1.4s ease-in-out infinite;
`;
