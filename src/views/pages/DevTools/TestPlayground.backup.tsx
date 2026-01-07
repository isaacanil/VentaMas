// @ts-nocheck
import {
  Alert,
  Button,
  Input,
  Space,
  Switch,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { fbNormalizeAllBusinessesClients } from '@/firebase/client/fbNormalizeAllBusinessesClients';
import {
  fbFixExpenseTimestamps,
  fbFixExpenseTimestampsForAll,
} from '@/firebase/expenses/maintenance/fbFixExpenseTimestamps';
import { fbFixMissingProductIds } from '@/firebase/products/fbFixMissingProductIds';
import { normalizeAllBusinessesProductTaxes } from '@/firebase/products/fbNormalizeAllBusinessesProductTaxes';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import SessionTokensCleanup from './test/pages/sessionTokensCleanup/SessionTokensCleanup';

const { Title, Paragraph, Text } = Typography;

/**
 * Contenedor simple para agrupar herramientas o experimentos temporales.
 * Mantiene la ruta `/prueba` disponible para ensayos manuales.
 */
export default function TestPlaygroundBackup() {
  const [normalizing, setNormalizing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [clientNormalizationState, setClientNormalizationState] = useState({
    running: false,
    progress: null,
    result: null,
  });
  const [productIdFixState, setProductIdFixState] = useState({
    businessId: '',
    running: false,
    result: null,
  });
  const [expenseTimestampFixState, setExpenseTimestampFixState] = useState({
    businessId: '',
    running: false,
    result: null,
  });
  const [applyToAllBusinesses, setApplyToAllBusinesses] = useState(false);

  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.businessID) return;

    setProductIdFixState((prev) =>
      prev.businessId
        ? prev
        : {
            ...prev,
            businessId: user.businessID,
          },
    );

    setExpenseTimestampFixState((prev) =>
      prev.businessId
        ? prev
        : {
            ...prev,
            businessId: user.businessID,
          },
    );
  }, [user?.businessID]);

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
      message.error(
        'No se pudo normalizar el impuesto. Revisa la consola para detalles.',
      );
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
      message.error(
        'No se pudo normalizar los clientes. Revisa la consola para detalles.',
      );
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
      0,
    );
    const clientsTotal = successSummaries.reduce(
      (acc, item) => acc + (item.summary?.total || 0),
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
        message="Clientes normalizados"
        description={`Negocios procesados: ${successSummaries.length}/${data.totalBusinesses}. Clientes revisados: ${clientsTotal}. Clientes ajustados: ${clientsNormalized}.${errorDetail}`}
      />
    );
  };

  const handleFixProductIds = async () => {
    const businessId = productIdFixState.businessId?.trim();
    if (!businessId) {
      message.warning('Ingresa un businessID válido.');
      return;
    }
    if (productIdFixState.running) return;

    setProductIdFixState((prev) => ({
      ...prev,
      running: true,
      result: null,
    }));

    try {
      const response = await fbFixMissingProductIds({ businessID: businessId });
      setProductIdFixState({
        businessId,
        running: false,
        result: { success: true, data: response },
      });
      message.success(
        `Productos actualizados: ${response.updated}/${response.total}.`,
      );
    } catch (error) {
      console.error('Error al corregir IDs de productos:', error);
      setProductIdFixState({
        businessId,
        running: false,
        result: {
          success: false,
          error: error?.message || 'Ocurrió un error inesperado.',
        },
      });
      message.error('No se pudo corregir los IDs de productos.');
    }
  };

  const renderProductFixResult = () => {
    const { result } = productIdFixState;
    if (!result) return null;

    if (!result.success) {
      return (
        <Alert
          type="error"
          showIcon
          message="No se pudo corregir los IDs de productos"
          description={result.error}
        />
      );
    }

    const { total, updated } = result.data;
    return (
      <Alert
        type="success"
        showIcon
        message="Corrección completada"
        description={`Documentos revisados: ${total}. Documentos actualizados: ${updated}.`}
      />
    );
  };

  const handleBusinessIdChange = (event) => {
    const { value } = event.target;
    setProductIdFixState((prev) => ({
      ...prev,
      businessId: value,
    }));
  };

  const handleExpenseTimestampBusinessChange = (event) => {
    const { value } = event.target;
    setExpenseTimestampFixState((prev) => ({
      ...prev,
      businessId: value,
    }));
  };

  const handleExpenseTimestampFix = async (dryRun) => {
    const businessId = expenseTimestampFixState.businessId?.trim();
    if (!applyToAllBusinesses && !businessId) {
      message.warning('Ingresa un businessID válido.');
      return;
    }
    if (expenseTimestampFixState.running) return;

    setExpenseTimestampFixState((prev) => ({
      ...prev,
      running: true,
      result: null,
    }));

    const isGlobal = applyToAllBusinesses;

    try {
      const response = isGlobal
        ? await fbFixExpenseTimestampsForAll({ dryRun })
        : await fbFixExpenseTimestamps({ businessID: businessId, dryRun });

      setExpenseTimestampFixState({
        businessId,
        running: false,
        result: {
          success: true,
          dryRun,
          mode: isGlobal ? 'all' : 'single',
          data: response,
        },
      });

      const successMessage = dryRun
        ? isGlobal
          ? 'Análisis global completado. Revisa los resultados antes de aplicar cambios.'
          : 'Análisis completado. Revisa los resultados antes de aplicar cambios.'
        : isGlobal
          ? 'Conversión global completada. Todos los gastos ahora usan Firebase Timestamp.'
          : 'Conversión completada. Los gastos ahora usan Firebase Timestamp.';

      message.success(successMessage);
    } catch (error) {
      console.error('Error al normalizar fechas de gastos:', error);
      setExpenseTimestampFixState((prev) => ({
        ...prev,
        running: false,
        result: {
          success: false,
          error: error?.message || 'Ocurrió un error inesperado.',
        },
      }));
      message.error('No se pudo normalizar las fechas de los gastos.');
    }
  };

  const renderExpenseTimestampResult = () => {
    const { result } = expenseTimestampFixState;
    if (!result) return null;

    if (!result.success) {
      return (
        <Alert
          type="error"
          showIcon
          message="No se pudo normalizar las fechas de los gastos"
          description={result.error}
        />
      );
    }

    const { data, dryRun, mode = 'single' } = result;

    if (mode === 'all') {
      const totals = data.totals ?? {};
      const successSummaries =
        data.summaries?.filter((item) => item.success) ?? [];
      const errorSummaries =
        data.summaries?.filter((item) => !item.success) ?? [];

      const sampleEntries = successSummaries
        .flatMap((item) =>
          (item.summary?.sample ?? []).map(
            (sample) =>
              `${item.businessID}/${sample.id} (${sample.fields.join(', ')})`,
          ),
        )
        .slice(0, 3);

      const summaryText = `Negocios procesados: ${data.processed}/${data.totalBusinesses}. Documentos evaluados: ${totals.scanned}. Con incidencias: ${totals.affected}. ${
        dryRun
          ? 'No se aplicaron cambios.'
          : `Documentos actualizados: ${totals.updated}.`
      } Campos convertidos: ${totals.fieldsConverted}.`;

      const errorsText = errorSummaries.length
        ? ` Con errores en ${errorSummaries.length} negocios: ${errorSummaries
            .slice(0, 5)
            .map((item) => item.businessID)
            .join(', ')}${errorSummaries.length > 5 ? '…' : ''}.`
        : '';

      const sampleText = sampleEntries.length
        ? ` Ejemplos: ${sampleEntries.join(' · ')}.`
        : '';

      return (
        <Alert
          type={dryRun ? 'info' : 'success'}
          showIcon
          message={
            dryRun
              ? 'Análisis global completado'
              : 'Conversión global completada'
          }
          description={`${summaryText}${errorsText}${sampleText}`}
        />
      );
    }

    const summaryText = `Documentos evaluados: ${data.scanned}. Con incidencias: ${data.affected}. ${
      dryRun
        ? 'No se aplicaron cambios.'
        : `Documentos actualizados: ${data.updated}.`
    } Campos convertidos: ${data.fieldsConverted}.`;

    const sampleText =
      data.sample?.length > 0
        ? ` Ejemplos: ${data.sample
            .map((item) => `${item.id} (${item.fields.join(', ')})`)
            .join(' · ')}`
        : '';

    return (
      <Alert
        type={dryRun ? 'info' : 'success'}
        showIcon
        message={dryRun ? 'Análisis completado' : 'Conversión completada'}
        description={`${summaryText}${sampleText}`}
      />
    );
  };

  const maintenanceToolsPanel = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space size="middle" wrap>
        <Button
          type="primary"
          onClick={handleNormalizeTaxes}
          loading={normalizing}
        >
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
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>Corregir campo `id` en productos</Text>
        <Space size="middle" wrap>
          <Input
            placeholder="businessID"
            value={productIdFixState.businessId}
            onChange={handleBusinessIdChange}
            style={{ minWidth: 260 }}
          />
          <Button
            onClick={handleFixProductIds}
            loading={productIdFixState.running}
          >
            Asignar IDs faltantes
          </Button>
        </Space>
        {renderProductFixResult()}
      </Space>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>Normalizar timestamps de gastos</Text>
        <Space size="middle" wrap>
          <Input
            placeholder="businessID"
            value={expenseTimestampFixState.businessId}
            onChange={handleExpenseTimestampBusinessChange}
            disabled={applyToAllBusinesses}
            style={{ minWidth: 260 }}
          />
          <Switch
            checked={applyToAllBusinesses}
            onChange={setApplyToAllBusinesses}
            checkedChildren="Todos los negocios"
            unCheckedChildren="Solo este negocio"
          />
          <Button
            onClick={() => handleExpenseTimestampFix(true)}
            loading={expenseTimestampFixState.running}
          >
            Detectar inconsistencias
          </Button>
          <Button
            type="primary"
            onClick={() => handleExpenseTimestampFix(false)}
            loading={expenseTimestampFixState.running}
          >
            Convertir a Timestamp real
          </Button>
        </Space>
        {renderExpenseTimestampResult()}
      </Space>
    </Space>
  );

  const tabItems = [
    {
      key: 'maintenance-tools',
      label: 'Herramientas de normalización',
      children: maintenanceToolsPanel,
    },
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
          Usa este espacio para validar integraciones, componentes o flujos en
          desarrollo. Los accesos visibles aquí son temporales y pueden cambiar
          sin previo aviso.
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="Recomendación"
          description={
            <Text>
              Registra brevemente los objetivos de la prueba y elimina cualquier
              estado temporal una vez concluido para evitar confusiones en el
              equipo.
            </Text>
          }
          style={{ marginBottom: 24 }}
        />
        <Tabs
          defaultActiveKey="maintenance-tools"
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </div>
    </>
  );
}
