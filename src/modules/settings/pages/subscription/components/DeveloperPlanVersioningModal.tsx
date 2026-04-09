import { EllipsisOutlined } from '@ant-design/icons';
import { faCircleQuestion, faCog } from '@fortawesome/free-solid-svg-icons';
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
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import type { JSX } from 'react';
import type { MenuProps } from 'antd';
import type {
  SubscriptionFieldCatalog,
  SubscriptionFieldDefinition,
} from '../subscriptionFieldCatalog';


/* ───────────────────────── Types ───────────────────────── */

type UnknownRecord = Record<string, unknown>;

type ValueType = 'number' | 'boolean' | 'string';

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

/* ── Friendly labels for known keys ── */

const LabelWithHelp = ({
  label,
  help,
}: {
  label: string;
  help: string;
}): JSX.Element => (
  <LabelHelp>
    <span>{label}</span>
    <Tooltip title={help}>
      <HelpIconButton
        type="text"
        size="small"
        icon={<FontAwesomeIcon icon={faCircleQuestion} />}
        tabIndex={-1}
      />
    </Tooltip>
  </LabelHelp>
);

/* ───────────────── KeyValueEditor sub-component ───────────────── */

interface KeyValueEditorProps {
  jsonString: string;
  onChange: (json: string) => void;
  fieldDefinitions: Record<string, SubscriptionFieldDefinition>;
  /** Label of the section for display purposes */
  sectionLabel: string;
}

const safeParseJson = (raw: string): UnknownRecord => {
  try {
    const parsed: unknown = JSON.parse(raw.trim() || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as UnknownRecord;
    }
  } catch {
    /* ignore */
  }
  return {};
};

const detectValueType = (value: unknown): ValueType => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
};

const KeyValueEditor = ({
  jsonString,
  onChange,
  fieldDefinitions,
  sectionLabel,
}: KeyValueEditorProps): JSX.Element => {
  const data = useMemo(() => safeParseJson(jsonString), [jsonString]);

  // Show only active catalog fields; use stored value when present, default otherwise.
  const entries = useMemo(
    () =>
      Object.values(fieldDefinitions)
        .filter((definition) => definition.isActive !== false)
        .sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.key.localeCompare(b.key, 'es');
        })
        .map((def) => {
          const stored = data[def.key];
          const value =
            stored !== undefined
              ? stored
              : def.type === 'number'
                ? 0
                : false;
          return [def.key, value] as [string, unknown];
        }),
    [data, fieldDefinitions],
  );

  const [editingKey, setEditingKey] = useState<string | null>(null);

  const emitChange = useCallback(
    (updated: UnknownRecord) => {
      onChange(JSON.stringify(updated, null, 2));
    },
    [onChange],
  );

  const handleValueChange = useCallback(
    (key: string, newValue: unknown) => {
      const updated = { ...data, [key]: newValue };
      emitChange(updated);
    },
    [data, emitChange],
  );

  return (
    <EditorWrapper>
      <EditorHeader>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {sectionLabel}
        </Typography.Text>
      </EditorHeader>

      <EntryList>
        {entries.length === 0 && (
          <EmptyMessage>Sin campos en el catálogo</EmptyMessage>
        )}
        {entries.map(([key, value]) => {
          const type = detectValueType(value);
          const isEditing = editingKey === key;

          return (
            <EntryRow key={key}>
              <EntryLabel title={key}>
                {fieldDefinitions[key]?.label ?? key}
              </EntryLabel>

              <EntryValue>
                {type === 'boolean' && (
                  <Switch
                    size="small"
                    checked={value === true}
                    onChange={(checked) => handleValueChange(key, checked)}
                  />
                )}

                {type === 'number' && !isEditing && (
                  <NumberDisplay
                    onClick={() => setEditingKey(key)}
                    tabIndex={0}
                    onFocus={() => setEditingKey(key)}
                    title="Clic para editar"
                  >
                    {value === -1 ? (
                      <span className="unlimited">Ilimitado</span>
                    ) : (
                      Number(value).toLocaleString()
                    )}
                  </NumberDisplay>
                )}

                {type === 'number' && isEditing && (
                  <InputNumber
                    size="small"
                    value={value as number}
                    onChange={(v) => handleValueChange(key, v ?? 0)}
                    onBlur={() => setEditingKey(null)}
                    onPressEnter={() => setEditingKey(null)}
                    style={{ width: 120 }}
                    min={-1}
                  />
                )}

                {type === 'string' && (
                  <Input
                    size="small"
                    value={String(value)}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    style={{ width: 140 }}
                  />
                )}
              </EntryValue>

            </EntryRow>
          );
        })}
      </EntryList>
    </EditorWrapper>
  );
};

/* ───────────────────────── Main Modal ───────────────────────── */

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

        {/* ── Key-Value Editors ── */}
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

/* ───────────────────────── Styled Components ───────────────────────── */

const EditorWrapper = styled.div`
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  background: #fafbfc;
  overflow: hidden;
  margin-bottom: 16px;
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf1 100%);
  border-bottom: 1px solid #e8ecf1;
`;

const FieldInline = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LabelHelp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const HelpIconButton = styled(Button)`
  &&& {
    width: 20px;
    min-width: 20px;
    height: 20px;
    padding: 0;
    color: #94a3b8;

    &:hover {
      color: #475569;
      background: rgb(148 163 184 / 10%);
    }
  }
`;

const EntryList = styled.div`
  max-height: 320px;
  overflow-y: auto;
`;

const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
`;

const EntryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f0f4ff;
  }
`;

const EntryLabel = styled.span`
  flex: 1;
  font-size: 13px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  line-height: 28px;
`;

const EntryValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 80px;
`;

const NumberDisplay = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;

  &:hover,
  &:focus {
    border-color: #3b82f6;
    background: #eff6ff;
    outline: none;
    box-shadow: 0 0 0 2px rgb(59 130 246 / 12%);
  }

  .unlimited {
    color: #6366f1;
    font-style: italic;
    font-weight: 400;
    font-size: 12px;
  }
`;

const PreflightContent = styled.div`
  max-height: 280px;
  overflow: auto;
  margin-top: 6px;

  pre {
    margin: 0;
    white-space: pre-wrap;
    font-size: 12px;
  }
`;
