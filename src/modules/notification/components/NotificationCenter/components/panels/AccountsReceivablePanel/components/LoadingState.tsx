import { Spin } from 'antd';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { PanelStateCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelStateCard';

type LoadingStateProps = {
  title?: string;
  icon?: IconProp;
};

const LoadingState = ({
  title = 'Cuentas por Cobrar',
  icon,
}: LoadingStateProps) => (
  <PanelStateCard icon={icon} title={title}>
    <Spin />
  </PanelStateCard>
);

export default LoadingState;
