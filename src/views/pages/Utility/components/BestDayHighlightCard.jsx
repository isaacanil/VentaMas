import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faTriangleExclamation,
    faCircleExclamation,
    faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { designSystemV2 } from '../../../../theme/designSystemV2';
import { buildBusinessInsights } from '../utils/buildBusinessInsights';
import { getVariantStyles } from '../utils/insightVariants';

const { colors, spacing, radii, shadows } = designSystemV2;

const TYPE_ICONS = {
    success: faArrowTrendUp,
    warning: faTriangleExclamation,
    critical: faCircleExclamation,
    info: faCircleInfo,
    default: faCircleInfo,
};

export const BestDayHighlightCard = ({
    summary,
    dailyMetrics,
    formatCurrency,
    loading,
}) => {
    const insights = useMemo(
        () =>
            buildBusinessInsights({
                summary,
                dailyMetrics,
                formatCurrency,
            }),
        [summary, dailyMetrics, formatCurrency]
    );

    const bestDayInsight = useMemo(
        () => insights.find((insight) => insight.key === 'bestDay'),
        [insights]
    );

    const variant = getVariantStyles(bestDayInsight?.type ?? 'default');
    const icon = TYPE_ICONS[bestDayInsight?.type] ?? TYPE_ICONS.default;
    const meta = bestDayInsight?.meta ?? {};

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
                    <Tooltip
                        title={bestDayInsight.measurement}
                        placement="topRight"
                    >
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
                    {meta.dateLabel && (
                        <DatePill>{meta.dateLabel}</DatePill>
                    )}

                    {(formattedSales || formattedExpenses) && (
                        <MetaRow>
                         {bestDayInsight?.value && (
                                <MetaItem>
                                    <MetaLabel>Ganancia</MetaLabel>
                                    <MetaValue>
                                        {
                                            bestDayInsight.value
                                        }
                                    </MetaValue>
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

const Card = styled(motion.div)`
    display: flex;
    flex-direction: column;
    gap: ${spacing.md};
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
    align-items: center;
    justify-content: space-between;
    gap: ${spacing.sm};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacing.sm};
`;

const DatePill = styled.span`
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: ${radii.pill};
    background: ${colors.layers.neutralSoft};
    color: ${colors.text.secondary};
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
`;

const Highlight = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacing.sm};
`;

const Indicator = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: ${radii.pill};
    background: ${({ $variant }) => $variant.surface};
    color: ${({ $variant }) => $variant.accent};
    border: 1px solid ${({ $variant }) => $variant.accent}33;
`;

const EmptyHint = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 90px;
`;

const MetaRow = styled.div`
    display: flex;
    gap: ${spacing.md};
    flex-wrap: wrap;
`;

const MetaItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
`;

const MetaLabel = styled.span`
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${colors.text.secondary};
    font-weight: 600;
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
    border-radius: 50%;
    background: rgba(148, 163, 184, 0.18);
    color: ${colors.text.secondary};
    cursor: help;

    svg {
        font-size: 0.95rem;
    }

    &:hover {
        color: ${colors.brand.primary};
        background: rgba(59, 130, 246, 0.15);
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
