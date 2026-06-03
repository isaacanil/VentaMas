import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components';

import {
  PanelCard,
  MetaValue,
} from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

import PanelHeader from '@/modules/notification/components/NotificationCenter/components/panels/shared/SimplePanelHeader';

type ErrorStateProps = {
  title?: string;
  icon?: IconProp;
  message?: string;
};

const DEFAULT_ERROR_MESSAGE = 'No se pudieron cargar los datos';

const ErrorState = ({
  title = 'Cuentas por Cobrar',
  icon,
  message = DEFAULT_ERROR_MESSAGE,
}: ErrorStateProps) => (
  <PanelCard>
    <PanelHeader icon={icon} title={title} badgeCount={0} showMeta={false} />
    <StateContainer>
      <ErrorMessage>{message}</ErrorMessage>
    </StateContainer>
  </PanelCard>
);

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
