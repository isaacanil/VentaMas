import { Spin } from 'antd';
import styled from 'styled-components';

import { PanelCard } from '@/views/templates/NotificationCenter/components/panels/shared/PanelPrimitives';

import PanelHeader from '@/views/templates/NotificationCenter/components/panels/shared/SimplePanelHeader';

const LoadingState = ({ title, icon }) => (
  <PanelCard>
    <PanelHeader icon={icon} title={title} showMeta={false} />
    <StateContainer>
      <Spin />
    </StateContainer>
  </PanelCard>
);

LoadingState.defaultProps = {
  title: 'Cuentas por Cobrar',
};

const StateContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export default LoadingState;
