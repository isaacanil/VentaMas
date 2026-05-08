import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import type { HomeDashboardActivity, HomeDashboardTone } from '../types';

import type { JSX } from 'react';

interface HomeActivityFeedProps {
  activities: HomeDashboardActivity[];
}

export const HomeActivityFeed = ({
  activities,
}: HomeActivityFeedProps): JSX.Element => (
  <Panel>
    <PanelHeader>
      <div>
        <Eyebrow>Actividad</Eyebrow>
        <PanelTitle>Movimiento reciente</PanelTitle>
      </div>
    </PanelHeader>
    <ActivityStack>
      {activities.length ? (
        activities.map((activity) => {
          const content = (
            <>
              <ActivityDot $tone={activity.tone ?? 'neutral'} />
              <ActivityBody>
                <ActivityTitle>{activity.title}</ActivityTitle>
                <ActivityDescription>{activity.description}</ActivityDescription>
              </ActivityBody>
              <ActivityAside>
                {activity.amount && <ActivityAmount>{activity.amount}</ActivityAmount>}
                {activity.timestampLabel && (
                  <ActivityTime>{activity.timestampLabel}</ActivityTime>
                )}
              </ActivityAside>
            </>
          );

          if (activity.route) {
            return (
              <ActivityLink key={activity.id} to={activity.route}>
                {content}
              </ActivityLink>
            );
          }

          return <ActivityItem key={activity.id}>{content}</ActivityItem>;
        })
      ) : (
        <EmptyState>Sin actividad reciente para este mes.</EmptyState>
      )}
    </ActivityStack>
  </Panel>
);

const toneStyles = {
  neutral: css`
    --tone-dot: var(--ds-color-border-strong);
  `,
  info: css`
    --tone-dot: var(--ds-color-state-info);
  `,
  success: css`
    --tone-dot: var(--ds-color-state-success);
  `,
  warning: css`
    --tone-dot: var(--ds-color-state-warning);
  `,
  danger: css`
    --tone-dot: var(--ds-color-state-danger);
  `,
} satisfies Record<HomeDashboardTone, ReturnType<typeof css>>;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-width: 0;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const Eyebrow = styled.span`
  display: block;
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const ActivityStack = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const activityBase = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
  padding: var(--ds-space-3) 0;
  color: var(--ds-color-text-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  @media (width <= 560px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

const ActivityLink = styled(Link)`
  ${activityBase}

  &:hover {
    color: var(--ds-color-action-primary);
  }
`;

const ActivityItem = styled.div`
  ${activityBase}
`;

const ActivityDot = styled.span<{ $tone: HomeDashboardTone }>`
  ${(props) => toneStyles[props.$tone]}

  width: 10px;
  height: 10px;
  background: var(--tone-dot);
  border-radius: var(--ds-radius-pill);
`;

const ActivityBody = styled.div`
  min-width: 0;
`;

const ActivityTitle = styled.strong`
  display: block;
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActivityDescription = styled.span`
  display: block;
  overflow: hidden;
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActivityAside = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  justify-items: end;

  @media (width <= 560px) {
    grid-column: 2;
    justify-items: start;
  }
`;

const ActivityAmount = styled.strong`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
`;

const ActivityTime = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
`;

const EmptyState = styled.div`
  padding: var(--ds-space-5);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  text-align: center;
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
`;
