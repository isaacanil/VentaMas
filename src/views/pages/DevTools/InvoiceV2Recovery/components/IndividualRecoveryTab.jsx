import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  ATTACH_TO_CASH_COUNT_TASK,
  STATUS_COLORS,
  TASK_DESCRIPTIONS,
} from '@/views/pages/DevTools/InvoiceV2Recovery/constants';

import { formatDateTime } from '../utils/time';

import { Centered, CodeBlock } from './StyledComponents';

const { Text, Paragraph } = Typography;

export const IndividualRecoveryTab = ({
  form,
  watchedBusinessId,
  businessOptions,
  loadingBusinesses,
  invoiceOptions,
  loadingInvoices,
  handleSubmit,
  loading,
  errorMessage,
  showEmptyState,
  handleFetch,
  activeQuery,
  invoiceData,
  summary,
  canonicalData,
  failedOutboxTasks,
  resolvedInvoiceId,
  snapshot,
  v2CreatedAtLabel,
  canonicalDateLabel,
  shouldWarnDateMismatch,
  shouldWarnCashCount,
  selectedTasks,
  setSelectedTasks,
  reason,
  setReason,
  handleRepair,
  repairing,
  availableTaskKeys,
  availableAutoRecoveryTasks,
  handleSingleAutoRecovery,
  repairResult,
  linkedCashCounts,
  intendedCashCountId,
  effectiveResolvedCashCountId,
  isCashCountLinked,
  statusTimeline,
  resolvedInvoiceNumber,
  canonicalInvoiceNumber,
  invoiceCounterValue,
  invoiceCounterUpdatedAt,
  loadingInvoiceCounter,
  updatingInvoiceCounter,
  refreshInvoiceCounter,
  syncCounterWithInvoiceNumber,
  updateInvoiceCounter,
  shouldWarnInvoiceNumber,
  updateInvoiceNumberEverywhere,
  updatingInvoiceNumber,
}) => {
  const [customCounterValue, setCustomCounterValue] = useState(null);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState(null);

  const statusTag = invoiceData ? (
    <Tag color={STATUS_COLORS[invoiceData.status] || 'default'}>
      {invoiceData.status || 'desconocido'}
    </Tag>
  ) : null;

  const handleManualCounterSave = async () => {
    if (customCounterValue === null || customCounterValue === undefined) {
      return;
    }
    const updated = await updateInvoiceCounter(customCounterValue);
    if (updated) {
      setCustomCounterValue(null);
    }
  };

  const handleManualInvoiceNumberSave = async () => {
    if (customInvoiceNumber === null || customInvoiceNumber === undefined) {
      return;
    }
    const updated = await updateInvoiceNumberEverywhere(customInvoiceNumber);
    if (updated) {
      setCustomInvoiceNumber(null);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Buscar factura">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            label="businessId"
            name="businessId"
            rules={[{ required: true, message: 'Ingresa el businessId' }]}
          >
            <Select
              showSearch
              placeholder="Selecciona un negocio"
              allowClear
              loading={loadingBusinesses}
              options={businessOptions}
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input?.toLowerCase() ?? '') ??
                false
              }
            />
          </Form.Item>
          <Form.Item
            label="invoiceId"
            name="invoiceId"
            rules={[
              {
                required: true,
                message: 'Selecciona o escribe el ID de la factura',
              },
            ]}
            extra={
              watchedBusinessId && invoiceOptions.length
                ? `Mostrando ${invoiceOptions.length} facturas recientes.`
                : null
            }
          >
            <AutoComplete
              placeholder="Escribe o selecciona el invoiceId"
              options={invoiceOptions}
              allowClear
              disabled={!watchedBusinessId}
              filterOption={(inputValue, option) =>
                option?.label
                  ?.toLowerCase()
                  .includes(inputValue?.toLowerCase() ?? '') ?? false
              }
              notFoundContent={
                watchedBusinessId && !loadingInvoices
                  ? 'No se encontraron facturas recientes'
                  : null
              }
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Buscar
              </Button>
              {invoiceData && (
                <Button onClick={() => handleFetch(activeQuery)} disabled={loading}>
                  Actualizar datos
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {errorMessage && (
        <Alert
          type="error"
          message="No se pudo obtener la factura"
          description={errorMessage}
          showIcon
        />
      )}

      {loading && (
        <Centered>
          <Spin size="large" />
        </Centered>
      )}

      {showEmptyState && (
        <Card>
          <Empty description="Busca una factura para comenzar" />
        </Card>
      )}

      {invoiceData && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Resumen general" extra={statusTag}>
            <Space wrap>
              <Statistic title="invoiceId" value={resolvedInvoiceId || '—'} />
              <Statistic title="Pendientes" value={summary.pending || 0} />
              <Statistic title="Completadas" value={summary.done || 0} />
              <Statistic title="Fallidas" value={summary.failed || 0} />
              <Statistic
                title="Estado canonical"
                value={canonicalData ? canonicalData.status || 'active' : 'No existe'}
              />
            </Space>
          </Card>

          <Card title="Número de factura y contador">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Statistic
                  title="Número (Invoice V2)"
                  value={resolvedInvoiceNumber ?? '—'}
                />
                <Statistic
                  title="Número en invoices"
                  value={canonicalInvoiceNumber ?? '—'}
                />
                <Statistic
                  title="Contador lastInvoiceId"
                  value={
                    loadingInvoiceCounter
                      ? 'Actualizando...'
                      : invoiceCounterValue ?? 'Sin valor'
                  }
                />
              </Space>
              {invoiceCounterUpdatedAt && (
                <Text type="secondary">
                  Última actualización: {formatDateTime(invoiceCounterUpdatedAt)}
                </Text>
              )}
              {shouldWarnInvoiceNumber && (
                <Alert
                  type="warning"
                  showIcon
                  message="El contador no coincide con el número recuperado"
                  description="Ajusta el contador para evitar saltos en la numeración de facturas."
                />
              )}
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Usa estas acciones para corregir el contador <code>counters/lastInvoiceId</code>{' '}
                cuando el consecutivo quede desfasado del número real de la factura.
              </Paragraph>
              <Space wrap align="center">
                <Button onClick={refreshInvoiceCounter} loading={loadingInvoiceCounter}>
                  Refrescar contador
                </Button>
                <Button
                  type="primary"
                  onClick={syncCounterWithInvoiceNumber}
                  loading={updatingInvoiceCounter}
                  disabled={resolvedInvoiceNumber == null}
                >
                  Ajustar al número actual
                </Button>
                <Space align="center">
                  <InputNumber
                    value={customCounterValue}
                    onChange={(value) => setCustomCounterValue(value)}
                    min={0}
                    placeholder="Nuevo valor"
                    style={{ width: 180 }}
                  />
                  <Button
                    onClick={handleManualCounterSave}
                    loading={updatingInvoiceCounter}
                    disabled={
                      customCounterValue === null || customCounterValue === undefined
                    }
                  >
                    Guardar contador
                  </Button>
                </Space>
              </Space>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                También puedes asignar manualmente el número correcto en Invoice V2 e invoices
                y luego sincronizar el contador en un solo paso.
              </Paragraph>
              <Space align="center" wrap>
                <InputNumber
                  value={customInvoiceNumber}
                  onChange={(value) => setCustomInvoiceNumber(value)}
                  min={0}
                  placeholder="Nuevo número de factura"
                  style={{ width: 200 }}
                />
                <Button
                  type="primary"
                  onClick={handleManualInvoiceNumberSave}
                  loading={updatingInvoiceNumber}
                  disabled={
                    customInvoiceNumber === null || customInvoiceNumber === undefined
                  }
                >
                  Actualizar facturas y contador
                </Button>
              </Space>
            </Space>
          </Card>

          {failedOutboxTasks.length > 0 && (
            <Card title="Tareas del outbox con errores">
              <List
                dataSource={failedOutboxTasks}
                renderItem={(task) => (
                  <List.Item key={task.id}>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space>
                        <Text strong>{task.type || 'Tarea desconocida'}</Text>
                        <Tag color="red">{task.status || 'failed'}</Tag>
                      </Space>
                      <Text type="secondary">
                        Intentos: {task.attempts ?? 0} · Última actualización:{' '}
                        {formatDateTime(task.updatedAt)}
                      </Text>
                      {task.lastError ? (
                        <Text type="danger" style={{ whiteSpace: 'pre-wrap' }}>
                          {task.lastError}
                        </Text>
                      ) : (
                        <Text type="secondary">
                          No se registró un motivo de error.
                        </Text>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Card title="Detalles del snapshot">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="NCF">
                {snapshot?.ncf?.code || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tipo NCF">
                {snapshot?.ncf?.type || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cliente">
                {snapshot?.client?.name || 'Sin cliente'}
              </Descriptions.Item>
              <Descriptions.Item label="Creada (Invoice V2)">
                {v2CreatedAtLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha en invoices">
                {canonicalDateLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Due date">
                {snapshot?.dueDate ? formatDateTime(snapshot.dueDate) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Comentario">
                {snapshot?.invoiceComment || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="NCF reservado">
                {snapshot?.ncf?.status || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cuadre previsto">
                {intendedCashCountId || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cuadre registrado">
                {effectiveResolvedCashCountId || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Factura en invoices">
            {!canonicalData ? (
              <Alert
                type="warning"
                showIcon
                message="No encontramos el documento en businesses/{businessId}/invoices."
                description="Utiliza la acción de recuperación para replicar nuevamente la factura."
              />
            ) : (
              <CodeBlock>
                <pre>{JSON.stringify(canonicalData, null, 2)}</pre>
              </CodeBlock>
            )}
          </Card>

          <Card title="Cuadres detectados">
            {linkedCashCounts.length === 0 ? (
              <Text type="secondary">
                No hemos encontrado esta factura en ningún cuadre de caja.
              </Text>
            ) : (
              <List
                dataSource={linkedCashCounts}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space>
                        <Text strong>ID:</Text>
                        <Text>{item.id}</Text>
                        {item.state && (
                          <Tag color={item.state === 'open' ? 'green' : 'default'}>
                            {item.state}
                          </Tag>
                        )}
                      </Space>
                      {item.number && (
                        <Text type="secondary">Número: {item.number}</Text>
                      )}
                      {item.opening?.employee?.name && (
                        <Text type="secondary">
                          Apertura: {item.opening.employee.name}
                        </Text>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="Historial de estados">
            {Array.isArray(statusTimeline) && statusTimeline.length > 0 ? (
              <Timeline>
                {statusTimeline.map((entry, idx) => (
                  <Timeline.Item
                    key={`${entry.status}-${idx}`}
                    color={STATUS_COLORS[entry.status] || 'gray'}
                  >
                    <Space direction="vertical" size={0}>
                      <Text strong>{entry.status}</Text>
                      <Text type="secondary">{formatDateTime(entry?.at)}</Text>
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text type="secondary">Sin historial disponible.</Text>
            )}
          </Card>

          <Card title="Acciones manuales">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {shouldWarnDateMismatch && (
                <Alert
                  type="warning"
                  showIcon
                  message="Fechas diferentes entre Invoice V2 e invoices"
                  description={`Invoice V2: ${v2CreatedAtLabel} · invoices: ${canonicalDateLabel}`}
                />
              )}
              {shouldWarnCashCount && (
                <Alert
                  type="warning"
                  showIcon
                  message="Cuadre de caja no vinculado"
                  description={
                    intendedCashCountId
                      ? `La factura se creó con el cuadre ${intendedCashCountId}, pero actualmente no está registrada allí. Reintenta 'attachToCashCount' para vincularla.`
                      : 'No pudimos identificar el cuadre de caja asociado a esta factura.'
                  }
                />
              )}
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Selecciona las tareas que deseas reprogramar. Todas las operaciones son
                idempotentes y quedan registradas en el auditor de la factura.
              </Paragraph>

              <Checkbox.Group
                value={selectedTasks}
                onChange={(value) => setSelectedTasks(value)}
              >
                <Space direction="vertical">
                  {availableTaskKeys.map((key) => {
                    const label = TASK_DESCRIPTIONS[key];
                    if (!label) return null;
                    const isDisabled =
                      key === ATTACH_TO_CASH_COUNT_TASK && isCashCountLinked;
                    return (
                      <Checkbox key={key} value={key} disabled={isDisabled}>
                        <Space direction="vertical" size={0}>
                          <Text strong>{key}</Text>
                          <Text type="secondary">{label}</Text>
                          {isDisabled && (
                            <Text type="secondary">Ya está registrada en un cuadre.</Text>
                          )}
                        </Space>
                      </Checkbox>
                    );
                  })}
                </Space>
              </Checkbox.Group>

              <Input.TextArea
                value={reason}
                rows={2}
                maxLength={280}
                placeholder="Motivo (opcional, visible en el historial)"
                onChange={(event) => setReason(event.target.value)}
              />

              <Space wrap>
                <Button
                  type="primary"
                  loading={repairing}
                  onClick={handleRepair}
                  disabled={!selectedTasks.length}
                >
                  Reintentar tareas seleccionadas
                </Button>
                <Button
                  onClick={() => handleFetch(activeQuery)}
                  disabled={loading || !activeQuery}
                >
                  Refrescar estado
                </Button>
                <Button
                  type="dashed"
                  loading={repairing}
                  onClick={handleSingleAutoRecovery}
                  disabled={!availableAutoRecoveryTasks.length || repairing}
                >
                  Recrear factura y cuenta por cobrar
                </Button>
              </Space>

              {repairResult && (
                <Alert
                  type="info"
                  showIcon
                  message="Resultado de reprogramación"
                  description={
                    <ul>
                      {repairResult.results?.map((item) => (
                        <li key={`${item.type}-${item.taskId || item.status}`}>
                          <Text strong>{item.type}</Text>: {item.status}
                          {item.reason ? ` - ${item.reason}` : ''}
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}
            </Space>
          </Card>
        </Space>
      )}
    </Space>
  );
};

IndividualRecoveryTab.propTypes = {
  form: PropTypes.object.isRequired,
  watchedBusinessId: PropTypes.string,
  businessOptions: PropTypes.array.isRequired,
  loadingBusinesses: PropTypes.bool.isRequired,
  invoiceOptions: PropTypes.array.isRequired,
  loadingInvoices: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
  showEmptyState: PropTypes.bool.isRequired,
  handleFetch: PropTypes.func.isRequired,
  activeQuery: PropTypes.object,
  invoiceData: PropTypes.object,
  summary: PropTypes.object.isRequired,
  canonicalData: PropTypes.object,
  failedOutboxTasks: PropTypes.array.isRequired,
  resolvedInvoiceId: PropTypes.string,
  snapshot: PropTypes.object.isRequired,
  v2CreatedAtLabel: PropTypes.string.isRequired,
  canonicalDateLabel: PropTypes.string.isRequired,
  shouldWarnDateMismatch: PropTypes.bool.isRequired,
  shouldWarnCashCount: PropTypes.bool.isRequired,
  selectedTasks: PropTypes.array.isRequired,
  setSelectedTasks: PropTypes.func.isRequired,
  reason: PropTypes.string.isRequired,
  setReason: PropTypes.func.isRequired,
  handleRepair: PropTypes.func.isRequired,
  repairing: PropTypes.bool.isRequired,
  availableTaskKeys: PropTypes.array.isRequired,
  availableAutoRecoveryTasks: PropTypes.array.isRequired,
  handleSingleAutoRecovery: PropTypes.func.isRequired,
  repairResult: PropTypes.object,
  linkedCashCounts: PropTypes.array.isRequired,
  intendedCashCountId: PropTypes.string,
  effectiveResolvedCashCountId: PropTypes.string,
  isCashCountLinked: PropTypes.bool.isRequired,
  statusTimeline: PropTypes.array.isRequired,
  resolvedInvoiceNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  canonicalInvoiceNumber: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  invoiceCounterValue: PropTypes.number,
  invoiceCounterUpdatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  loadingInvoiceCounter: PropTypes.bool.isRequired,
  updatingInvoiceCounter: PropTypes.bool.isRequired,
  refreshInvoiceCounter: PropTypes.func.isRequired,
  syncCounterWithInvoiceNumber: PropTypes.func.isRequired,
  updateInvoiceCounter: PropTypes.func.isRequired,
  shouldWarnInvoiceNumber: PropTypes.bool.isRequired,
  updateInvoiceNumberEverywhere: PropTypes.func.isRequired,
  updatingInvoiceNumber: PropTypes.bool.isRequired,
};

IndividualRecoveryTab.defaultProps = {
  watchedBusinessId: undefined,
  errorMessage: null,
  activeQuery: null,
  invoiceData: null,
  canonicalData: null,
  resolvedInvoiceId: null,
  repairResult: null,
  intendedCashCountId: null,
  effectiveResolvedCashCountId: null,
  resolvedInvoiceNumber: null,
  canonicalInvoiceNumber: null,
  invoiceCounterValue: null,
  invoiceCounterUpdatedAt: null,
};
