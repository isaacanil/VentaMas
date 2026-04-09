import { Alert } from 'antd';

import type {
  ClientNormalizationResult,
  ExpenseFixAllResult,
  ExpenseFixResult,
  ExpenseFixSummary,
  FixProductIdResult,
  TaxNormalizationResult,
} from '../types';

interface TaxNormalizationResultAlertProps {
  result:
    | { success: true; data: TaxNormalizationResult }
    | { success: false; error: string }
    | null;
}

export const TaxNormalizationResultAlert = ({
  result,
}: TaxNormalizationResultAlertProps) => {
  if (!result) return null;

  if (!result.success) {
    return (
      <Alert
        type="error"
        showIcon
        message="No se pudo completar la normalizacion"
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
      ? ` Fallo en ${failedSummaries.length} negocios: ${failedSummaries
          .slice(0, 5)
          .map((item) => item.businessID)
          .join(', ')}${failedSummaries.length > 5 ? '…' : ''}`
      : '';

  return (
    <Alert
      type="success"
      showIcon
      message="Normalizacion completada"
      description={`Negocios procesados: ${data.processed}/${data.totalBusinesses}. Productos ajustados: ${productsUpdated}. Unidades de venta ajustadas: ${saleUnitsUpdated}. Unidades seleccionadas ajustadas: ${selectedUnitsUpdated}.${errorDetail}`}
    />
  );
};

interface ClientNormalizationResultAlertProps {
  result:
    | { success: true; data: ClientNormalizationResult }
    | { success: false; error: string }
    | null;
}

export const ClientNormalizationResultAlert = ({
  result,
}: ClientNormalizationResultAlertProps) => {
  if (!result) return null;

  if (!result.success) {
    return (
      <Alert
        type="error"
        showIcon
        message="No se pudo completar la normalizacion de clientes"
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
      ? ` Fallo en ${failedSummaries.length} negocios: ${failedSummaries
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

interface ProductFixResultAlertProps {
  result:
    | { success: true; data: FixProductIdResult }
    | { success: false; error: string }
    | null;
}

export const ProductFixResultAlert = ({
  result,
}: ProductFixResultAlertProps) => {
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

  return (
    <Alert
      type="success"
      showIcon
      message="Correccion completada"
      description={`Documentos revisados: ${result.data.total}. Documentos actualizados: ${result.data.updated}.`}
    />
  );
};

interface ExpenseTimestampResultAlertProps {
  result: ExpenseFixResult | null;
}

export const ExpenseTimestampResultAlert = ({
  result,
}: ExpenseTimestampResultAlertProps) => {
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
    const allData = data as ExpenseFixAllResult;
    const totals = allData.totals ?? {
      scanned: 0,
      affected: 0,
      updated: 0,
      fieldsConverted: 0,
    };
    const successSummaries =
      allData.summaries?.filter((item) => item.success) ?? [];
    const errorSummaries =
      allData.summaries?.filter((item) => !item.success) ?? [];
    const sampleEntries = successSummaries
      .flatMap((item) =>
        (item.summary?.sample ?? []).map(
          (sample) =>
            `${item.businessID}/${sample.id} (${sample.fields.join(', ')})`,
        ),
      )
      .slice(0, 3);
    const summaryText = `Negocios procesados: ${allData.processed}/${allData.totalBusinesses}. Documentos evaluados: ${totals.scanned}. Con incidencias: ${totals.affected}. ${
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
          dryRun ? 'Analisis global completado' : 'Conversion global completada'
        }
        description={`${summaryText}${errorsText}${sampleText}`}
      />
    );
  }

  const singleData = data as ExpenseFixSummary;
  const summaryText = `Documentos evaluados: ${singleData.scanned}. Con incidencias: ${singleData.affected}. ${
    dryRun
      ? 'No se aplicaron cambios.'
      : `Documentos actualizados: ${singleData.updated}.`
  } Campos convertidos: ${singleData.fieldsConverted}.`;
  const sampleText =
    singleData.sample?.length && singleData.sample.length > 0
      ? ` Ejemplos: ${singleData.sample
          .map((item) => `${item.id} (${item.fields.join(', ')})`)
          .join(' · ')}`
      : '';

  return (
    <Alert
      type={dryRun ? 'info' : 'success'}
      showIcon
      message={dryRun ? 'Analisis completado' : 'Conversion completada'}
      description={`${summaryText}${sampleText}`}
    />
  );
};
