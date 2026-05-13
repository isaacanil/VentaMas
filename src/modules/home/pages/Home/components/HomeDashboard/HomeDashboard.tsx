import { Button } from '@heroui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCashRegister,
  faChartLine,
  faCode,
  faGrip,
  faReceipt,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '@/router/routes/routesName';

import { DashboardAlertList } from './components/DashboardAlertList';
import { HomeActivityFeed } from './components/HomeActivityFeed';
import { ModuleLauncherDock } from './components/ModuleLauncherDock';
import { ModuleShortcutGrid } from './components/ModuleLauncher/ModuleShortcutGrid';
import { HomeTrendPanel } from './components/HomeTrendPanel';
import { useHomeDashboardData } from './hooks/useHomeDashboardData';
import { useModuleShortcuts } from './components/ModuleLauncher/useModuleShortcuts';

import type { Dispatch, JSX, SetStateAction } from 'react';
import type { HomeDashboardSummary } from './types';
import type {
  LauncherShortcut,
  LauncherTabKey,
} from './components/ModuleLauncher/types';

export interface HomeDashboardProps {
  activePanel: HomePanelKey;
  businessName?: string | null;
  displayName?: string | null;
  includeDeveloperFeatures?: boolean;
  onActivePanelChange: Dispatch<SetStateAction<HomePanelKey>>;
  onShortcutSearchValueChange: Dispatch<SetStateAction<string>>;
  shortcutSearchValue: string;
}

type HomePanelKey = 'metrics' | 'modules' | 'developer';

const MOBILE_DOCK_RESERVED_SPACE =
  'calc(96px + env(safe-area-inset-bottom, 0px))';

const getGreetingLabel = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const resolveFirstName = (displayName?: string | null): string | null => {
  const trimmed = displayName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
};

const buildGreetingTitle = (displayName?: string | null): string => {
  const greeting = getGreetingLabel(new Date().getHours());
  const firstName = resolveFirstName(displayName);
  return firstName ? `${greeting}, ${firstName}` : greeting;
};

const buildTodayLabel = (): string => {
  const label = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date())
    .replace(',', '');

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const splitMoneyLabel = (value: string): { prefix: string; amount: string } => {
  if (!value.startsWith('RD$')) {
    return { prefix: '', amount: value };
  }

  return { prefix: 'RD$', amount: value.slice(3) };
};

const buildCashPulseLine = (summary: HomeDashboardSummary): string => {
  const cashLabel = summary.cash.detail.replace(/^Cuadre\s+/i, 'Caja ');
  const ticketCount = summary.today.invoiceCount;
  const ticketLabel = `${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`;
  return `${cashLabel} · ${summary.cash.statusLabel} · ${ticketLabel}`;
};

const buildPayableMeta = (summary: HomeDashboardSummary): string => {
  if (
    summary.finance.payableCount === 0 &&
    summary.finance.payableOverdueCount === 0
  ) {
    return 'Ninguna pendiente';
  }

  return `${summary.finance.payableCount} abiertas · ${summary.finance.payableOverdueCount} vencidas`;
};

const shouldShowNetColumn = (summary: HomeDashboardSummary): boolean =>
  summary.finance.receivableAmount > 0 && summary.finance.payableAmount > 0;

const buildNetFooterLabel = (summary: HomeDashboardSummary): string => {
  if (summary.finance.netAmount === 0) return 'Sin balance pendiente';
  const label =
    summary.finance.netAmount > 0 ? 'Saldo a favor' : 'Saldo comprometido';
  return `${label}: ${summary.finance.netLabel}`;
};

