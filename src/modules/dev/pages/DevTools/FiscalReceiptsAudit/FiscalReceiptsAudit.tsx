import {
  Alert,
  Button,
  Empty,
  List,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import React from 'react';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { PRESETS, getRangeFromPreset } from './utils/presets';
import { runFiscalReceiptsAudit } from './utils/runFiscalReceiptsAudit';
import { runFiscalReceiptsAuditExport } from './utils/runFiscalReceiptsAuditExport';

import type {
  AuditIssue,
  BusinessAuditResult,
  DateRange,
  ExportingBusiness,
} from './types';

type FiscalReceiptsAuditState = {
  processing: boolean;
  exporting: boolean;
  progressTotal: number;
  progressDone: number;
  currentBusiness: string | null;
  exportingBusiness: ExportingBusiness | null;
  selectedPreset: string;
  results: BusinessAuditResult[];
  errors: AuditIssue[];
};

type FiscalReceiptsAuditAction =
  | { type: 'set-selected-preset'; value: string }
  | { type: 'start-analysis' }
  | {
      type: 'set-progress';
      progressTotal?: number;
      progressDone?: number;
      currentBusiness?: string | null;
    }
  | {
      type: 'finish-analysis';
      results: BusinessAuditResult[];
      errors: AuditIssue[];
    }
  | { type: 'fail-analysis'; error: AuditIssue }
  | { type: 'start-export'; business: ExportingBusiness }
  | { type: 'finish-export' };

const initialFiscalReceiptsAuditState: FiscalReceiptsAuditState = {
  processing: false,
  exporting: false,
  progressTotal: 0,
  progressDone: 0,
  currentBusiness: null,
  exportingBusiness: null,
  selectedPreset: 'last_90_days',
  results: [],
  errors: [],
};

const fiscalReceiptsAuditReducer = (
  state: FiscalReceiptsAuditState,
  action: FiscalReceiptsAuditAction,
): FiscalReceiptsAuditState => {
  switch (action.type) {
    case 'set-selected-preset':
      return { ...state, selectedPreset: action.value };
    case 'start-analysis':
      return {
        ...state,
        processing: true,
        progressTotal: 0,
        progressDone: 0,
        currentBusiness: null,
        results: [],
        errors: [],
      };
    case 'set-progress':
      return {
        ...state,
        ...(typeof action.progressTotal === 'number'
          ? { progressTotal: action.progressTotal }
          : {}),
        ...(typeof action.progressDone === 'number'
          ? { progressDone: action.progressDone }
          : {}),
        ...(Object.hasOwn(action, 'currentBusiness')
          ? { currentBusiness: action.currentBusiness ?? null }
          : {}),
      };
    case 'finish-analysis':
      return {
        ...state,
        processing: false,
        currentBusiness: null,
        results: action.results,
        errors: action.errors,
      };
    case 'fail-analysis':
      return {
        ...state,
        processing: false,
        currentBusiness: null,
        results: [],
        errors: [action.error],
      };
    case 'start-export':
      return {
        ...state,
        exporting: true,
        exportingBusiness: action.business,
      };
    case 'finish-export':
      return {
        ...state,
        exporting: false,
        exportingBusiness: null,
      };
    default:
      return state;
  }
};

export const FiscalReceiptsAudit: React.FC = () => {
  const [state, dispatch] = React.useReducer(
    fiscalReceiptsAuditReducer,
    initialFiscalReceiptsAuditState,
  );
  const {
    processing,
    exporting,
    progressTotal,
    progressDone,
    currentBusiness,
    exportingBusiness,
    selectedPreset,
    results,
    errors,
  } = state;
  const businessesWithDuplicates = results.filter(
    (item) => item.duplicates && item.duplicates.length > 0,
  );

  const handleAnalyze = async () => {
    const { start, end } = getRangeFromPreset(selectedPreset) as DateRange;
    if (start && end && end.isBefore(start)) {
      message.warning('El rango de fechas no es válido.');
      return;
    }

    dispatch({ type: 'start-analysis' });

    const startDate = start ? start.toDate() : null;
    const endDate = end ? end.toDate() : null;
    const result = await runFiscalReceiptsAudit({
      startDate,
      endDate,
      onProgress: (update) => {
        dispatch({ type: 'set-progress', ...update });
      },
    });

    if (result.status === 'error') {
      message.error('Ocurrió un error al generar el análisis.');
      dispatch({ type: 'fail-analysis', error: result.error });
      return;
    }

    const { results: aggregated, issues } = result;
    if (!aggregated.length && !issues.length) {
      message.info(
        'No se encontraron negocios con comprobante habilitado en el rango seleccionado.',
      );
    }

    if (issues.length) {
      message.warning(
        `Algunos negocios no se pudieron analizar (${issues.length}). Revisa los avisos.`,
      );
    }

    if (!aggregated.length) {
      message.info('No se encontraron negocios para analizar.');
    }

    dispatch({ type: 'finish-analysis', results: aggregated, errors: issues });
  };

  const handleExportBusiness = async (businessResult: BusinessAuditResult) => {
    if (!businessResult?.duplicates?.length) {
      message.info(
        'Este negocio no tiene comprobantes duplicados para exportar.',
      );
      return;
    }

    const { start, end } = getRangeFromPreset(selectedPreset) as DateRange;
    const startDate = start ? start.toDate() : null;
    const endDate = end ? end.toDate() : null;

    dispatch({
      type: 'start-export',
      business: {
        id: businessResult.businessId,
        name: businessResult.businessName,
      },
    });

    const result = await runFiscalReceiptsAuditExport({
      businessResult,
      startDate,
      endDate,
    });

    dispatch({ type: 'finish-export' });

    if (result.status === 'error') {
      message.error(result.errorMessage);
      return;
    }

    message.success(`Reporte exportado para ${businessResult.businessName}.`);
  };

  return (
    <>
      <MenuApp sectionName="Análisis comprobantes f..." />
      <div style={{ padding: 24 }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Analisis de comprobantes fiscales
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Ejecuta una revision de comprobantes en todos los negocios con la
          configuracion activa para detectar cambios de longitud y duplicados.
        </Typography.Paragraph>

        <Space size="small" wrap style={{ marginBottom: 16 }}>
          <Select
            value={selectedPreset}
            onChange={(value) =>
              dispatch({ type: 'set-selected-preset', value })
            }
            options={PRESETS}
            style={{ minWidth: 280 }}
            disabled={processing}
          />
          <Button type="primary" onClick={handleAnalyze} loading={processing}>
            Analizar
          </Button>
        </Space>

        {errors.map((error) => (
          <Alert
            key={`${error.businessId}-${error.businessName}`}
            type="warning"
            showIcon
            message={`No se pudo analizar ${error.businessName}`}
            description={error.message}
            style={{ marginBottom: 12 }}
          />
        ))}

        {processing && (
          <div style={{ marginTop: 16 }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>
                  Analizando comprobantes...
                </Typography.Text>
                {currentBusiness ? (
                  <Typography.Text style={{ marginLeft: 8 }} type="secondary">
                    {currentBusiness}
                  </Typography.Text>
                ) : null}
              </div>
              <Progress
                percent={
                  progressTotal
                    ? Math.round((progressDone / progressTotal) * 100)
                    : 0
                }
                status="active"
              />
            </Space>
          </div>
        )}

        {!processing && !results.length && (
          <Empty description="Ejecuta el analisis para ver resultados." />
        )}

        {!processing &&
          results.length > 0 &&
          !businessesWithDuplicates.length && (
            <Empty description="No se detectaron negocios con comprobantes duplicados en el rango seleccionado." />
          )}

        {exporting && (
          <Alert
            type="info"
            showIcon
            style={{ margin: '16px 0' }}
            message={
              exportingBusiness ? (
                <span>
                  Exportando reporte de{' '}
                  <strong>{exportingBusiness.name}</strong>...
                </span>
              ) : (
                'Generando reporte...'
              )
            }
          />
        )}

        {!processing && businessesWithDuplicates.length > 0 && (
          <List
            itemLayout="horizontal"
            dataSource={businessesWithDuplicates}
            renderItem={(result) => {
              const isExportingThis =
                exporting && exportingBusiness?.id === result.businessId;
              return (
                <List.Item
                  key={result.businessId}
                  actions={[
                    <Button
                      key="export"
                      type="primary"
                      onClick={() => handleExportBusiness(result)}
                      loading={isExportingThis}
                      disabled={exporting && !isExportingThis}
                    >
                      Exportar reporte
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space size={8} wrap>
                        <Typography.Text strong>
                          {result.businessName}
                        </Typography.Text>
                        <Tag>{result.businessId}</Tag>
                      </Space>
                    }
                    description={
                      <Space size={8} wrap>
                        <Tag color="red">{`${result.duplicates.length} NCF duplicados`}</Tag>
                        {result.duplicatesNormalized &&
                        result.duplicatesNormalized.length ? (
                          <Tag color="volcano">{`${result.duplicatesNormalized.length} claves normalizadas`}</Tag>
                        ) : null}
                        <Typography.Text type="secondary">
                          {`${result.invoicesWithNcf} comprobantes con NCF analizados`}
                        </Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </>
  );
};

export default FiscalReceiptsAudit;
