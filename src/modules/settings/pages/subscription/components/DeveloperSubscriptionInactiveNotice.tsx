import { Button } from 'antd';
import {
  Notice,
  NoticeText,
} from './DeveloperSubscriptionInactiveNotice.styles';

interface DeveloperSubscriptionInactiveNoticeProps {
  onGoHome: () => void;
}

export const DeveloperSubscriptionInactiveNotice = ({
  onGoHome,
}: DeveloperSubscriptionInactiveNoticeProps) => (
  <Notice $tone="warning">
    <NoticeText>
      <strong>Sin negocio activo.</strong> Selecciona un negocio para ejecutar
      simulaciones y revisar el snapshot de suscripcion.
    </NoticeText>
    <Button size="small" onClick={onGoHome}>
      Ir al inicio
    </Button>
  </Notice>
);
