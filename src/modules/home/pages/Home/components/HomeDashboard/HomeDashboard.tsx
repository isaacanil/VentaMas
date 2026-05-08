import { lazy, Suspense } from 'react';
import { Button, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCashRegister,
  faChartLine,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '@/router/routes/routesName';

import { DashboardAlertList } from './components/DashboardAlertList';
import { DashboardKpiCard } from './components/DashboardKpiCard';
import { HomeActivityFeed } from './components/HomeActivityFeed';
import { HomeQuickActions } from './components/HomeQuickActions';
import { HomeTrendPanel } from './components/HomeTrendPanel';
import { useHomeDashboardData } from './hooks/useHomeDashboardData';

import type { JSX } from 'react';

const DashboardShortcuts = lazy(() =>
  import('../DashboardShortcuts/DashboardShortcuts').then((module) => ({
    default: module.DashboardShortcuts,
  })),
);

export interface HomeDashboardProps {
  businessName?: string | null;
  displayName?: string | null;
  includeDeveloperFeatures?: boolean;
}

const HOME_DASHBOARD_WIDGETS = [
  { id: 'kpis', label: 'Indicadores', enabled: true },
  { id: 'alerts', label: 'Alertas', enabled: true },
  { id: 'activity', label: 'Actividad', enabled: true },
  { id: 'quick-actions', label: 'Acciones rapidas', enabled: true },
  { id: 'trend', label: 'Tendencia', enabled: true },
] as const;

export const HomeDashboard = ({
  businessName,
  displayName,
  includeDeveloperFeatures = false,
}: HomeDashboardProps): JSX.Element => {
  const dashboard = useHomeDashboardData();
  const activeWidgets = HOME_DASHBOARD_WIDGETS.filter((widget) => widget.enabled);
  const headerTitle = businessName
    ? `Panel de ${businessName}`
    : 'Panel operativo';
  const operatorLabel = displayName ? `Operador: ${displayName}` : 'Sesion activa';

  return (
    <DashboardShell>
      <HeaderBand>
        <HeaderContent>
          <Eyebrow>Dashboard ERP/POS</Eyebrow>
          <HeaderTitle>{headerTitle}</HeaderTitle>
          <HeaderMeta>
            {operatorLabel} · {dashboard.updatedAtLabel} · {activeWidgets.length}{' '}
            widgets activos
          </HeaderMeta>
        </HeaderContent>
        <HeaderActions>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faCashRegister} />}
            href={ROUTES_NAME.SALES_TERM.SALES}
          >
            Nueva venta
          </Button>
          <Button
            icon={<FontAwesomeIcon icon={faReceipt} />}
            href={ROUTES_NAME.SALES_TERM.BILLS}
          >
            Facturas
          </Button>
          <Button
            icon={<FontAwesomeIcon icon={faChartLine} />}
            href={ROUTES_NAME.SALES_TERM.BILLS_ANALYTICS}
          >
            Analiticas
          </Button>
        </HeaderActions>
      </HeaderBand>

      <KpiGrid>
        {dashboard.metrics.map((metric) => (
          <DashboardKpiCard key={metric.id} metric={metric} />
        ))}
      </KpiGrid>

      <MainGrid>
        <DashboardAlertList alerts={dashboard.alerts} />
        <HomeActivityFeed activities={dashboard.activities} />
      </MainGrid>

      <SecondaryGrid>
        <HomeTrendPanel
          trend={dashboard.trend}
          topProducts={dashboard.topProducts}
          preparedWidgets={dashboard.preparedWidgets}
        />
        <HomeQuickActions includeDeveloperFeatures={includeDeveloperFeatures} />
      </SecondaryGrid>

      <AllShortcutsBlock>
        <AllShortcutsHeader>
          <div>
            <Eyebrow>Mapa de modulos</Eyebrow>
            <SectionTitle>Accesos disponibles</SectionTitle>
          </div>
          <AllShortcutsLink to={ROUTES_NAME.SETTING_TERM.SETTING}>
            Configuracion <FontAwesomeIcon icon={faArrowRight} />
          </AllShortcutsLink>
        </AllShortcutsHeader>
        <Suspense
          fallback={
            <ShortcutFallback>
              <Spin />
            </ShortcutFallback>
          }
        >
          <DashboardShortcuts includeDeveloperFeatures={includeDeveloperFeatures} />
        </Suspense>
      </AllShortcutsBlock>
    </DashboardShell>
  );
};

const DashboardShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  width: 100%;
`;

const HeaderBand = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-5);
  align-items: center;
  padding: var(--ds-space-6);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);

  @media (width <= 860px) {
    grid-template-columns: 1fr;
  }
`;

const HeaderContent = styled.div`
  min-width: 0;
`;

const Eyebrow = styled.span`
  display: block;
  margin-bottom: var(--ds-space-2);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: var(--ds-font-size-3xl);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);

  @media (width <= 640px) {
    font-size: var(--ds-font-size-2xl);
  }
`;

const HeaderMeta = styled.p`
  margin: var(--ds-space-2) 0 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (width <= 860px) {
    justify-content: flex-start;
  }
`;

const KpiGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-4);

  @media (width <= 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

const MainGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: var(--ds-space-4);

  @media (width <= 980px) {
    grid-template-columns: 1fr;
  }
`;

const SecondaryGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: var(--ds-space-4);

  @media (width <= 1040px) {
    grid-template-columns: 1fr;
  }
`;

const AllShortcutsBlock = styled.section`
  display: grid;
  gap: var(--ds-space-4);
`;

const AllShortcutsHeader = styled.div`
  display: flex;
  gap: var(--ds-space-4);
  align-items: center;
  justify-content: space-between;

  @media (width <= 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  color: var(--ds-color-text-primary);
`;

const AllShortcutsLink = styled(Link)`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-action-primary);
  text-decoration: none;
`;

const ShortcutFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
`;
