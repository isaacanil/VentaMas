import { Button, Form, Input, Modal, Select, Space, Typography } from 'antd';

import type { JSX } from 'react';
import type { PlanLifecycleStatus } from '../subscription.types';

interface DeveloperPlanDefinitionModalProps {
  open: boolean;
  onClose: () => void;
  devBusy: boolean;
  definitionPlanCode: string;
  onDefinitionPlanCodeChange: (value: string) => void;
  definitionDisplayName: string;
  onDefinitionDisplayNameChange: (value: string) => void;
  definitionCatalogStatus: PlanLifecycleStatus;
  onDefinitionCatalogStatusChange: (value: PlanLifecycleStatus) => void;
  definitionIsNew: boolean;
  onSaveDefinition: () => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: PlanLifecycleStatus }> = [
  { label: 'Activa', value: 'active' },
  { label: 'Deprecada', value: 'deprecated' },
  { label: 'Retirada', value: 'retired' },
];

export const DeveloperPlanDefinitionModal = ({
  open,
  onClose,
  devBusy,
  definitionPlanCode,
  onDefinitionPlanCodeChange,
  definitionDisplayName,
  onDefinitionDisplayNameChange,
  definitionCatalogStatus,
  onDefinitionCatalogStatusChange,
  definitionIsNew,
  onSaveDefinition,
}: DeveloperPlanDefinitionModalProps): JSX.Element => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnHidden
      title={definitionIsNew ? 'Nueva suscripción base' : 'Editar suscripción base'}
      footer={
        <Space>
          <Button onClick={onClose}>Cerrar</Button>
          <Button type="primary" loading={devBusy} onClick={onSaveDefinition}>
            Guardar
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        Define la suscripción comercial base, como <strong>plus</strong> o{' '}
        <strong>pro</strong>. Luego podrás crear y programar sus versiones.
      </Typography.Paragraph>

      <Form layout="vertical">
        <Form.Item label="Código" required>
          <Input
            value={definitionPlanCode}
            onChange={(event) => onDefinitionPlanCodeChange(event.target.value)}
            placeholder="Ej. plus, pro, enterprise"
            disabled={!definitionIsNew}
          />
        </Form.Item>

        <Form.Item label="Nombre visible" required>
          <Input
            value={definitionDisplayName}
            onChange={(event) =>
              onDefinitionDisplayNameChange(event.target.value)
            }
            placeholder="Ej. Plus, Pro, Enterprise"
          />
        </Form.Item>

        <Form.Item label="Estado">
          <Select
            value={definitionCatalogStatus}
            options={STATUS_OPTIONS}
            onChange={(value) => onDefinitionCatalogStatusChange(value)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DeveloperPlanDefinitionModal;
