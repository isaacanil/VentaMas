import { EllipsisOutlined } from '@ant-design/icons';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Alert,
  Button,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { PreflightContent } from './DeveloperPlanVersioningModal.styles';
import { KeyValueEditor, LabelWithHelp } from './DeveloperPlanVersioningFields';

import type { JSX } from 'react';
import type { MenuProps } from 'antd';
import type { SubscriptionFieldCatalog } from '../subscriptionFieldCatalog';

/* Types */

type UnknownRecord = Record<string, unknown>;

interface PlanOption {
  label: string;
  value: string;
}

interface DeveloperPlanVersioningModalProps {
  open: boolean;
  onClose: () => void;
  devBusy: boolean;
  busyAction?: 'apply' | 'preview' | 'publish' | 'draft' | null;
  planOptions: PlanOption[];
  fieldCatalog: SubscriptionFieldCatalog;
  editorPlanCode: string;
  editorPlanLocked: boolean;
  onEditorPlanCodeChange: (value: string) => void;
  editorVersionId: string;
  editorVersionIdMode: 'auto' | 'manual';
  onEditorVersionIdChange: (value: string) => void;
  onResetEditorVersionIdToAuto: () => void;
  editorDisplayName: string;
  onEditorDisplayNameChange: (value: string) => void;
  editorPriceMonthly: number;
  onEditorPriceMonthlyChange: (value: number) => void;
  editorNoticeWindowDays: number;
  onEditorNoticeWindowDaysChange: (value: number) => void;
  editorEffectiveAt: string;
  editorLimitsJson: string;
  onEditorLimitsJsonChange: (value: string) => void;
  editorModulesJson: string;
  onEditorModulesJsonChange: (value: string) => void;
  editorAddonsJson: string;
  onEditorAddonsJsonChange: (value: string) => void;
  impactPreview: UnknownRecord | null;
  onPreviewImpact: () => void;
  onPublishVersion: () => void;
  onSaveDraftVersion: () => void;
  onApplyVersionNow: () => void;
}

/* Main Modal */

