import { Alert, Space, Typography } from 'antd';
import React from 'react';

import {
  type LedgerEntry,
  type Range,
  type SequenceAnalysisStateLoose,
  type SequenceConflictResult,
  formatLedgerEntryNcf,
  formatNcfDigits,
  isRecord,
  isSequenceConflictResult,
} from '../utils/ncfUtils';

const { Text } = Typography;

type InfoRowProps = {
  label: string;
  value?: string | null;
  hint?: string | null;
};

type InsightListProps = {
  label: string;
  items?: LedgerEntry[] | null;
  withCount?: boolean;
  formatNcf?: (item: LedgerEntry) => string;
};

type SequenceLedgerInsightsProps = {
  analysisState?: SequenceAnalysisStateLoose;
  prefix?: string | null;
  displayLength?: number | string | null;
};

const toLedgerEntries = (value: unknown): LedgerEntry[] =>
  Array.isArray(value) ? (value as LedgerEntry[]) : [];

const InfoRow = ({ label, value, hint }: InfoRowProps) => {
  if (!value) return null;
  return (
    <div>
      <Text type="secondary">{label}</Text>
      <Text strong style={{ display: 'block' }}>
        {value}
      </Text>
      {hint ? (
        <Text type="secondary" style={{ display: 'block' }}>
          {hint}
        </Text>
      ) : null}
    </div>
  );
};

const InsightList = ({
  label,
  items,
  withCount = false,
  formatNcf,
}: InsightListProps) => {
  if (!items?.length) return null;
  const limited = items.slice(0, 5);
  return (
    <div>
      <Text type="secondary">{label}</Text>
      <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
        {limited.map((item, index) => {
          const suffix =
            withCount && item.invoices?.length
              ? ` · ${item.invoices.length} factura${item.invoices.length > 1 ? 's' : ''}`
              : '';
          const key = item.ncf || `${label}-${item.number ?? index}`;
          const value =
            typeof formatNcf === 'function'
              ? formatNcf(item)
              : item.ncf ||
                `${item.prefix || ''}${item.normalizedDigits || ''}`;
          return (
            <li key={key}>
              <Text>{value}</Text>
              {suffix}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const SequenceLedgerInsights = ({
  analysisState,
  prefix: prefixProp,
  displayLength,
}: SequenceLedgerInsightsProps) => {
  const state = analysisState ?? { status: 'idle', result: null, error: null };
  const status = typeof state.status === 'string' ? state.status : 'idle';
  const result: SequenceConflictResult | null = isSequenceConflictResult(
    state.result,
  )
    ? state.result
    : null;
  const errorMessage =
    state.error instanceof Error
      ? state.error.message
      : isRecord(state.error) && typeof state.error.message === 'string'
        ? state.error.message
        : null;

  if ((status === 'idle' || status === 'error') && !result) {
    if (status === 'error') {
      return (
        <Alert
          type="error"
          showIcon
          message="No se pudo analizar la secuencia"
          description={errorMessage || 'Intenta nuevamente más tarde.'}
        />
      );
    }
    return null;
  }

  const loading = status === 'loading';
  const insights = result?.insights;
  const availableBefore = toLedgerEntries(insights?.availableBefore);
  const availableAfter = toLedgerEntries(insights?.availableAfter);
  const usedBefore = toLedgerEntries(insights?.usedBefore);
  const usedAfter = toLedgerEntries(insights?.usedAfter);
  const nextConflict = Boolean(result?.hasImmediateNextConflict);
  const futureGapMeta = usedAfter.find((meta) => meta.step > 1) || null;
  const showAvailableAfter = usedAfter.length > 0 && availableAfter.length > 0;

  const prefixCandidate =
    typeof prefixProp === 'string' && prefixProp
      ? prefixProp
      : result?.prefix || '';

  const resolveLength = () => {
    const explicitLength = Number(displayLength);
    if (Number.isFinite(explicitLength) && explicitLength > 0)
      return explicitLength;

    const resultLength = Number(result?.sequenceLength);
    if (Number.isFinite(resultLength) && resultLength > 0) return resultLength;

    const nextDigitsLength = Number(result?.nextDigitsLength);
    if (Number.isFinite(nextDigitsLength) && nextDigitsLength > 0)
      return nextDigitsLength;

    return null;
  };

  const sequenceLength = resolveLength();
  const formatOptions = { prefix: prefixCandidate, sequenceLength };

  const formatItemNcf = (item: LedgerEntry | null | undefined): string => {
    return formatLedgerEntryNcf(item, formatOptions);
  };

  const nextNcf = formatNcfDigits(result?.nextDigits, formatOptions);
  const formattedFutureGap = futureGapMeta
    ? formatItemNcf(futureGapMeta)
    : null;
  const lastUsedValue = insights?.lastUsed
    ? formatItemNcf(insights.lastUsed)
    : null;
  const availableAfterRange: Range<string> | null = showAvailableAfter
    ? {
        start: formatItemNcf(availableAfter[0]),
        end: formatItemNcf(availableAfter[availableAfter.length - 1]),
      }
    : null;

  const formatRangeLabel = (range: Range<string> | null): string | null => {
    if (!range) return null;
    if (!range.start) return null;
    if (!range.end || range.start === range.end) return range.start;
    return `${range.start} — ${range.end}`;
  };

  const futureGapDescription = availableAfterRange
    ? `Antes de ese punto puedes utilizar ${formatRangeLabel(availableAfterRange)}.`
    : null;

  return (
    <Space
      orientation="vertical"
      size="small"
      style={{ width: '100%', marginTop: 12 }}
    >
      {loading ? (
        <Alert type="info" showIcon message="Analizando secuencia..." />
      ) : null}

      {nextConflict && nextNcf ? (
        <Alert
          type="warning"
          showIcon
          message={`El próximo NCF (${nextNcf}) ya fue emitido`}
        />
      ) : null}

      {!nextConflict && futureGapMeta ? (
        <Alert
          type="info"
          showIcon
          message={`Se encontró el NCF ${formattedFutureGap || futureGapMeta.ncf} más adelante (${futureGapMeta.step} paso${futureGapMeta.step > 1 ? 's' : ''} después).`}
          description={futureGapDescription || undefined}
        />
      ) : null}

      <InfoRow label="Último NCF emitido" value={lastUsedValue} />

      <InsightList
        label="Huecos antes de la secuencia"
        items={availableBefore}
        formatNcf={formatItemNcf}
      />
      {showAvailableAfter ? (
        <InsightList
          label="Huecos después de la secuencia"
          items={availableAfter}
          formatNcf={formatItemNcf}
        />
      ) : null}
      <InsightList
        label="NCF emitidos previos"
        items={usedBefore}
        withCount
        formatNcf={formatItemNcf}
      />
      <InsightList
        label="NCF emitidos siguientes"
        items={usedAfter}
        withCount
        formatNcf={formatItemNcf}
      />
    </Space>
  );
};

export default SequenceLedgerInsights;
