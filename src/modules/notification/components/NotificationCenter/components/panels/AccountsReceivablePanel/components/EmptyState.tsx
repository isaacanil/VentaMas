import { Empty } from 'antd';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { PanelStateCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelStateCard';

type EmptyStateProps = {
  title?: string;
  icon?: IconProp;
  daysThreshold?: number;
};

const EmptyState = ({
  title = 'Cuentas por Cobrar',
  icon,
  daysThreshold = 7,
}: EmptyStateProps) => (
  <PanelStateCard icon={icon} title={title}>
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={`No hay cuentas por cobrar proximas a vencer en los proximos ${daysThreshold} dias`}
    />
  </PanelStateCard>
);

export default EmptyState;
