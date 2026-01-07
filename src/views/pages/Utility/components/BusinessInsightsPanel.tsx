// @ts-nocheck
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { designSystemV2 } from '@/theme/designSystemV2';
import { buildBusinessInsights } from '@/views/pages/Utility/utils/buildBusinessInsights';
import { getVariantStyles } from '@/views/pages/Utility/utils/insightVariants';
import { SimpleTypography } from '@/views/templates/system/Typografy/SimpleTypography';

import { EmptyState } from './EmptyState';

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
    [summary, dailyMetrics, formatCurrency],
  );

  if (!insights.length) {
    return (
      <EmptyState>
        No hay insights generados para este rango de fechas.
      </EmptyState>
    );
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
                    <Tooltip title={insight.measurement} placement="topRight">
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${spacing.md};
`;

const InsightCard = styled.article`
  position: relative;
  display: grid;
  grid-template-columns: 6px 1fr;
  min-height: 150px;
  background: ${colors.background.surface};
  border: 1px solid rgb(148 163 184 / 25%);
  border-radius: ${radii.md};
  box-shadow: ${shadows.sm};
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
  gap: ${spacing.sm};
  align-items: flex-start;
  justify-content: space-between;
`;

const HeaderMeta = styled.div`
  display: flex;
  gap: ${spacing.xs};
  align-items: center;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $variant }) => $variant.badge.color};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ $variant }) => $variant.badge.background};
  border-radius: ${radii.pill};
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
