import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Space,
  Switch,
  Typography,
} from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

const { Paragraph, Text } = Typography;

export const BulkRecoveryTab = ({
  bulkOptions,
  bulkResult,
  bulkLoading,
  updateBulkOption,
  setBulkResult,
  handleBulkAutoRecovery,
}) => {
  const businessesWithRepairs = Array.isArray(bulkResult?.businesses)
    ? bulkResult.businesses.filter(
        (business) => Array.isArray(business.repairs) && business.repairs.length > 0,
      )
    : [];
  const canExportRepairs = businessesWithRepairs.length > 0;

  const handleExportRepairs = () => {
    if (!canExportRepairs) {
      return;
    }

    const formatValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = [
      [
        'businessId',
        'invoiceId',
        'needsCanonical',
        'needsReceivable',
        'tasks',
        'status',
        'nextInvoiceCursor',
      ],
    ];

    businessesWithRepairs.forEach((business) => {
      const summaryCursor = business.nextInvoiceCursor || '';
      (business.repairs || []).forEach((repair) => {
        rows.push([
          business.businessId,
          repair.invoiceId,
          repair.needsCanonical ? 'Sí' : 'No',
          repair.needsReceivable ? 'Sí' : 'No',
          (repair.tasks || []).join(' | '),
          repair.status || 'pending',
          summaryCursor,
        ]);
      });
    });

    const csvContent = rows.map((row) => row.map(formatValue).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `reparaciones-invoice-v2-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card title="Recuperación automática masiva">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          El sistema evaluará facturas recientes en busca de discrepancias y reprogramará
          únicamente las tareas necesarias (crear factura canonical o cuenta por cobrar).
        </Paragraph>
        <Space align="center">
          <Text strong>Procesar todos los negocios</Text>
          <Switch
            checked={bulkOptions.runForAllBusinesses}
            onChange={(checked) => updateBulkOption('runForAllBusinesses', checked)}
          />
        </Space>
        {!bulkOptions.runForAllBusinesses && (
          <Alert
            type="info"
            showIcon
            message="Se usará el businessId seleccionado en el formulario"
            description="Opcional: define startAfterInvoiceId para continuar desde una factura específica."
          />
        )}
        {bulkOptions.runForAllBusinesses && (
          <Alert
            type="info"
            showIcon
            message="Modo multi-negocio activo"
            description="Se recorrerán todos los negocios disponibles por lotes. Usa startAfterBusinessId si necesitas continuar desde un punto específico."
          />
        )}
        <Text type="secondary">
          {bulkOptions.runForAllBusinesses
            ? 'El sistema recorrerá automáticamente todos los negocios autorizados en lotes internos hasta que no existan pendientes.'
            : 'Se revisarán todas las facturas necesarias para el negocio seleccionado, avanzando automáticamente con los cursores.'}
        </Text>
        {bulkOptions.runForAllBusinesses ? (
          <Input
            allowClear
            placeholder="startAfterBusinessId (opcional)"
            value={bulkOptions.startAfterBusinessId}
            onChange={(event) =>
              updateBulkOption('startAfterBusinessId', event.target.value)
            }
          />
        ) : (
          <Input
            allowClear
            placeholder="startAfterInvoiceId (opcional)"
            value={bulkOptions.startAfterInvoiceId}
            onChange={(event) =>
              updateBulkOption('startAfterInvoiceId', event.target.value)
            }
          />
        )}
        <Checkbox
          checked={bulkOptions.dryRun}
          onChange={(event) => updateBulkOption('dryRun', event.target.checked)}
        >
          Solo simular (no reprograma tareas)
        </Checkbox>
        <Space wrap>
          <Button type="primary" loading={bulkLoading} onClick={handleBulkAutoRecovery}>
            Ejecutar recuperación automática
          </Button>
          <Button
            onClick={() => setBulkResult(null)}
            disabled={!bulkResult || bulkLoading}
          >
            Limpiar resultado
          </Button>
          {bulkResult && (
            <Button
              onClick={handleExportRepairs}
              disabled={!canExportRepairs || bulkLoading}
            >
              Descargar Excel de reparaciones
            </Button>
          )}
        </Space>
        {bulkResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              type={bulkResult.metrics?.invoicesWithIssues ? 'warning' : 'success'}
              showIcon
              message={
                bulkOptions.dryRun ? 'Análisis completado' : 'Recuperación ejecutada'
              }
              description={`Negocios procesados: ${
                bulkResult.metrics?.businessesProcessed ?? 0
              } · Facturas revisadas: ${
                bulkResult.metrics?.invoicesScanned ?? 0
              } · Pendientes detectados: ${
                bulkResult.metrics?.invoicesWithIssues ?? 0
              }`}
            />
            <Text type="secondary">
              Descarga el Excel para ver el detalle de cada negocio y factura pendiente.
            </Text>
            {bulkResult.nextPage?.startAfterBusinessId && (
              <Alert
                type="info"
                showIcon
                message="Hay más negocios para procesar"
                description={`Continúa desde ${bulkResult.nextPage.startAfterBusinessId} ajustando startAfterBusinessId.`}
              />
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
};

BulkRecoveryTab.propTypes = {
  bulkOptions: PropTypes.shape({
    runForAllBusinesses: PropTypes.bool.isRequired,
    dryRun: PropTypes.bool.isRequired,
    startAfterBusinessId: PropTypes.string.isRequired,
    startAfterInvoiceId: PropTypes.string.isRequired,
  }).isRequired,
  bulkResult: PropTypes.object,
  bulkLoading: PropTypes.bool.isRequired,
  updateBulkOption: PropTypes.func.isRequired,
  setBulkResult: PropTypes.func.isRequired,
  handleBulkAutoRecovery: PropTypes.func.isRequired,
};

BulkRecoveryTab.defaultProps = {
  bulkResult: null,
};