export const HomeDashboard = ({
  activePanel,
  displayName,
  includeDeveloperFeatures = false,
  onActivePanelChange,
  onShortcutSearchValueChange,
  shortcutSearchValue,
}: HomeDashboardProps): JSX.Element => {
  const navigate = useNavigate();
  const dashboard = useHomeDashboardData();
  const handleLauncherTabChange = useCallback<
    Dispatch<SetStateAction<LauncherTabKey>>
  >(
    (nextTabValue) => {
      const currentTab: LauncherTabKey =
        activePanel === 'developer' ? 'developer' : 'user';
      const nextTab =
        typeof nextTabValue === 'function'
          ? nextTabValue(currentTab)
          : nextTabValue;
      onActivePanelChange(nextTab === 'developer' ? 'developer' : 'modules');
    },
    [activePanel, onActivePanelChange],
  );
  const moduleLauncher = useModuleShortcuts({
    activeTab: activePanel === 'developer' ? 'developer' : 'user',
    includeDeveloperFeatures,
    onActiveTabChange: handleLauncherTabChange,
    onSearchValueChange: onShortcutSearchValueChange,
    searchValue: shortcutSearchValue,
  });
  const canShowDeveloperPanel = moduleLauncher.canShowDeveloperTools;
  const resolvedPanel =
    activePanel === 'developer' && !canShowDeveloperPanel
      ? 'metrics'
      : activePanel;
  const headerTitle = buildGreetingTitle(displayName);
  const todayLabel = buildTodayLabel();

  const handleOpenModuleShortcut = useCallback(
    (shortcut: LauncherShortcut) => {
      navigate(shortcut.route);
    },
    [navigate],
  );

  const handleOpenMetricsPanel = useCallback(() => {
    onShortcutSearchValueChange('');
    onActivePanelChange('metrics');
  }, [onActivePanelChange, onShortcutSearchValueChange]);

  const handleOpenModulesPanel = useCallback(() => {
    onShortcutSearchValueChange('');
    onActivePanelChange('modules');
  }, [onActivePanelChange, onShortcutSearchValueChange]);

  const handleOpenDeveloperPanel = useCallback(() => {
    onShortcutSearchValueChange('');
    onActivePanelChange('developer');
  }, [onActivePanelChange, onShortcutSearchValueChange]);

  return (
    <DashboardShell>
      <HomePanelTabs aria-label="Vista principal" role="tablist">
        <HomePanelTab
          $active={resolvedPanel === 'metrics'}
          aria-controls="home-metrics-panel"
          aria-selected={resolvedPanel === 'metrics'}
          id="home-metrics-tab"
          onClick={handleOpenMetricsPanel}
          role="tab"
          type="button"
        >
          <FontAwesomeIcon icon={faChartLine} />
          Métricas
        </HomePanelTab>
        <HomePanelTab
          $active={resolvedPanel === 'modules'}
          aria-controls="home-modules-panel"
          aria-selected={resolvedPanel === 'modules'}
          id="home-modules-tab"
          onClick={handleOpenModulesPanel}
          role="tab"
          type="button"
        >
          <FontAwesomeIcon icon={faGrip} />
          Módulos
        </HomePanelTab>
        {canShowDeveloperPanel ? (
          <HomePanelTab
            $active={resolvedPanel === 'developer'}
            aria-controls="home-developer-panel"
            aria-selected={resolvedPanel === 'developer'}
            id="home-developer-tab"
            onClick={handleOpenDeveloperPanel}
            role="tab"
            type="button"
          >
            <FontAwesomeIcon icon={faCode} />
            Desarrollador
          </HomePanelTab>
        ) : null}
      </HomePanelTabs>

      {resolvedPanel === 'metrics' ? (
        <HeaderBand>
          <HeaderContent>
            <HeaderTitle>{headerTitle}</HeaderTitle>
            <HeaderMeta>{todayLabel}</HeaderMeta>
          </HeaderContent>
          <HeaderActions>
            <Button
              onPress={() => navigate(ROUTES_NAME.SALES_TERM.SALES)}
              size="sm"
              variant="primary"
            >
              <FontAwesomeIcon icon={faCashRegister} />
              Nueva venta
            </Button>
            <Button
              onPress={() => navigate(ROUTES_NAME.SALES_TERM.BILLS)}
              size="sm"
              variant="secondary"
            >
              <FontAwesomeIcon icon={faReceipt} />
              Facturas
            </Button>
            <Button
              onPress={() => navigate(ROUTES_NAME.SALES_TERM.BILLS_ANALYTICS)}
              size="sm"
              variant="secondary"
            >
              <FontAwesomeIcon icon={faChartLine} />
              Analíticas
            </Button>
          </HeaderActions>
        </HeaderBand>
      ) : null}

      {resolvedPanel === 'metrics' ? (
        <PanelRegion
          aria-labelledby="home-metrics-tab"
          id="home-metrics-panel"
          role="tabpanel"
        >
          <DashboardAlertList alerts={dashboard.alerts} />
          <OverviewGrid>
            <DailyPulseCard summary={dashboard.summary} />
            <FinancialHealthCard summary={dashboard.summary} />
          </OverviewGrid>

          <MainGrid>
            <HomeTrendPanel
              trend={dashboard.trend}
              topProducts={dashboard.topProducts}
            />
            <HomeActivityFeed activities={dashboard.activities} />
          </MainGrid>
        </PanelRegion>
      ) : (
        <ModulesPanel
          aria-labelledby={
            resolvedPanel === 'developer'
              ? 'home-developer-tab'
              : 'home-modules-tab'
          }
          id={
            resolvedPanel === 'developer'
              ? 'home-developer-panel'
              : 'home-modules-panel'
          }
          role="tabpanel"
        >
          <ModuleShortcutGrid
            controller={moduleLauncher}
            onOpenShortcut={handleOpenModuleShortcut}
            showSearchField={false}
            showPinnedSection={resolvedPanel !== 'developer'}
            showScopeTabs={false}
          />
        </ModulesPanel>
      )}

      <ModuleLauncherDock
        alertCount={dashboard.alerts.length}
        controller={moduleLauncher}
        onOpenModules={handleOpenModulesPanel}
      />
    </DashboardShell>
  );
};

