import { Spin } from 'antd';

import { PanelStateCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelStateCard';

const LoadingState = () => (
  <PanelStateCard title="Autorizaciones" padding="40px">
    <Spin />
  </PanelStateCard>
);

export default LoadingState;
