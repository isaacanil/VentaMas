import styled from 'styled-components';

import {
  PanelCard,
  MetaValue,
} from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

import PanelHeader from '@/modules/notification/components/NotificationCenter/components/panels/shared/SimplePanelHeader';

const ErrorState = ({ title, icon, message }) => (
  <PanelCard>
    <PanelHeader icon={icon} title={title} badgeCount={0} showMeta={false} />
    <StateContainer>
      <ErrorMessage>
        {message || 'No se pudieron cargar los datos'}
      </ErrorMessage>
    </StateContainer>
  </PanelCard>
);

ErrorState.defaultProps = {
  title: 'Cuentas por Cobrar',
  message: 'No se pudieron cargar los datos',
};

const StateContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const ErrorMessage = styled(MetaValue)`
  font-size: 14px;
  color: #ef4444;
`;

export default ErrorState;
