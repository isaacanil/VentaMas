import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { designSystemV2 } from '../../../../theme/designSystemV2';
import { EmptyState } from './EmptyState';
import { buildBusinessInsights } from '../utils/buildBusinessInsights';
import { getVariantStyles } from '../utils/insightVariants';

const { colors, shadows, radii, spacing } = designSystemV2;

export const BusinessInsightsPanel = ({
    summary,
    dailyMetrics,
    formatCurrency,
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

    if (!insights.length) {
        return <EmptyState>No hay insights generados para este rango de fechas.</EmptyState>;
    }

    return (
        <InsightsGrid>
            {insights.map((insight, index) => {
                const variant = getVariantStyles(insight.type);
                return (
                    <InsightCard
                        key={insight.key ?? `${insight.title}-${index}`}
                        $variant={variant}
                    >
                        <AccentStrip $variant={variant} />
                        <CardContent $variant={variant}>
                            <CardHeader>
                                <Badge $variant={variant}>{insight.title}</Badge>
                                <HeaderMeta>
                                    {insight.measurement && (
                                        <Tooltip
                                            title={insight.measurement}
                                            placement="topRight"
                                        >
                                            <MeasurementIcon
                                                role="img"
                                                aria-label={`Método de medición: ${insight.measurement}`}
                                            >
                                                <FontAwesomeIcon icon={faCircleInfo} />
                                            </MeasurementIcon>
                                        </Tooltip>
                                    )}
                                    <Value $variant={variant}>
                                        <SimpleTypography as="span" size="large" weight="bold">
                                            {insight.value}
                                        </SimpleTypography>
                                    </Value>
                                </HeaderMeta>
                            </CardHeader>
                            <SimpleTypography as="p" size="small" color="secondary">
                                {insight.description}
                            </SimpleTypography>
                        </CardContent>
                    </InsightCard>
                );
            })}
        </InsightsGrid>
    );
};

const InsightsGrid = styled.div`
    display: grid;
    gap: ${spacing.md};
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const InsightCard = styled.article`
    position: relative;
    display: grid;
    grid-template-columns: 6px 1fr;
    background: ${colors.background.surface};
    border-radius: ${radii.md};
    box-shadow: ${shadows.sm};
    border: 1px solid rgba(148, 163, 184, 0.25);
    min-height: 150px;
`;

const AccentStrip = styled.span`
    display: block;
    background: ${({ $variant }) => $variant.accent};
    border-top-left-radius: ${radii.md};
    border-bottom-left-radius: ${radii.md};
`;

const CardContent = styled.div`
    display: grid;
    gap: ${spacing.sm};
    padding: ${spacing.md} ${spacing.lg};
    background: ${({ $variant }) => $variant?.surface ?? 'transparent'};
    border-top-right-radius: ${radii.md};
    border-bottom-right-radius: ${radii.md};
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${spacing.sm};
`;

const HeaderMeta = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacing.xs};
`;

const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.75rem;
    border-radius: ${radii.pill};
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: ${({ $variant }) => $variant.badge.background};
    color: ${({ $variant }) => $variant.badge.color};
`;

const Value = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: ${({ $variant }) => $variant?.accent ?? colors.text.primary};
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
