import {
  faArrowTrendDown,
  faArrowTrendUp,
  faChartLine,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import { motion } from 'framer-motion';
import type { JSX } from 'react';
import styled, { keyframes } from 'styled-components';

import { designSystemV2 } from '@/theme/designSystemV2';
import { SimpleTypography } from '@/components/ui/Typografy/SimpleTypography';
import type {
  UtilityComparison,
  UtilityCurrencyFormatter,
  UtilityPercentageFormatter,
  UtilityTrend,
} from '@/modules/utility/pages/Utility/types';

const { colors, spacing, radii, shadows } = designSystemV2;

const TREND_VARIANTS: Record<UtilityTrend, {
  color: string;
  surface: string;
  border: string;
  shadow: string;
}> = {
  up: {
    color: colors.states.success,
    surface: colors.layers.successSoft,
    border: colors.layers.successBorder,
    shadow: shadows.state.success,
  },
  down: {
    color: colors.states.danger,
    surface: colors.layers.dangerSoft,
    border: colors.layers.dangerBorder,
    shadow: shadows.state.danger,
  },
  flat: {
    color: colors.states.neutral,
    surface: colors.layers.neutralSoft,
    border: colors.layers.neutralBorder,
    shadow: shadows.state.neutral,
  },
};

const getTrendVariant = (trend: UtilityTrend) =>
  TREND_VARIANTS[trend] ?? TREND_VARIANTS.flat;

const formatMultiplier = (ratio: number | null | undefined): string => {
  if (ratio === null || ratio === undefined) return '';
  let formatted;
  if (ratio < 10) {
    formatted = ratio.toFixed(2);
  } else if (ratio < 100) {
    formatted = ratio.toFixed(1);
  } else {
    formatted = ratio.toFixed(0);
  }
  return `×${Number(formatted)}`;
};

type TitleProps = { title?: string };
type TrendIconProps = { trend: UtilityTrend };
type LoadingBarProps = { $width?: string; $height?: string };

interface RangeComparisonCardProps {
  loading: boolean;
  comparison?: UtilityComparison | null;
  formatCurrency: UtilityCurrencyFormatter;
  formatPercentage: UtilityPercentageFormatter;
}

export const RangeComparisonCard = ({
  loading,
  comparison,
  formatCurrency,
  formatPercentage,
}: RangeComparisonCardProps): JSX.Element => {
  const hasComparison = Boolean(comparison);
  const { current, previous, delta, percentage, trend } = comparison || {
    current: 0,
    previous: 0,
    delta: 0,
    percentage: 0,
    trend: 'flat' as UtilityTrend,
  };

  const cardTitle = 'Ganancia Neta';
  const previousLabel = hasComparison && comparison
    ? comparison.previousLabel
    : 'Período anterior';
  const referenceLabel = (previousLabel || 'Período anterior').toLowerCase();
  const formattedCurrent = hasComparison ? formatCurrency(current) : '—';
  const formattedPrevious =
    hasComparison && previous !== null ? formatCurrency(previous) : null;

  const renderChangeContent = () => {
    if (!hasComparison || !comparison) {
      return (
        <SimpleTypography as="span" size="small" color="secondary">
          Sin datos de comparación
        </SimpleTypography>
      );
    }

    const isBaselineZero = previous === 0 && current !== 0;
    const isSignChange = current * previous < 0;

    const formatDeltaAmount = (value: number | null): string | null => {
      if (value === null) return null;
      const absolute = Math.abs(value);
      const formatted = formatCurrency(absolute);
      return `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatted}`;
    };

    const deltaAmount = formatDeltaAmount(delta);
    const percentageChange =
      percentage !== null ? formatPercentage(percentage) : null;

    if (isBaselineZero) {
      const tooltip = `De ${formatCurrency(0)} a ${formatCurrency(current)}`;
      return (
        <Tooltip title={tooltip}>
          <ChangeLine aria-label={`Cambio vs ${referenceLabel}`}>
            <ChangeIcon trend={current > 0 ? 'up' : 'down'}>
              <FontAwesomeIcon icon={faStar} />
            </ChangeIcon>
            <SimpleTypography
              as="span"
              size="medium"
              weight="medium"
              color={current > 0 ? 'success' : 'danger'}
            >
              {current > 0 ? 'Nuevo' : 'Pérdida Nueva'}
            </SimpleTypography>
          </ChangeLine>
        </Tooltip>
      );
    }

    if (isSignChange) {
      const tooltip = `Cambio: ${deltaAmount}`;
      return (
        <Tooltip title={tooltip}>
          <ChangeLine aria-label={`Cambio vs ${referenceLabel}`}>
            <SimpleTypography
              as="span"
              size="small"
              weight="medium"
              color="secondary"
            >
              {`De ${formatCurrency(previous)} a ${formatCurrency(current)}`}
            </SimpleTypography>
          </ChangeLine>
        </Tooltip>
      );
    }

    const absolutePercentage = percentage !== null ? Math.abs(percentage) : 0;
    const showMultiplier = absolutePercentage >= 100;

    const trendIcon =
      trend === 'up'
        ? faArrowTrendUp
        : trend === 'down'
          ? faArrowTrendDown
          : faChartLine;
    const trendColor =
      trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'secondary';

    if (showMultiplier) {
      const ratio = previous !== 0 ? current / previous : 0;
      const tooltip = `${percentageChange} vs. ${referenceLabel} (${deltaAmount})`;
      return (
        <Tooltip title={tooltip}>
          <ChangeLine aria-label={`Cambio vs ${referenceLabel}`}>
            <ChangeIcon trend={trend}>
              <FontAwesomeIcon icon={trendIcon} />
            </ChangeIcon>
            <SimpleTypography
              as="span"
              size="medium"
              weight="medium"
              color={trendColor}
            >
              {formatMultiplier(ratio)}
            </SimpleTypography>
          </ChangeLine>
        </Tooltip>
      );
    }

    // Default percentage view
    const tooltip = `Cambio en ganancia neta = ((valor actual - ${referenceLabel}) / ${referenceLabel}) × 100`;
    return (
      <Tooltip title={tooltip}>
        <ChangeLine aria-label={`Cambio vs ${referenceLabel}`}>
          <ChangeIcon trend={trend}>
            <FontAwesomeIcon icon={trendIcon} />
          </ChangeIcon>
          <SimpleTypography
            as="span"
            size="medium"
            weight="medium"
            color={trendColor}
          >
            {percentageChange}
          </SimpleTypography>
          {deltaAmount && (
            <SimpleTypography as="span" size="small" color="secondary">
              {`(${deltaAmount})`}
            </SimpleTypography>
          )}
        </ChangeLine>
      </Tooltip>
    );
  };

  return (
    <ComparisonCard
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 210, damping: 20 }}
    >
      <CardHeader role="heading" aria-level="3">
        <HeaderInfo>
          <SimpleTypography as="span" size="medium" weight="bold">
            {cardTitle}
          </SimpleTypography>
        </HeaderInfo>
      </CardHeader>

      {loading ? (
        <LoadingState aria-label="Cargando comparación">
          <LoadingBar />
          <LoadingBar $width="70%" $height="12px" />
          <LoadingBar $width="55%" $height="10px" />
        </LoadingState>
      ) : (
        <MetricsSection>
          <ValueHighlight>
            <SimpleTypography
              as="span"
              size="large"
              weight="bold"
              color={(current ?? 0) >= 0 ? 'success' : 'danger'}
            >
              {formattedCurrent}
            </SimpleTypography>
          </ValueHighlight>

          {renderChangeContent()}

          {formattedPrevious && (
            <SimpleTypography as="span" size="small" color="secondary">
              {previousLabel}: {formattedPrevious}
            </SimpleTypography>
          )}
        </MetricsSection>
      )}
    </ComparisonCard>
  );
};

const ComparisonCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
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
  gap: ${spacing.md};
  align-items: flex-start;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing.xs};
  min-width: 0;
`;

const MetricsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const ValueHighlight = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const ChangeLine = styled.div`
  display: inline-flex;
  gap: ${spacing.xs};
  align-items: center;
  cursor: ${({ title }: TitleProps) => (title ? 'help' : 'default')};
`;

const ChangeIcon = styled.span<{ trend: UtilityTrend }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${({ trend }: TrendIconProps) => getTrendVariant(trend).color};
  background: ${({ trend }: TrendIconProps) => getTrendVariant(trend).surface};
  border: 1px solid ${({ trend }: TrendIconProps) =>
    getTrendVariant(trend).border};
  border-radius: ${radii.pill};
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
  width: ${({ $width }: LoadingBarProps) => $width || '100%'};
  height: ${({ $height }: LoadingBarProps) => $height || '14px'};
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
