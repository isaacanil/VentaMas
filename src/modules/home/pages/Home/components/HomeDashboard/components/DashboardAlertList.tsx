import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import type { HomeDashboardAlert, HomeDashboardTone } from '../types';

import type { JSX } from 'react';

interface DashboardAlertListProps {
  alerts: HomeDashboardAlert[];
}

export const DashboardAlertList = ({
  alerts,
}: DashboardAlertListProps): JSX.Element => (
  <Panel>
    <PanelHeader>
      <div>
        <Eyebrow>Alertas</Eyebrow>
        <PanelTitle>Riesgos operativos</PanelTitle>
      </div>
    </PanelHeader>
    <AlertStack>
      {alerts.map((alert) => {
        const content = (
          <>
            <AlertIcon $tone={alert.tone}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </AlertBody>
            {alert.meta && <AlertMeta>{alert.meta}</AlertMeta>}
            {alert.route && <FontAwesomeIcon icon={faArrowRight} />}
          </>
        );

        if (alert.route) {
          return (
            <AlertLink key={alert.id} to={alert.route} $tone={alert.tone}>
              {content}
            </AlertLink>
          );
        }

        return (
          <AlertItem key={alert.id} $tone={alert.tone}>
            {content}
          </AlertItem>
        );
      })}
    </AlertStack>
  </Panel>
);

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

const AlertStack = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const alertBase = css<{ $tone: HomeDashboardTone }>`
  ${(props) => toneStyles[props.$tone]}

  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
  padding: var(--ds-space-3);
  color: var(--ds-color-text-primary);
  text-decoration: none;
  background: var(--tone-bg);
  border: 1px solid color-mix(in srgb, var(--tone-border) 48%, transparent);
  border-radius: var(--ds-radius-md);

  @media (width <= 560px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

const AlertLink = styled(Link)<{ $tone: HomeDashboardTone }>`
  ${alertBase}

  &:hover {
    color: var(--ds-color-text-primary);
    border-color: var(--tone-border);
  }
`;

const AlertItem = styled.div<{ $tone: HomeDashboardTone }>`
  ${alertBase}
`;

const AlertIcon = styled.span<{ $tone: HomeDashboardTone }>`
  ${(props) => toneStyles[props.$tone]}

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--tone-text);
  background: var(--ds-color-bg-surface);
  border-radius: var(--ds-radius-md);
`;

const AlertBody = styled.div`
  min-width: 0;
`;

const AlertTitle = styled.strong`
  display: block;
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AlertDescription = styled.span`
  display: block;
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const AlertMeta = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  white-space: nowrap;

  @media (width <= 560px) {
    grid-column: 2;
    justify-self: start;
  }
`;
