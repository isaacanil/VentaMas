import { Empty } from 'antd';

import { PanelStateCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelStateCard';

const EmptyState = ({ isAdmin }) => (
  <PanelStateCard title="Autorizaciones">
    <Empty
      description={
        isAdmin
          ? 'No hay solicitudes pendientes'
          : 'No tienes solicitudes pendientes'
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  </PanelStateCard>
);

export default EmptyState;
