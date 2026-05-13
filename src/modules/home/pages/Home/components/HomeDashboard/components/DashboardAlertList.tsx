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
}: DashboardAlertListProps): JSX.Element => {
  if (!alerts.length) return <></>;

  return (
    <AlertBand aria-label="Alertas operativas">
      <BandLabel>Atenciones</BandLabel>
      <AlertStack>
        {alerts.map((alert) => {
          const content = (
            <>
              <AlertIcon $tone={alert.tone}>
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </AlertIcon>
              <AlertBody>
                <AlertTitle>{alert.title}</AlertTitle>
                {alert.meta && <AlertMeta>{alert.meta}</AlertMeta>}
              </AlertBody>
              {alert.route && (
                <AlertAction>
                  Abrir <FontAwesomeIcon icon={faArrowRight} />
                </AlertAction>
              )}
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
    </AlertBand>
  );
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

const AlertBand = styled.section`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);

  @media (width <= 720px) {
    grid-template-columns: 1fr;
  }
`;

const BandLabel = styled.span`
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding-inline: var(--ds-space-2);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text-muted);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const AlertStack = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ds-space-2);
  min-width: 0;
`;

const alertBase = css<{ $tone: HomeDashboardTone }>`
  ${(props) => toneStyles[props.$tone]}

  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;
  min-height: 44px;
  padding: var(--ds-space-2) var(--ds-space-3);
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
  width: 28px;
  height: 28px;
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

const AlertMeta = styled.span`
  display: block;
  margin-top: 1px;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--tone-text);
  white-space: nowrap;
`;

const AlertAction = styled.span`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
  white-space: nowrap;
`;
