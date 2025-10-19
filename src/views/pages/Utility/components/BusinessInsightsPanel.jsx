import React, { useMemo } from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { designSystemV2 } from '../../../../theme/designSystemV2';
import { EmptyState } from './EmptyState';

const { colors, shadows, radii, spacing } = designSystemV2;

const formatPercent = (value) => {
    if (!Number.isFinite(value)) return '0%';
    const rounded = Math.round(value * 10) / 10;
    const formatted = rounded.toFixed(1);
    return `${formatted}%`;
};

const VARIANT_STYLES = {
    success: {
        accent: colors.states.success,
        surface: 'rgba(34, 197, 94, 0.08)',
        badge: {
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#15803d',
        },
    },
    warning: {
        accent: '#f59e0b',
        surface: 'rgba(250, 204, 21, 0.08)',
        badge: {
            background: 'rgba(251, 191, 36, 0.18)',
            color: '#92400e',
        },
    },
    critical: {
        accent: '#ef4444',
        surface: 'rgba(248, 113, 113, 0.10)',
        badge: {
            background: 'rgba(248, 113, 113, 0.20)',
            color: '#b91c1c',
        },
    },
    info: {
        accent: colors.states.info,
        surface: 'rgba(2, 132, 199, 0.10)',
        badge: {
            background: 'rgba(2, 132, 199, 0.18)',
            color: '#075985',
        },
    },
    default: {
        accent: '#4f46e5',
        surface: 'rgba(99, 102, 241, 0.10)',
        badge: {
            background: 'rgba(99, 102, 241, 0.18)',
            color: '#4338ca',
        },
    },
};

const getVariantStyles = (type) => VARIANT_STYLES[type] ?? VARIANT_STYLES.default;

export const BusinessInsightsPanel = ({
    summary,
    dailyMetrics,
    formatCurrency,
}) => {
    const insights = useMemo(() => {
        const source = Array.isArray(dailyMetrics) ? dailyMetrics : [];
        const totalSales = summary?.totalSales ?? 0;
        const netProfit = summary?.netProfit ?? 0;
        const totalExpenses = summary?.totalExpenses ?? 0;
        const totalTaxes = summary?.totalTaxes ?? 0;

        if (totalSales <= 0 && source.length === 0) {
            return [];
        }

        const netMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : null;
        const expenseRatio = totalSales > 0 ? (totalExpenses / totalSales) * 100 : null;
        const taxRatio = totalSales > 0 ? (totalTaxes / totalSales) * 100 : null;

        const negativeDays = source.filter((day) => (day?.netProfit ?? 0) < 0);
        const bestDay = source.reduce(
            (acc, day) => ((day?.netProfit ?? -Infinity) > (acc?.netProfit ?? -Infinity) ? day : acc),
            null
        );

        const result = [];

        if (Number.isFinite(netMargin)) {
            if (netMargin < 0) {
                result.push({
                    type: 'critical',
                    title: 'Margen neto negativo',
                    description: 'La rentabilidad está por debajo de cero; revisa precios o gastos.',
                    value: formatPercent(netMargin),
                    action: 'Revisa precios, descuentos y costos operativos.',
                });
            } else if (netMargin < 12) {
                result.push({
                    type: 'warning',
                    title: 'Margen neto bajo',
                    description:
                        'El margen neto está por debajo del 12%. Considera optimizar precios o reducir costos.',
                    value: formatPercent(netMargin),
                    action: 'Detecta productos con margen reducido y ajusta precios o proveedores.',
                });
            } else {
                result.push({
                    type: 'success',
                    title: 'Margen saludable',
                    description: 'Buen desempeño en rentabilidad neta durante el período.',
                    value: formatPercent(netMargin),
                    action: 'Mantén la combinación de productos, precios y promociones actuales.',
                });
            }
        }

        if (Number.isFinite(expenseRatio)) {
            if (expenseRatio >= 35) {
                result.push({
                    type: 'warning',
                    title: 'Gastos operativos altos',
                    description:
                        'Los gastos superan el 35% de las ventas. Revisa consumos y contratos.',
                    value: formatPercent(expenseRatio),
                    action: 'Audita gastos de servicios, nómina y proveedores recurrentes.',
                });
            } else {
                result.push({
                    type: 'success',
                    title: 'Gastos controlados',
                    description: 'Los gastos operativos permanecen dentro de un rango saludable.',
                    value: formatPercent(expenseRatio),
                    action: 'Continúa monitoreando para detectar incrementos atípicos.',
                });
            }
        }

        if (Number.isFinite(taxRatio) && taxRatio >= 18) {
            result.push({
                type: 'info',
                title: 'Carga impositiva destacada',
                description: 'Considera si puedes aprovechar créditos fiscales o revisar la facturación.',
                value: formatPercent(taxRatio),
                action: 'Revisa exenciones, devoluciones o créditos fiscales pendientes.',
            });
        }

        if (negativeDays.length) {
            result.push({
                type: 'critical',
                title: `${negativeDays.length} ${negativeDays.length === 1 ? 'día' : 'días'} con pérdida`,
                description:
                    'Analiza qué factores provocaron pérdidas puntuales y aplica correcciones.',
                value: negativeDays
                    .slice(0, 3)
                    .map((day) => day.dateLabel)
                    .join(', '),
                action: 'Revisa inventario, descuentos o gastos extraordinarios para esas fechas.',
            });
        }

        if (bestDay && (bestDay.netProfit ?? 0) > 0) {
            result.push({
                type: 'success',
                title: 'Mejor día del período',
                description: `El ${bestDay.dateLabel} generó la mayor ganancia neta.`,
                value: formatCurrency(bestDay.netProfit),
                action: 'Replica la estrategia comercial (promociones, horarios, productos) de ese día.',
            });
        }

        return result;
    }, [summary, dailyMetrics, formatCurrency]);

    if (!insights.length) {
        return <EmptyState>No hay insights generados para este rango de fechas.</EmptyState>;
    }

    return (
        <InsightsGrid>
            {insights.map((insight, index) => {
                const variant = getVariantStyles(insight.type);
                return (
                    <InsightCard key={insight.title + index} $variant={variant}>
                        <AccentStrip $variant={variant} />
                        <CardContent $variant={variant}>
                            <CardHeader>
                                <Badge $variant={variant}>{insight.title}</Badge>
                                <Value $variant={variant}>
                                    <SimpleTypography as="span" size="large" weight="bold">
                                        {insight.value}
                                    </SimpleTypography>
                                </Value>
                            </CardHeader>
                            <SimpleTypography as="p" size="small" color="secondary">
                                {insight.description}
                            </SimpleTypography>
                            {insight.action && (
                                <ActionHint>
                                    <HintLabel>Sugerencia</HintLabel>
                                    <SimpleTypography as="span" size="small">
                                        {insight.action}
                                    </SimpleTypography>
                                </ActionHint>
                            )}
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

const ActionHint = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: auto;
    padding-top: ${spacing.sm};
    border-top: 1px dashed rgba(148, 163, 184, 0.35);
`;

const HintLabel = styled.span`
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${colors.text.secondary};
`;
