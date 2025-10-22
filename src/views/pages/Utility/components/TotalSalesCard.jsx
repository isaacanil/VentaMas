import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendDown, faArrowTrendUp, faDollarSign } from '@fortawesome/free-solid-svg-icons';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { designSystemV2 } from '../../../../theme/designSystemV2';

const { colors, spacing, radii, shadows } = designSystemV2;

const TREND_VARIANTS = {
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

const getTrendVariant = (trend) => TREND_VARIANTS[trend] ?? TREND_VARIANTS.flat;

export const TotalSalesCard = ({
    loading,
    comparison,
    formatCurrency,
    formatPercentage,
}) => {
    const hasComparison = Boolean(comparison);
    const trend = hasComparison ? comparison.trend : 'flat';

    const trendIcon =
        trend === 'up' ? faArrowTrendUp : trend === 'down' ? faArrowTrendDown : faDollarSign;

    const title = 'Ventas totales';
    const previousLabel = hasComparison ? comparison.previousLabel : 'Período anterior';
    const referenceLabel = previousLabel.toLowerCase();
    const formattedCurrent = hasComparison ? formatCurrency(comparison.current) : '—';
    const formattedPrevious =
        hasComparison && comparison.previous !== null ? formatCurrency(comparison.previous) : null;
    const percentageChange =
        hasComparison && comparison.percentage !== null
            ? formatPercentage(comparison.percentage)
            : null;
    const deltaValue = hasComparison && typeof comparison.delta === 'number' ? comparison.delta : null;

    const formatDeltaAmount = (value) => {
        if (value === null) {
            return null;
        }
        const absolute = Math.abs(value);
        const formatted = formatCurrency(absolute);
        if (value > 0) {
            return `+${formatted}`;
        }
        if (value < 0) {
            return `-${formatted}`;
        }
        return formatted;
    };

    const deltaAmount = deltaValue !== null ? formatDeltaAmount(deltaValue) : null;

    const hasChangeData = Boolean(percentageChange || deltaAmount);

    const changeTooltip = hasComparison
        ? `Cambio en ventas = ((ventas actuales - ${referenceLabel}) / ${referenceLabel}) × 100`
        : undefined;

    return (
        <ComparisonCard
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
        >
            <CardHeader role="heading" aria-level="3">
                <HeaderInfo>
                    <SimpleTypography as="span" size="medium" weight="bold">
                        {title}
                    </SimpleTypography>
                </HeaderInfo>
            </CardHeader>

            {loading ? (
                <LoadingState aria-label="Cargando total de ventas">
                    <LoadingBar />
                    <LoadingBar $width="70%" $height="12px" />
                    <LoadingBar $width="55%" $height="10px" />
                </LoadingState>
            ) : (
                <MetricsSection>
                    <ValueHighlight>
                        <SimpleTypography as="span" size="large" weight="bold" color="info">
                            {formattedCurrent}
                        </SimpleTypography>
                    </ValueHighlight>

                    {hasComparison && (
                        <ChangeLine
                            trend={trend}
                            title={changeTooltip}
                            aria-label={`Cambio vs ${referenceLabel}`}
                        >
                            <ChangeIcon trend={trend}>
                                <FontAwesomeIcon icon={trendIcon} />
                            </ChangeIcon>
                            {hasChangeData ? (
                                <>
                                    {percentageChange && (
                                        <SimpleTypography
                                            as="span"
                                            size="medium"
                                            weight="medium"
                                            color={
                                                trend === 'up'
                                                    ? 'success'
                                                    : trend === 'down'
                                                    ? 'danger'
                                                    : 'secondary'
                                            }
                                        >
                                            {percentageChange}
                                        </SimpleTypography>
                                    )}
                                    {deltaAmount && (
                                        <SimpleTypography as="span" size="small" color="secondary">
                                            {percentageChange ? `(${deltaAmount})` : deltaAmount}
                                        </SimpleTypography>
                                    )}
                                </>
                            ) : (
                                <SimpleTypography as="span" size="small" color="secondary">
                                    Sin datos de comparación
                                </SimpleTypography>
                            )}
                        </ChangeLine>
                    )}

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
    padding: ${spacing.lg};
    border-radius: ${radii.lg};
    background: ${colors.background.surface};
    border: 1px solid ${colors.stroke.subtle};
    box-shadow: ${shadows.md};
    width: 100%;
    max-width: 360px;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    gap: ${spacing.md};
`;

const HeaderInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xs};
    flex: 1;
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
    align-items: center;
    gap: ${spacing.xs};
    cursor: ${({ title }) => (title ? 'help' : 'default')};
`;

const ChangeIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: ${radii.pill};
    background: ${({ trend }) => getTrendVariant(trend).surface};
    color: ${({ trend }) => getTrendVariant(trend).color};
    border: 1px solid ${({ trend }) => getTrendVariant(trend).border};
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

const LoadingBar = styled.span`
    display: block;
    width: ${({ $width }) => $width || '100%'};
    height: ${({ $height }) => $height || '14px'};
    border-radius: ${radii.pill};
    background: linear-gradient(
        90deg,
        ${colors.skeleton.base} 0%,
        ${colors.skeleton.highlight} 50%,
        ${colors.skeleton.base} 100%
    );
    background-size: 200% 100%;
    animation: ${loadingShimmer} 1.4s ease-in-out infinite;
`;
