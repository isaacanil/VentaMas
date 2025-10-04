import styled from 'styled-components';
import PanelHeader from './PanelHeader';
import { PanelCard, MetaValue } from '../../shared/PanelPrimitives';

const ErrorState = ({ title, icon, message }) => (
  <PanelCard>
    <PanelHeader icon={icon} title={title} badgeCount={0} showMeta={false} />
    <StateContainer>
      <ErrorMessage>{message || 'No se pudieron cargar los datos'}</ErrorMessage>
    </StateContainer>
  </PanelCard>
);

ErrorState.defaultProps = {
  title: 'Cuentas por Cobrar',
  message: 'No se pudieron cargar los datos',
};

const StateContainer = styled.div`
  flex: 1;
  display: flex;
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
