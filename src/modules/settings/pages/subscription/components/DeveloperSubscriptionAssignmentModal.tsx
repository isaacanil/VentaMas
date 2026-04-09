import { faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';

import type { JSX } from 'react';

type ScopeType = 'account' | 'business';

interface PlanOption {
  label: string;
  value: string;
}

interface DeveloperSubscriptionAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  plansLoading: boolean;
  planOptions: PlanOption[];
  assignPlanCode: string;
  onAssignPlanCodeChange: (value: string) => void;
  scope: ScopeType;
  onScopeChange: (value: ScopeType) => void;
  assignTargetBusinessId: string;
  onAssignTargetBusinessIdChange: (value: string) => void;
  devBusy: boolean;
  onAssignSubscription: () => void;
  onReloadCatalog: () => void;
}

export const DeveloperSubscriptionAssignmentModal = ({
  open,
  onClose,
  plansLoading,
  planOptions,
  assignPlanCode,
  onAssignPlanCodeChange,
  scope,
  onScopeChange,
  assignTargetBusinessId,
  onAssignTargetBusinessIdChange,
  devBusy,
  onAssignSubscription,
  onReloadCatalog,
}: DeveloperSubscriptionAssignmentModalProps): JSX.Element => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button
            loading={plansLoading}
            onClick={() => {
              onReloadCatalog();
            }}
          >
            Recargar catálogo
          </Button>
          <Button
            type="primary"
            loading={devBusy}
            disabled={!assignPlanCode || (scope === 'business' && !assignTargetBusinessId)}
            onClick={() => {
              onAssignSubscription();
            }}
          >
            Asignar suscripción
          </Button>
        </Space>
      }
      destroyOnHidden
      width={420}
      title={
        <Space>
          <FontAwesomeIcon icon={faCog} />
          Asignación de suscripción
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Asigna un plan de suscripción a nivel de cuenta o para un negocio específico.
      </Typography.Paragraph>
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item label="Plan a asignar" required>
              <Select
                loading={plansLoading}
                options={planOptions}
                value={assignPlanCode}
                onChange={(value) => onAssignPlanCodeChange(value)}
                placeholder="Selecciona un plan"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="Alcance (Scope)" required>
              <Radio.Group
                value={scope}
                onChange={(event) => onScopeChange(event.target.value as ScopeType)}
                style={{ width: '100%' }}
              >
                <Radio.Button value="account" style={{ width: '50%', textAlign: 'center' }}>
                  Cuenta
                </Radio.Button>
                <Radio.Button value="business" style={{ width: '50%', textAlign: 'center' }}>
                  Negocio
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          {scope === 'business' && (
            <Col xs={24}>
              <Form.Item
                label="ID del Negocio (targetBusinessId)"
                required
                tooltip="El ID del negocio al que se le asignará la suscripción. Solo aplica cuando el alcance es 'Negocio'."
              >
                <Input
                  value={assignTargetBusinessId}
                  onChange={(event) => onAssignTargetBusinessIdChange(event.target.value)}
                  placeholder="Ej. X63alFwHzk3r0gmT8w6P"
                />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export default DeveloperSubscriptionAssignmentModal;
