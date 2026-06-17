import {
  faCalendarAlt,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Empty, Spin } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import { useDueDatesReceivable } from '@/modules/accountsReceivable/public';
import { formatNullableCountValue } from '@/utils/formatCounts';
import {
  MetaValue,
  PanelCard,
} from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';
import { PanelStateCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelStateCard';

import AccountsList from './components/AccountsList';
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
    return (
      <PanelStateCard icon={faCalendarAlt} title="Cuentas por Cobrar">
        <Spin />
      </PanelStateCard>
    );
  }

  if (error) {
    return (
      <PanelStateCard icon={faExclamationTriangle} title="Cuentas por Cobrar">
        <ErrorMessage>No se pudieron cargar los datos</ErrorMessage>
      </PanelStateCard>
    );
  }

  if (accounts.length === 0) {
    return (
      <PanelStateCard icon={faCheckCircle} title="Cuentas por Cobrar">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No hay cuentas por cobrar proximas a vencer en los proximos ${daysThreshold} dias`}
        />
      </PanelStateCard>
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
          { label: 'Vencidas', value: formatNullableCountValue(overdueCount) },
          { label: 'Próximas', value: formatNullableCountValue(dueSoonCount) },
          {
            label: 'Total alertas',
            value: formatNullableCountValue(totalAlerts),
          },
        ]}
        showMeta={showQuickStats}
      />
      <AccountsList accounts={accounts} />
    </PanelCard>
  );
};

const ErrorMessage = styled(MetaValue)`
  font-size: 14px;
  color: #ef4444;
`;

export default AccountsReceivablePanel;
