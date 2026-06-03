import { Empty } from 'antd';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components';

import { PanelCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

import PanelHeader from '@/modules/notification/components/NotificationCenter/components/panels/shared/SimplePanelHeader';

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
  <PanelCard>
    <PanelHeader icon={icon} title={title} badgeCount={0} showMeta={false} />
    <StateContainer>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={`No hay cuentas por cobrar proximas a vencer en los proximos ${daysThreshold} dias`}
      />
    </StateContainer>
  </PanelCard>
);

const StateContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export default EmptyState;
