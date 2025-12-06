import { Modal, Typography } from 'antd';

import { normalizeDigits } from './ncfUtils';

const { Text } = Typography;

const pluralize = (value, singular, plural) => {
  const amount = Number(value) || 0;
  return amount === 1 ? singular : plural;
};

export const confirmSequenceWarnings = async (validationResult) => {
  const result = validationResult || {};
  const insights = result.insights || {};
  const availableBefore = Array.isArray(insights.availableBefore)
    ? insights.availableBefore
    : [];
  const availableAfter = Array.isArray(insights.availableAfter)
    ? insights.availableAfter
    : [];
  const usedBefore = Array.isArray(insights.usedBefore)
    ? insights.usedBefore
    : [];
  const usedAfterRaw = Array.isArray(insights.usedAfter)
    ? insights.usedAfter
    : [];
  const lastUsed = insights.lastUsed || null;
  const hasImmediateNextConflict = Boolean(result.hasImmediateNextConflict);

  const sortedUsedAfter = usedAfterRaw
    .slice(0)
    .sort((a, b) => (a?.step ?? 0) - (b?.step ?? 0));

  const showCurrentConflict = Boolean(
    hasImmediateNextConflict && insights.currentConflict,
  );
  const showFutureUsage = sortedUsedAfter.length > 0;
  const showAvailableAfter = showFutureUsage && availableAfter.length > 0;
  const showAvailableBefore = availableBefore.length > 0;
  const showUsedBefore = usedBefore.length > 0;

  const prefixCandidate =
    typeof result.prefix === 'string' ? result.prefix : '';
  const resolveSequenceLength = () => {
    const candidates = [
      Number(result.sequenceLength),
      Number(result.nextDigitsLength),
      Number(insights.currentConflict?.normalizedDigits?.length),
      Number(sortedUsedAfter[0]?.normalizedDigits?.length),
    ].filter((value) => Number.isFinite(value) && value > 0);
    return candidates.length > 0 ? candidates[0] : null;
  };

  const sequenceLength = resolveSequenceLength();

  const buildFromDigits = (rawDigits) => {
    if (rawDigits === undefined || rawDigits === null) return null;
    const digits = normalizeDigits(String(rawDigits));
    if (!digits) return null;
    const length =
      Number.isFinite(sequenceLength) && sequenceLength > 0
        ? sequenceLength
        : digits.length;
    const padded = length > 0 ? digits.padStart(length, '0') : digits;
    return prefixCandidate ? `${prefixCandidate}${padded}` : padded;
  };

  const extractDigitsFromItem = (item) => {
    if (!item) return null;
    if (
      typeof item.normalizedDigits === 'string' &&
      item.normalizedDigits.length > 0
    ) {
      return item.normalizedDigits;
    }
    if (Number.isFinite(item.number)) {
      return item.number.toString();
    }
    if (typeof item.ncf === 'string') {
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
      return trimmed.replace(/[^0-9]/g, '');
    }
    return null;
  };

  const formatItemNcf = (item) => {
    const digits = extractDigitsFromItem(item);
    const formatted = buildFromDigits(digits);
    if (formatted) return formatted;
    return item?.ncf || '';
  };

  const formatRangeLabel = (startItem, endItem) => {
    const start = formatItemNcf(startItem);
    const end = formatItemNcf(endItem);
    if (!start) return null;
    if (!end || start === end) return start;
    return `${start} — ${end}`;
  };

  const shouldWarn = showCurrentConflict || showFutureUsage;

  if (!shouldWarn) {
    return { accepted: true, warned: false };
  }

  const renderInvoiceList = (items) => (
    <ul>
      {items.map((invoice) => {
        const display =
          invoice.ncf ?? invoice.id ?? 'Factura sin identificador';
        return <li key={invoice.id ?? display}>{display}</li>;
      })}
    </ul>
  );

  const availableAfterRange = showAvailableAfter
    ? {
        start: availableAfter[0],
        end: availableAfter[availableAfter.length - 1],
      }
    : null;

  const futureUsageBlock = showFutureUsage ? (
    <div style={{ marginTop: showCurrentConflict ? 16 : 0 }}>
      <p>
        {hasImmediateNextConflict
          ? 'El siguiente NCF en la secuencia ya está emitido:'
          : 'Se detectaron comprobantes emitidos más adelante:'}
      </p>
      <ul>
        {sortedUsedAfter.slice(0, 5).map((item) => {
          const invoicesCount = item.invoices?.length ?? 0;
          const distanceLabel = item.step
            ? ` · ${item.step} ${pluralize(item.step, 'paso', 'pasos')} después`
            : '';
          const invoicesLabel = invoicesCount
            ? ` · ${invoicesCount} ${pluralize(invoicesCount, 'factura', 'facturas')}`
            : '';
          return (
            <li key={`used-after-${item.number}`}>
              <Text strong>{formatItemNcf(item)}</Text>
              {distanceLabel}
              {invoicesLabel}
            </li>
          );
        })}
      </ul>

      {availableAfterRange ? (
        <p style={{ marginTop: 8 }}>
          Antes de ese punto puedes utilizar{' '}
          <strong>
            {formatRangeLabel(
              availableAfterRange.start,
              availableAfterRange.end,
            )}
          </strong>
          .
        </p>
      ) : null}
    </div>
  ) : null;

  const currentConflictBlock = showCurrentConflict ? (
    <div>
      <p>
        El NCF almacenado coincide con uno ya emitido:
        <strong style={{ display: 'block' }}>
          {formatItemNcf(insights.currentConflict)}
        </strong>
      </p>
      {insights.currentConflict.invoices?.length ? (
        <div>
          <p>Facturas encontradas:</p>
          {renderInvoiceList(insights.currentConflict.invoices)}
        </div>
      ) : null}
    </div>
  ) : null;

  const lastUsedBlock = lastUsed ? (
    <div style={{ marginTop: showCurrentConflict ? 16 : 0 }}>
      <p>
        Último comprobante emitido encontrado:
        <strong style={{ display: 'block' }}>{formatItemNcf(lastUsed)}</strong>
      </p>
    </div>
  ) : null;

  const availableBeforeBlock = showAvailableBefore ? (
    <div style={{ marginTop: showCurrentConflict || lastUsed ? 16 : 0 }}>
      <p>NCF disponibles antes de la secuencia actual:</p>
      <ul>
        {availableBefore.map((item) => (
          <li key={`available-before-${item.number}`}>{formatItemNcf(item)}</li>
        ))}
      </ul>
    </div>
  ) : null;

  const usedBeforeBlock = showUsedBefore ? (
    <div
      style={{
        marginTop:
          showCurrentConflict || lastUsed || showAvailableBefore ? 16 : 0,
      }}
    >
      <p>Ya existen facturas emitidas con estos NCF anteriores:</p>
      <ul>
        {usedBefore.map((item) => {
          const invoicesCount = item.invoices?.length ?? 0;
          const suffix = invoicesCount
            ? ` · ${invoicesCount} ${pluralize(invoicesCount, 'factura', 'facturas')}`
            : '';
          return (
            <li key={`used-before-${item.number}`}>
              {formatItemNcf(item)}
              {suffix}
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  const warningContent = (
    <div>
      {currentConflictBlock}
      {futureUsageBlock}
      {lastUsedBlock}
      {availableBeforeBlock}
      {usedBeforeBlock}

      <p style={{ marginTop: 16 }}>
        ¿Deseas guardar la configuración con estas observaciones?
      </p>
    </div>
  );

  return new Promise((resolve) => {
    let settled = false;
    const safeResolve = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    Modal.confirm({
      title: null,
      icon: null,
      content: warningContent,
      okText: 'Guardar de todos modos',
      cancelText: 'Cancelar',
      centered: true,
      onOk: () => safeResolve({ accepted: true, warned: true }),
      onCancel: () => safeResolve({ accepted: false, warned: true }),
      afterClose: () => safeResolve({ accepted: false, warned: true }),
    });
  });
};
