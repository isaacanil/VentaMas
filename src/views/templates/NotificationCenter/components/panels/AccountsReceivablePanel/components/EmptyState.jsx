import { Empty } from 'antd';
import styled from 'styled-components';

import { PanelCard } from '../../shared/PanelPrimitives';

import PanelHeader from './PanelHeader';

const EmptyState = ({ title, icon, daysThreshold }) => (
  <PanelCard>
    <PanelHeader icon={icon} title={title} badgeCount={0} showMeta={false} />
    <StateContainer>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={`No hay cuentas por cobrar próximas a vencer en los próximos ${daysThreshold} días`}
      />
    </StateContainer>
  </PanelCard>
);

EmptyState.defaultProps = {
  title: 'Cuentas por Cobrar',
  daysThreshold: 7,
};

const StateContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export default EmptyState;
