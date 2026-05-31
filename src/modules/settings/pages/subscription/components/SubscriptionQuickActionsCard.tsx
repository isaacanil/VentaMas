import { QuickAction } from './QuickAction';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from './SubscriptionOverviewCard.styles';

interface SubscriptionQuickActionsCardProps {
  onOpenBilling: () => void;
  onOpenPaymentMethods: () => void;
  onOpenPlans: () => void;
  onOpenSettings: () => void;
}

export const SubscriptionQuickActionsCard = ({
  onOpenBilling,
  onOpenPaymentMethods,
  onOpenPlans,
  onOpenSettings,
}: SubscriptionQuickActionsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Acciones Rápidas</CardTitle>
    </CardHeader>
    <CardBody>
      <QuickAction
        label="Actualizar plan"
        description="Accede a más terminales y funcionalidades"
        onClick={onOpenPlans}
      />
      <QuickAction
        label="Cambiar tarjeta"
        description="Abre la administración del método de pago"
        onClick={onOpenPaymentMethods}
      />
      <QuickAction
        label="Ver facturación"
        description="Consulta movimientos y detalle del historial"
        onClick={onOpenBilling}
      />
      <QuickAction
        label="Configuración"
        description="Ajusta notificaciones y preferencias visibles"
        onClick={onOpenSettings}
      />
      <QuickAction
        label="Cancelar suscripción"
        description="Gestiona la cancelación desde el portal seguro"
        onClick={onOpenSettings}
        danger
      />
    </CardBody>
  </Card>
);
