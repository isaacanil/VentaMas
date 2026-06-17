import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components';

import { MetaValue } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';
import { PanelStateCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelStateCard';

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
  <PanelStateCard icon={icon} title={title}>
    <ErrorMessage>{message}</ErrorMessage>
  </PanelStateCard>
);

const ErrorMessage = styled(MetaValue)`
  font-size: 14px;
  color: #ef4444;
`;

export default ErrorState;
