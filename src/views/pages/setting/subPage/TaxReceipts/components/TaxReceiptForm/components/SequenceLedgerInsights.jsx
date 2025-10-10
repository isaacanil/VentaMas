import { Alert, Space, Typography } from "antd";
import React from "react";

import { normalizeDigits } from "../utils/ncfUtils";

const { Text } = Typography;

const InfoRow = ({ label, value, hint }) => {
  if (!value) return null;
  return (
    <div>
      <Text type="secondary">{label}</Text>
      <Text strong style={{ display: "block" }}>{value}</Text>
      {hint ? (
        <Text type="secondary" style={{ display: "block" }}>{hint}</Text>
      ) : null}
    </div>
  );
};

const InsightList = ({ label, items, withCount = false, formatNcf }) => {
  if (!items?.length) return null;
  const limited = items.slice(0, 5);
  return (
    <div>
      <Text type="secondary">{label}</Text>
      <ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>
        {limited.map((item, index) => {
          const suffix = withCount && item.invoices?.length
            ? ` · ${item.invoices.length} factura${item.invoices.length > 1 ? "s" : ""}`
            : "";
          const key = item.ncf || `${label}-${item.number ?? index}`;
          const value = typeof formatNcf === "function"
            ? formatNcf(item)
            : item.ncf || `${item.prefix || ""}${item.normalizedDigits || ""}`;
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

const SequenceLedgerInsights = ({ analysisState, prefix: prefixProp, displayLength }) => {
  const state = analysisState ?? { status: "idle", result: null, error: null };
  const { status, result, error } = state;

  if ((status === "idle" || status === "error") && !result) {
    if (status === "error") {
      return (
        <Alert
          type="error"
          showIcon
          message="No se pudo analizar la secuencia"
          description={error?.message || "Intenta nuevamente más tarde."}
        />
      );
    }
    return null;
  }

  const loading = status === "loading";
  const insights = result?.insights ?? {};
  const availableBefore = Array.isArray(insights.availableBefore) ? insights.availableBefore : [];
  const availableAfter = Array.isArray(insights.availableAfter) ? insights.availableAfter : [];
  const usedBefore = Array.isArray(insights.usedBefore) ? insights.usedBefore : [];
  const usedAfter = Array.isArray(insights.usedAfter) ? insights.usedAfter : [];
  const nextConflict = Boolean(result?.hasImmediateNextConflict);
  const futureGapMeta = usedAfter.find((meta) => meta.step > 1) || null;
  const showAvailableAfter = usedAfter.length > 0 && availableAfter.length > 0;

  const prefixCandidate =
    typeof prefixProp === "string" && prefixProp
      ? prefixProp
      : result?.prefix || "";

  const resolveLength = () => {
    const explicitLength = Number(displayLength);
    if (Number.isFinite(explicitLength) && explicitLength > 0) return explicitLength;

    const resultLength = Number(result?.sequenceLength);
    if (Number.isFinite(resultLength) && resultLength > 0) return resultLength;

    const nextDigitsLength = Number(result?.nextDigitsLength);
    if (Number.isFinite(nextDigitsLength) && nextDigitsLength > 0) return nextDigitsLength;

    return null;
  };

  const sequenceLength = resolveLength();

  const buildFromDigits = (rawDigits) => {
    if (rawDigits === undefined || rawDigits === null) return null;
    const digits = normalizeDigits(String(rawDigits));
    if (!digits) return null;
    const length = Number.isFinite(sequenceLength) && sequenceLength > 0
      ? sequenceLength
      : digits.length;
    const padded = length > 0 ? digits.padStart(length, "0") : digits;
    return prefixCandidate ? `${prefixCandidate}${padded}` : padded;
  };

  const extractDigitsFromItem = (item) => {
    if (!item) return null;
    if (typeof item.normalizedDigits === "string" && item.normalizedDigits.length > 0) {
      return item.normalizedDigits;
    }
    if (Number.isFinite(item.number)) {
      return item.number.toString();
    }
    if (typeof item.ncf === "string") {
      const trimmed = item.ncf.trim();
      if (prefixCandidate && trimmed.startsWith(prefixCandidate)) {
        return trimmed.slice(prefixCandidate.length);
      }
      const prefixIndex = prefixCandidate
        ? trimmed.toUpperCase().indexOf(prefixCandidate.toUpperCase())
        : -1;
      if (prefixCandidate && prefixIndex >= 0) {
        return trimmed.slice(prefixIndex + prefixCandidate.length);
      }
      return trimmed.replace(/[^0-9]/g, "");
    }
    return null;
  };

  const formatItemNcf = (item) => {
    const digits = extractDigitsFromItem(item);
    const formatted = buildFromDigits(digits);
    if (formatted) return formatted;
    return item?.ncf || "";
  };

  const nextNcf = buildFromDigits(result?.nextDigits);
  const formattedFutureGap = futureGapMeta ? formatItemNcf(futureGapMeta) : null;
  const lastUsedValue = insights.lastUsed ? formatItemNcf(insights.lastUsed) : null;
  const availableAfterRange = showAvailableAfter
    ? {
        start: formatItemNcf(availableAfter[0]),
        end: formatItemNcf(availableAfter[availableAfter.length - 1]),
      }
    : null;

  const formatRangeLabel = (range) => {
    if (!range) return null;
    if (!range.start) return null;
    if (!range.end || range.start === range.end) return range.start;
    return `${range.start} — ${range.end}`;
  };

  const futureGapDescription = availableAfterRange
    ? `Antes de ese punto puedes utilizar ${formatRangeLabel(availableAfterRange)}.`
    : null;

  return (
    <Space direction="vertical" size="small" style={{ width: "100%", marginTop: 12 }}>
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
          message={`Se encontró el NCF ${formattedFutureGap || futureGapMeta.ncf} más adelante (${futureGapMeta.step} paso${futureGapMeta.step > 1 ? "s" : ""} después).`}
          description={futureGapDescription || undefined}
        />
      ) : null}

      <InfoRow
        label="Último NCF emitido"
        value={lastUsedValue}
      />

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