const MoneyValue = ({
  value,
  size = 'md',
}: {
  value: string;
  size?: 'lg' | 'md' | 'sm';
}): JSX.Element => {
  const money = splitMoneyLabel(value);

  return (
    <AmountValue $size={size}>
      {money.prefix && <AmountPrefix>{money.prefix}</AmountPrefix>}
      {money.amount}
    </AmountValue>
  );
};

const DailyPulseCard = ({
  summary,
}: {
  summary: HomeDashboardSummary;
}): JSX.Element => (
  <PulseCard>
    <PanelHeader>
      <div>
        <Eyebrow>Pulso del día</Eyebrow>
        <PanelTitle>Ventas y caja</PanelTitle>
      </div>
    </PanelHeader>
    <PulseMain>
      <span>Ventas hoy</span>
      <MoneyValue value={summary.today.salesLabel} size="lg" />
      <PulseStatusLine>{buildCashPulseLine(summary)}</PulseStatusLine>
    </PulseMain>
  </PulseCard>
);

const FinancialHealthCard = ({
  summary,
}: {
  summary: HomeDashboardSummary;
}): JSX.Element => {
  const showNetColumn = shouldShowNetColumn(summary);

  return (
    <PanelCard>
      <PanelHeader>
        <div>
          <Eyebrow>Salud financiera</Eyebrow>
          <PanelTitle>Flujo pendiente</PanelTitle>
        </div>
        <PanelHeaderIcon>
          <FontAwesomeIcon icon={faWallet} />
        </PanelHeaderIcon>
      </PanelHeader>
      <FinanceGrid>
        <FinanceColumn>
          <ColumnLabel>Por cobrar</ColumnLabel>
          <MoneyValue value={summary.finance.receivableLabel} size="sm" />
          <ColumnMeta>{summary.finance.receivableCount} cuentas</ColumnMeta>
        </FinanceColumn>
        <FinanceColumn>
          <ColumnLabel>Por pagar</ColumnLabel>
          <MoneyValue value={summary.finance.payableLabel} size="sm" />
          <ColumnMeta>{buildPayableMeta(summary)}</ColumnMeta>
        </FinanceColumn>
        {showNetColumn ? (
          <FinanceColumn $emphasis>
            <ColumnLabel>Neto</ColumnLabel>
            <MoneyValue value={summary.finance.netLabel} size="sm" />
            <ColumnMeta>
              {summary.finance.netAmount >= 0 ? 'A favor' : 'Comprometido'}
            </ColumnMeta>
          </FinanceColumn>
        ) : null}
      </FinanceGrid>
      {!showNetColumn && (
        <FinanceFooter>{buildNetFooterLabel(summary)}</FinanceFooter>
      )}
    </PanelCard>
  );
};

const DashboardShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  width: 100%;

  @media (width <= 768px) {
    padding-bottom: ${MOBILE_DOCK_RESERVED_SPACE};
  }
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
  font-size: var(--ds-font-size-2xl);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);

  @media (width <= 640px) {
    font-size: var(--ds-font-size-xl);
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

const HomePanelTabs = styled.div`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-self: flex-start;
  padding: var(--ds-space-1);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-pill);
`;

const HomePanelTab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 var(--ds-space-4);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: ${({ $active }) =>
    $active
      ? 'var(--ds-color-action-primary)'
      : 'var(--ds-color-text-secondary)'};
  cursor: pointer;
  background: ${({ $active }) =>
    $active ? 'var(--ds-color-bg-surface)' : 'transparent'};
  border: 0;
  border-radius: var(--ds-radius-pill);
  box-shadow: ${({ $active }) => ($active ? 'var(--ds-shadow-sm)' : 'none')};
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    color: var(--ds-color-action-primary);
    outline: none;
    background: var(--ds-color-bg-surface);
  }
`;

const PanelRegion = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const ModulesPanel = styled.section`
  min-width: 0;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const OverviewGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: var(--ds-space-3);

  @media (width <= 1040px) {
    grid-template-columns: 1fr;
  }
`;

const PanelCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-width: 0;
  padding: var(--ds-space-5);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const PulseCard = styled(PanelCard)`
  justify-content: space-between;
  min-height: 178px;
`;

const PanelHeader = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const PanelHeaderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--ds-color-text-muted);
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
`;

const PulseMain = styled.div`
  display: grid;
  gap: var(--ds-space-2);

  > span {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-secondary);
  }
`;

const PulseStatusLine = styled.span`
  display: block;
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AmountValue = styled.strong<{ $size: 'lg' | 'md' | 'sm' }>`
  display: inline-flex;
  gap: 0.15em;
  align-items: baseline;
  overflow-wrap: anywhere;
  font-size: ${({ $size }) =>
    $size === 'lg'
      ? 'clamp(2rem, 1.35rem + 1.8vw, 3rem)'
      : $size === 'sm'
        ? 'clamp(1.15rem, 1rem + 0.35vw, 1.45rem)'
        : 'clamp(1.4rem, 1.1rem + 0.7vw, 1.9rem)'};
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const AmountPrefix = styled.span`
  font-size: 0.48em;
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
`;

const FinanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: var(--ds-space-3);
`;

const FinanceColumn = styled.div<{ $emphasis?: boolean }>`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
  padding: var(--ds-space-4);
  background: ${({ $emphasis }) =>
    $emphasis
      ? 'var(--ds-color-action-primary-subtle)'
      : 'var(--ds-color-bg-subtle)'};
  border: 1px solid
    ${({ $emphasis }) =>
      $emphasis
        ? 'var(--ds-color-action-primary)'
        : 'var(--ds-color-border-subtle)'};
  border-radius: var(--ds-radius-md);
`;

const ColumnLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text-muted);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const ColumnMeta = styled.span`
  overflow: hidden;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FinanceFooter = styled.span`
  display: block;
  padding-top: var(--ds-space-1);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
`;

const MainGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: var(--ds-space-3);

  @media (width <= 980px) {
    grid-template-columns: 1fr;
  }
`;
