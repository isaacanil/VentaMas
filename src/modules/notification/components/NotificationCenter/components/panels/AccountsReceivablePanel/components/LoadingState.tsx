import { Spin } from 'antd';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components';

import { PanelCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

import PanelHeader from '@/modules/notification/components/NotificationCenter/components/panels/shared/SimplePanelHeader';

type LoadingStateProps = {
  title?: string;
  icon?: IconProp;
};

const LoadingState = ({
  title = 'Cuentas por Cobrar',
  icon,
}: LoadingStateProps) => (
  <PanelCard>
    <PanelHeader icon={icon} title={title} showMeta={false} />
    <StateContainer>
      <Spin />
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

export default LoadingState;
