import {
  faClockRotateLeft,
  faCog,
  faFlaskVial,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import styled from 'styled-components';

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

const Card = styled.section`
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 12px 36px rgb(15 23 42 / 5%);
`;

const CardHeader = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const HeaderIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 14px;
`;

const HeaderCopy = styled.div`
  display: grid;
  gap: 4px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
`;

const CardDescription = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const ToolCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
`;

const ToolIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f8fafc;
  color: #334155;
  font-size: 14px;
`;

const ToolTitle = styled.h4`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
`;

const ToolDescription = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
`;
