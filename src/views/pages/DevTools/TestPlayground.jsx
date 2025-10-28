import { useState } from 'react';

import { Alert, Button, Space, Tabs, Typography, message } from 'antd';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import SessionTokensCleanup from './test/pages/sessionTokensCleanup/SessionTokensCleanup';
import { normalizeAllBusinessesProductTaxes } from '../../../firebase/products/fbNormalizeAllBusinessesProductTaxes';
import { fbNormalizeAllBusinessesClients } from '../../../firebase/client/fbNormalizeAllBusinessesClients';

const { Title, Paragraph, Text } = Typography;

/**
 * Contenedor simple para agrupar herramientas o experimentos temporales.
 * Mantiene la ruta `/prueba` disponible para ensayos manuales.
 */
export default function TestPlayground() {
  const [normalizing, setNormalizing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [clientNormalizationState, setClientNormalizationState] = useState({
    running: false,
    progress: null,
    result: null,
  });

  const handleNormalizeTaxes = async () => {
    if (normalizing) return;
    setNormalizing(true);
    setProgress(null);
    setResult(null);
    try {
      const response = await normalizeAllBusinessesProductTaxes({
        onProgress: ({ processed, total, businessID }) => {
          setProgress({ processed, total, businessID });
        },
      });
      setResult({ success: true, data: response });
      message.success('Normalización completada.');
    } catch (error) {
      console.error('Error al normalizar impuestos:', error);
      setResult({
        success: false,
        error: error?.message || 'Ocurrió un error inesperado.',
      });
      message.error('No se pudo normalizar el impuesto. Revisa la consola para detalles.');
    } finally {
      setNormalizing(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    if (!result.success) {
      return (
        <Alert
          type="error"
          showIcon
          message="No se pudo completar la normalización"
          description={result.error}
        />
      );
    }

    const { data } = result;
    const successSummaries = data.summaries.filter((item) => item.success);
    const failedSummaries = data.summaries.filter((item) => !item.success);
    const productsUpdated = successSummaries.reduce(
      (acc, item) => acc + (item.summary?.productsUpdated || 0),
      0,
    );
    const saleUnitsUpdated = successSummaries.reduce(
      (acc, item) => acc + (item.summary?.saleUnitsUpdated || 0),
      0,
    );
    const selectedUnitsUpdated = successSummaries.reduce(
      (acc, item) => acc + (item.summary?.selectedUnitUpdated || 0),
      0,
    );

    const errorDetail =
      failedSummaries.length > 0
        ? ` Falló en ${failedSummaries.length} negocios: ${failedSummaries
            .slice(0, 5)
            .map((item) => item.businessID)
            .join(', ')}${failedSummaries.length > 5 ? '…' : ''}`
        : '';

    return (
      <Alert
        type="success"
        showIcon
        message="Normalización completada"
        description={`Negocios procesados: ${data.processed}/${data.totalBusinesses}. Productos ajustados: ${productsUpdated}. Unidades de venta ajustadas: ${saleUnitsUpdated}. Unidades seleccionadas ajustadas: ${selectedUnitsUpdated}.${errorDetail}`}
      />
    );
  };

  const handleNormalizeClients = async () => {
    if (clientNormalizationState.running) return;

    setClientNormalizationState({
      running: true,
      progress: null,
      result: null,
    });

    try {
      const response = await fbNormalizeAllBusinessesClients({
        onProgress: ({ processed, total, businessID, summary }) => {
          setClientNormalizationState((prev) => ({
            ...prev,
            progress: {
              processed,
              total,
              businessID,
              normalized: summary?.normalized ?? null,
            },
          }));
        },
      });

      setClientNormalizationState({
        running: false,
        progress: null,
        result: { success: true, data: response },
      });
      message.success('Normalización de clientes completada.');
    } catch (error) {
      console.error('Error al normalizar clientes:', error);
      setClientNormalizationState({
        running: false,
        progress: null,
        result: {
          success: false,
          error: error?.message || 'Ocurrió un error inesperado.',
        },
      });
      message.error('No se pudo normalizar los clientes. Revisa la consola para detalles.');
    }
  };

  const renderClientNormalizationResult = () => {
    const { result } = clientNormalizationState;
    if (!result) return null;

    if (!result.success) {
      return (
        <Alert
          type="error"
          showIcon
          message="No se pudo completar la normalización de clientes"
          description={result.error}
        />
      );
    }

    const { data } = result;
    const successSummaries = data.summaries.filter((item) => item.success);
    const failedSummaries = data.summaries.filter((item) => !item.success);

    const clientsNormalized = successSummaries.reduce(
      (acc, item) => acc + (item.summary?.normalized || 0),
      0
    );
    const clientsTotal = successSummaries.reduce(
      (acc, item) => acc + (item.summary?.total || 0),
      0
    );

    const errorDetail =
      failedSummaries.length > 0
        ? ` Falló en ${failedSummaries.length} negocios: ${failedSummaries
            .slice(0, 5)
            .map((item) => item.businessID)
            .join(', ')}${failedSummaries.length > 5 ? '…' : ''}`
        : '';

    return (
      <Alert
        type="success"
        showIcon
        message="Clientes normalizados"
        description={`Negocios procesados: ${successSummaries.length}/${data.totalBusinesses}. Clientes revisados: ${clientsTotal}. Clientes ajustados: ${clientsNormalized}.${errorDetail}`}
      />
    );
  };

  const tabItems = [
    {
      key: 'session-token-cleanup',
      label: 'SessionTokens',
      children: <SessionTokensCleanup />,
    },
  ];

  return (
    <>
      <MenuApp sectionName="Zona de pruebas" />
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          Zona de pruebas
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Usa este espacio para validar integraciones, componentes o flujos en desarrollo.
          Los accesos visibles aquí son temporales y pueden cambiar sin previo aviso.
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="Recomendación"
          description={
            <Text>
              Registra brevemente los objetivos de la prueba y elimina cualquier estado temporal una vez
              concluido para evitar confusiones en el equipo.
            </Text>
          }
          style={{ marginBottom: 24 }}
        />
        <Space
          direction="vertical"
          size="middle"
          style={{ marginBottom: 24, width: '100%' }}
        >
          <Space size="middle" wrap>
            <Button type="primary" onClick={handleNormalizeTaxes} loading={normalizing}>
              Normalizar ITBIS para todos los negocios
            </Button>
            {progress && (
              <Text type="secondary">
                Procesando negocio {progress.processed}/{progress.total}
                {progress.businessID ? ` · Último: ${progress.businessID}` : ''}
              </Text>
            )}
          </Space>
          {renderResult()}
          <Space size="middle" wrap>
            <Button
              onClick={handleNormalizeClients}
              loading={clientNormalizationState.running}
            >
              Normalizar clientes (estructura/pendingBalance)
            </Button>
            {clientNormalizationState.progress && (
              <Text type="secondary">
                Procesando negocio {clientNormalizationState.progress.processed}/
                {clientNormalizationState.progress.total}
                {clientNormalizationState.progress.businessID
                  ? ` · Último: ${clientNormalizationState.progress.businessID}`
                  : ''}
                {clientNormalizationState.progress.normalized !== null
                  ? ` · Ajustados: ${clientNormalizationState.progress.normalized}`
                  : ''}
              </Text>
            )}
          </Space>
          {renderClientNormalizationResult()}
        </Space>
        <Tabs defaultActiveKey="session-token-cleanup" items={tabItems} destroyInactiveTabPane={false} />
      </div>
    </>
  );
}
