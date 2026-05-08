import { Link } from 'react-router-dom';
import { Skeleton } from 'antd';
import styled, { css } from 'styled-components';

import type { HomeDashboardMetric, HomeDashboardTone } from '../types';

import type { JSX } from 'react';

interface DashboardKpiCardProps {
  metric: HomeDashboardMetric;
}

export const DashboardKpiCard = ({
  metric,
}: DashboardKpiCardProps): JSX.Element => {
  const content = (
    <>
      <CardHeader>
        <IconWrap $tone={metric.tone}>{metric.icon}</IconWrap>
        {metric.supportingValue && (
          <SupportText>{metric.supportingValue}</SupportText>
        )}
      </CardHeader>
      <MetricLabel>{metric.label}</MetricLabel>
      {metric.loading ? (
        <Skeleton active paragraph={false} title={{ width: '70%' }} />
      ) : (
        <MetricValue>{metric.value}</MetricValue>
      )}
      <MetricDetail>{metric.detail}</MetricDetail>
    </>
  );

  if (metric.route) {
    return (
      <InteractiveCard to={metric.route} $tone={metric.tone}>
        {content}
      </InteractiveCard>
    );
  }

  return <StaticCard $tone={metric.tone}>{content}</StaticCard>;
};

const toneStyles = {
  neutral: css`
    --tone-bg: var(--ds-color-bg-subtle);
    --tone-text: var(--ds-color-text-secondary);
    --tone-border: var(--ds-color-border-default);
  `,
  info: css`
    --tone-bg: var(--ds-color-state-info-subtle);
    --tone-text: var(--ds-color-state-info-text);
    --tone-border: var(--ds-color-state-info);
  `,
  success: css`
    --tone-bg: var(--ds-color-state-success-subtle);
    --tone-text: var(--ds-color-state-success-text);
    --tone-border: var(--ds-color-state-success);
  `,
  warning: css`
    --tone-bg: var(--ds-color-state-warning-subtle);
    --tone-text: var(--ds-color-state-warning-text);
    --tone-border: var(--ds-color-state-warning);
  `,
  danger: css`
    --tone-bg: var(--ds-color-state-danger-subtle);
    --tone-text: var(--ds-color-state-danger-text);
    --tone-border: var(--ds-color-state-danger);
  `,
} satisfies Record<HomeDashboardTone, ReturnType<typeof css>>;

const cardBase = css<{ $tone: HomeDashboardTone }>`
  ${(props) => toneStyles[props.$tone]}

  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  min-width: 0;
  min-height: 166px;
  padding: var(--ds-space-5);
  color: var(--ds-color-text-primary);
  text-decoration: none;
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const InteractiveCard = styled(Link)<{ $tone: HomeDashboardTone }>`
  ${cardBase}

  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;

  &:hover {
    color: var(--ds-color-text-primary);
    border-color: var(--tone-border);
    box-shadow: var(--ds-shadow-md);
    transform: translateY(-1px);
  }
`;

const StaticCard = styled.div<{ $tone: HomeDashboardTone }>`
  ${cardBase}
`;

const CardHeader = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
`;

const IconWrap = styled.span<{ $tone: HomeDashboardTone }>`
  ${(props) => toneStyles[props.$tone]}

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--tone-text);
  background: var(--tone-bg);
  border: 1px solid var(--tone-border);
  border-radius: var(--ds-radius-md);
`;

const SupportText = styled.span`
  overflow: hidden;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MetricLabel = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
`;

const MetricValue = styled.strong`
  overflow-wrap: anywhere;
  font-size: clamp(1.35rem, 1.1rem + 0.5vw, 1.9rem);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const MetricDetail = styled.span`
  min-height: 36px;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-muted);
`;
