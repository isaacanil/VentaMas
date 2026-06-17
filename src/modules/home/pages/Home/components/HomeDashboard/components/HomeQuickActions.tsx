import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  useDeveloperFeaturesData,
  useMenuCardData,
} from '@/modules/home/pages/Home/CardData';
import { normalizeFeatureCardData } from '@/modules/home/utils/homeShortcutUtils';

import type { FeatureCardData } from '@/modules/home/types/featureCard';
import type { JSX } from 'react';

interface HomeQuickActionsProps {
  includeDeveloperFeatures?: boolean;
}

const PRIORITY_TITLES = [
  'Venta',
  'Facturas',
  'Productos',
  'Cuentas por Cobrar',
  'Cuentas por Pagar',
  'Cuadre de Caja',
  'Cumplimiento Fiscal',
  'Gastos',
];

export const HomeQuickActions = ({
  includeDeveloperFeatures = false,
}: HomeQuickActionsProps): JSX.Element => {
  const user = useSelector(selectUser);
  const menuItems = normalizeFeatureCardData(useMenuCardData(user));
  const developerItems = normalizeFeatureCardData(useDeveloperFeaturesData());
  const actions = useMemo(() => {
    const routeItems = menuItems.filter(
      (item) => typeof item.route === 'string',
    );
    const picked = PRIORITY_TITLES.map((title) =>
      routeItems.find((item) => item.title === title),
    ).filter(Boolean) as FeatureCardData[];
    const pickedIds = new Set(picked.map((item) => item.title));
    const fallback = routeItems
      .filter((item) => !pickedIds.has(item.title))
      .slice(0, Math.max(0, 8 - picked.length));
    const baseActions = [...picked, ...fallback].slice(0, 8);

    if (!includeDeveloperFeatures) return baseActions;
    return [
      ...baseActions,
      ...developerItems
        .filter((item) => typeof item.route === 'string')
        .slice(0, 2),
    ].slice(0, 10);
  }, [developerItems, includeDeveloperFeatures, menuItems]);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <Eyebrow>Acciones</Eyebrow>
          <PanelTitle>Atajos rápidos</PanelTitle>
        </div>
      </PanelHeader>
      <ActionGrid>
        {actions.map((action) => (
          <ActionLink
            key={`${action.title}-${action.route}`}
            to={action.route ?? '#'}
          >
            <ActionIcon>{action.icon}</ActionIcon>
            <ActionText>
              <ActionTitle>{action.title}</ActionTitle>
              <ActionCategory>{action.category}</ActionCategory>
            </ActionText>
          </ActionLink>
        ))}
      </ActionGrid>
    </Panel>
  );
};

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

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

const ActionLink = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
  min-height: 64px;
  padding: var(--ds-space-3);
  color: var(--ds-color-text-primary);
  text-decoration: none;
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);
  transition:
    border-color 0.16s ease,
    background 0.16s ease;

  &:hover {
    color: var(--ds-color-action-primary);
    background: var(--ds-color-bg-surface);
    border-color: var(--ds-color-action-primary);
  }
`;

const ActionIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--ds-color-action-primary);
  background: var(--ds-color-action-primary-subtle);
  border-radius: var(--ds-radius-md);
`;

const ActionText = styled.span`
  min-width: 0;
`;

const ActionTitle = styled.strong`
  display: block;
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionCategory = styled.span`
  display: block;
  overflow: hidden;
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
`;