export const DeveloperPlanVersioningModal = ({
  open,
  onClose,
  devBusy,
  busyAction = null,
  planOptions,
  fieldCatalog,
  editorPlanCode,
  editorPlanLocked,
  onEditorPlanCodeChange,
  editorVersionId,
  editorVersionIdMode,
  onEditorVersionIdChange,
  onResetEditorVersionIdToAuto,
  editorDisplayName,
  onEditorDisplayNameChange,
  editorPriceMonthly,
  onEditorPriceMonthlyChange,
  editorNoticeWindowDays,
  onEditorNoticeWindowDaysChange,
  editorEffectiveAt,
  editorLimitsJson,
  onEditorLimitsJsonChange,
  editorModulesJson,
  onEditorModulesJsonChange,
  editorAddonsJson,
  onEditorAddonsJsonChange,
  impactPreview,
  onPreviewImpact,
  onPublishVersion,
  onSaveDraftVersion,
  onApplyVersionNow,
}: DeveloperPlanVersioningModalProps): JSX.Element => {
  const moreActions: MenuProps['items'] = [
    {
      key: 'preview',
      label: 'Revisar impacto',
      disabled: devBusy,
      onClick: () => {
        onPreviewImpact();
      },
    },
    {
      key: 'publish',
      label: 'Publicar / Programar',
      disabled: devBusy,
      onClick: () => {
        onPublishVersion();
      },
    },
    {
      key: 'draft',
      label: 'Guardar borrador',
      disabled: devBusy,
      onClick: () => {
        onSaveDraftVersion();
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <Space wrap>
          <Button
            type="primary"
            onClick={() => {
              onApplyVersionNow();
            }}
            loading={busyAction === 'apply'}
          >
            Revisar y publicar
          </Button>
          <Dropdown
            menu={{ items: moreActions }}
            placement="topRight"
            trigger={['click']}
          >
            <Button
              aria-label="Más acciones"
              icon={<EllipsisOutlined />}
              loading={
                busyAction === 'preview' ||
                busyAction === 'publish' ||
                busyAction === 'draft'
              }
            />
          </Dropdown>
        </Space>
      }
      destroyOnHidden
      width={1240}
      title={
        <Space>
          <FontAwesomeIcon icon={faCog} />
          Versionado de suscripciones
        </Space>
      }
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Código de la suscripción" required>
              <Select
                options={planOptions}
                value={editorPlanCode}
                onChange={(value) => onEditorPlanCodeChange(value)}
                placeholder="Selecciona una suscripción base"
                disabled={editorPlanLocked}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={
                <LabelWithHelp
                  label="ID de versión"
                  help={
                    editorVersionIdMode === 'auto'
                      ? 'Se genera usando la suscripción, la siguiente secuencia y la fecha efectiva.'
                      : 'Editado manualmente. Puedes volver al sugerido automático.'
                  }
                />
              }
            >
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Ej. plus-v03-20260401"
                  value={editorVersionId}
                  readOnly={editorVersionIdMode === 'auto'}
                  onChange={(event) =>
                    onEditorVersionIdChange(event.target.value)
                  }
                />
                <Button
                  onClick={onResetEditorVersionIdToAuto}
                  disabled={editorVersionIdMode === 'auto' || devBusy}
                >
                  Auto
                </Button>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={
                <LabelWithHelp
                  label="Nombre visible"
                  help="Se completa desde la suscripción base y puedes ajustarlo si hace falta."
                />
              }
            >
              <Input
                value={editorDisplayName}
                onChange={(event) =>
                  onEditorDisplayNameChange(event.target.value)
                }
                placeholder="Ej. Plus"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Precio mensual (DOP)">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={editorPriceMonthly}
                onChange={(value) =>
                  onEditorPriceMonthlyChange(Number(value || 0))
                }
                placeholder="Ej. 1500"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={
                <LabelWithHelp
                  label="Aviso previo y fecha efectiva"
                  help={
                    editorNoticeWindowDays === 0
                      ? 'La versión se activará inmediatamente al publicar.'
                      : 'Fecha en que la versión entrará en vigor.'
                  }
                />
              }
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Select
                  value={editorNoticeWindowDays}
                  options={[
                    { label: 'Inmediato', value: 0 },
                    { label: '7 días', value: 7 },
                    { label: '15 días', value: 15 },
                    { label: '30 días', value: 30 },
                    { label: '3 meses', value: 90 },
                  ]}
                  onChange={(value) => onEditorNoticeWindowDaysChange(value)}
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.45)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    width: 82,
                  }}
                >
                  {editorNoticeWindowDays === 0
                    ? '—'
                    : editorEffectiveAt
                      ? dayjs(editorEffectiveAt).format('DD/MM/YYYY')
                      : '—'}
                </span>
              </div>
            </Form.Item>
          </Col>
        </Row>

        {/* Key-value editors */}
        <Row gutter={16}>
          <Col xs={24} lg={8}>
            <KeyValueEditor
              sectionLabel="Límites"
              jsonString={editorLimitsJson}
              onChange={onEditorLimitsJsonChange}
              fieldDefinitions={fieldCatalog.limits}
            />
          </Col>
          <Col xs={24} lg={8}>
            <KeyValueEditor
              sectionLabel="Módulos"
              jsonString={editorModulesJson}
              onChange={onEditorModulesJsonChange}
              fieldDefinitions={fieldCatalog.modules}
            />
          </Col>
          <Col xs={24} lg={8}>
            <KeyValueEditor
              sectionLabel="Add-ons"
              jsonString={editorAddonsJson}
              onChange={onEditorAddonsJsonChange}
              fieldDefinitions={fieldCatalog.addons}
            />
          </Col>
        </Row>
      </Form>

      {impactPreview ? (
        <>
          <Divider />
          <Alert
            type="info"
            showIcon
            title="Resultado de preflight"
            description={
              <PreflightContent>
                <pre>{JSON.stringify(impactPreview, null, 2)}</pre>
              </PreflightContent>
            }
          />
        </>
      ) : null}
    </Modal>
  );
};

export default DeveloperPlanVersioningModal;
