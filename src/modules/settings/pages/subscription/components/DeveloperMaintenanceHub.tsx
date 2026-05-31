import {
  faClockRotateLeft,
  faCog,
  faFlaskVial,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import {
  Card,
  CardHeader,
  HeaderIcon,
  HeaderCopy,
  CardTitle,
  CardDescription,
  Grid,
  ToolCard,
  ToolIcon,
  ToolTitle,
  ToolDescription,
} from './DeveloperMaintenanceHub.styles';

import type { DevMaintenanceModalKey } from '../subscription.types';

interface DeveloperMaintenanceHubProps {
  onOpenModal: (modal: Exclude<DevMaintenanceModalKey, null>) => void;
}

const TOOL_ITEMS: Array<{
  key: Exclude<DevMaintenanceModalKey, null>;
  title: string;
  description: string;
  icon: IconDefinition;
  actionLabel: string;
}> = [
  {
    key: 'assignment',
    title: 'Asignación de suscripción',
    description:
      'Asigna plan por cuenta o negocio y recarga el catálogo disponible.',
    icon: faFlaskVial,
    actionLabel: 'Abrir asignación',
  },
  {
    key: 'payment',
    title: 'Historial manual de pago',
    description:
      'Registra pagos manuales para pruebas, soporte y verificación de snapshots.',
    icon: faClockRotateLeft,
    actionLabel: 'Abrir historial',
  },
];

export const DeveloperMaintenanceHub = ({
  onOpenModal,
}: DeveloperMaintenanceHubProps) => (
  <Card>
    <CardHeader>
      <HeaderIcon>
        <FontAwesomeIcon icon={faCog} />
      </HeaderIcon>
      <HeaderCopy>
        <CardTitle>Herramientas developer</CardTitle>
        <CardDescription>
          Mantenimiento interno separado del flujo público, pero con el mismo
          orden visual de suscripción.
        </CardDescription>
      </HeaderCopy>
    </CardHeader>

    <Grid>
      {TOOL_ITEMS.map((item) => (
        <ToolCard key={item.key}>
          <ToolIcon>
            <FontAwesomeIcon icon={item.icon} />
          </ToolIcon>
          <ToolTitle>{item.title}</ToolTitle>
          <ToolDescription>{item.description}</ToolDescription>
          <Button type="default" onClick={() => onOpenModal(item.key)}>
            {item.actionLabel}
          </Button>
        </ToolCard>
      ))}
    </Grid>
  </Card>
);

export default DeveloperMaintenanceHub;
