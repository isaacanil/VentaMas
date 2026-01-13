import {
  faCalendarAlt,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';

import useDueDatesReceivable from '@/hooks/accountsReceivable/useDueDatesReceivable';
import { formatNumber } from '@/utils/formatNumber';
import { PanelCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

import AccountsList from './components/AccountsList';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';
import LoadingState from './components/LoadingState';
import PanelHeader from '@/modules/notification/components/NotificationCenter/components/panels/shared/SimplePanelHeader';

/**
 * Panel para mostrar cuentas por cobrar próximas a vencer
 * Ahora reutiliza la base visual del panel de Autorizaciones
 */
const AccountsReceivablePanel = ({
  showQuickStats = false,
  daysThreshold = 7,
}) => {
  const {
    dueSoonAccounts = [],
    overdueAccounts = [],
    loading,
    error,
    stats = {},
  } = useDueDatesReceivable(daysThreshold) as any;

  const accounts = useMemo(() => {
    const overdueList = Array.isArray(overdueAccounts) ? overdueAccounts : [];
    const dueSoonList = Array.isArray(dueSoonAccounts) ? dueSoonAccounts : [];
    const items = [...overdueList, ...dueSoonList];
    return items
      .slice()
      .sort((a, b) => (a?.daysUntilNextDue ?? 0) - (b?.daysUntilNextDue ?? 0));
  }, [overdueAccounts, dueSoonAccounts]);

  if (loading) {
    return <LoadingState title="Cuentas por Cobrar" icon={faCalendarAlt} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Cuentas por Cobrar"
        icon={faExclamationTriangle}
        message="No se pudieron cargar los datos"
      />
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        daysThreshold={daysThreshold}
        title="Cuentas por Cobrar"
        icon={faCheckCircle}
      />
    );
  }

  const totalAlerts = stats.totalAlerts ?? accounts.length;
  const overdueCount = stats.totalOverdue ?? overdueAccounts.length;
  const dueSoonCount = stats.totalDueSoon ?? dueSoonAccounts.length;

  return (
    <PanelCard>
      <PanelHeader
        title="Cuentas por Cobrar"
        badgeCount={overdueCount}
        metaItems={[
          { label: 'Vencidas', value: formatNumber(overdueCount) },
          { label: 'Próximas', value: formatNumber(dueSoonCount) },
          { label: 'Total alertas', value: formatNumber(totalAlerts) },
        ]}
        showMeta={showQuickStats}
      />
      <AccountsList accounts={accounts} />
    </PanelCard>
  );
};

export default AccountsReceivablePanel;

