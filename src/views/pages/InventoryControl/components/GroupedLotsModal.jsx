import {
  Modal,
  Button,
  Tag,
  InputNumber,
  Dropdown,
  message,
  Tooltip,
} from 'antd';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';

import { EditorsList, SummaryBar } from './inventoryTableComponents.jsx';
import {
  formatNumber,
  formatInputDate,
  shortenLocationPath,
  Diff,
} from './inventoryTableUtils.js';

export function GroupedLotsModal({
  open,
  group,
  counts,
  countsMeta,
  usersNameCache,
  locationNamesMap = {},
  resolvingLocations = {},
  expirationEdits = {},
  onChangeExpiration,
  onChangeCount,
  onClose,
  onSave,
  serverCounts = {},
  readOnly = false,
  saving = false,
  baselineSnapshot,
}) {
  const CLEAR_SENTINEL = '__REMOVE__';

  // Sincronizar fecha en sources que comparten el mismo lote
  const syncSameLotDates = (changedSourceKey, newDate, currentSource) => {
    if (!group?._children || !onChangeExpiration) return;
    const currentLotId = currentSource.batchId || currentSource.batchNumberId;
    if (!currentLotId) return;
    for (const child of group._children) {
      if (!child.sources) continue;
      for (const src of child.sources) {
        const srcKey = src.id || src.key;
        if (!srcKey || srcKey === changedSourceKey) continue;
        const srcLotId = src.batchId || src.batchNumberId;
        if (srcLotId === currentLotId) onChangeExpiration(srcKey, newDate);
      }
    }
  };
  // Sincronizar fecha entre registros (sin sources) del mismo lote
  const syncSameLotRecords = (changedRecordKey, newDate, currentRecord) => {
    if (!group?._children || !onChangeExpiration) return;
    const currentLotId = currentRecord.batchId || currentRecord.batchNumberId;
    if (!currentLotId) return;
    for (const child of group._children) {
      if (child.key === changedRecordKey) continue;
      if (child.type !== 'batch') continue;
      const childLotId = child.batchId || child.batchNumberId;
      if (childLotId === currentLotId) onChangeExpiration(child.key, newDate);
    }
  };

  // Detectar si hay cambios (ediciones en conteos o expiraciones)
  const hasChanges = useMemo(() => {
    if (!group?._children) return false;
    for (const child of group._children) {
      if ((counts[child.key] ?? null) !== (serverCounts[child.key] ?? null))
        return true;
      if (Array.isArray(child.sources)) {
        for (const src of child.sources) {
          const skey = src.id || src.key;
          if (skey && (counts[skey] ?? null) !== (serverCounts[skey] ?? null))
            return true;
        }
      }
    }
    for (const child of group._children) {
      const editedVal = expirationEdits[child.key] ?? null;
      const storedVal = countsMeta[child.key]?.manualExpirationDate ?? null;
      if (editedVal !== storedVal) return true;
      if (Array.isArray(child.sources)) {
        for (const src of child.sources) {
          const skey = src.id || src.key;
          if (!skey) continue;
          const eVal = expirationEdits[skey] ?? null;
          const sVal = countsMeta[skey]?.manualExpirationDate ?? null;
          if (eVal !== sVal) return true;
        }
      }
    }
    return false;
  }, [group, counts, serverCounts, expirationEdits, countsMeta]);

  const handleSaveAndClose = async () => {
    if (!hasChanges) {
      message.info('No hay cambios para guardar');
      onClose();
      return;
    }
    if (onSave) {
      try {
        await onSave();
        onClose();
      } catch (saveError) {
        const description =
          saveError instanceof Error
            ? saveError.message
            : 'No se pudo guardar los cambios.';
        message.error(description);
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={group ? `${group.productName} - Lotes` : ''}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        ...(readOnly
          ? []
          : [
              <Button
                key="save"
                type="primary"
                onClick={handleSaveAndClose}
                loading={saving}
                disabled={!hasChanges}
              >
                {hasChanges ? 'Guardar y Cerrar' : 'Cerrar'}
              </Button>,
            ]),
      ]}
      width={1200}
      style={{ top: 10 }}
      destroyOnHidden
    >
      {group && (
        <>
          <SimpleTable>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Ubicaciones</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Conteo real</th>
                <th style={{ textAlign: 'right' }}>Diferencia</th>
                <th>Editado por</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const children = group._children || [];
                const baselineCounts = baselineSnapshot?.counts || {};
                const baselineExp = baselineSnapshot?.expirations || {};
                const normDate = (v) => {
                  if (!v || v === CLEAR_SENTINEL) return '';
                  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
                  return formatInputDate(v) || '';
                };
                return children.flatMap((record) => {
                  // Conteo real
                  let aggregatedTopCount;
                  if (
                    group?.canEditAtTop &&
                    group?.topKey &&
                    counts[group.topKey] !== undefined
                  )
                    aggregatedTopCount = counts[group.topKey];
                  else if (
                    group?.canEditAtTop &&
                    group?.topKey &&
                    serverCounts[group.topKey] !== undefined
                  )
                    aggregatedTopCount = serverCounts[group.topKey];
                  const real =
                    counts[record.key] !== undefined
                      ? counts[record.key]
                      : aggregatedTopCount !== undefined &&
                          children.length === 1
                        ? aggregatedTopCount
                        : serverCounts[record.key] !== undefined
                          ? serverCounts[record.key]
                          : record.real;
                  const diff = Number(real ?? 0) - Number(record.stock ?? 0);
                  const meta = countsMeta[record.key];
                  const editVal = expirationEdits[record.key];
                  const hasEditState = Object.prototype.hasOwnProperty.call(
                    expirationEdits,
                    record.key,
                  );
                  const persistedVal = meta?.manualExpirationDate;
                  const isMarkedForRemoval =
                    editVal === CLEAR_SENTINEL ||
                    persistedVal === CLEAR_SENTINEL;

                  const currentPersistedCount =
                    serverCounts[record.key] !== undefined
                      ? Number(serverCounts[record.key])
                      : Number(record.stock ?? 0);
                  const effectiveCount =
                    counts[record.key] !== undefined
                      ? counts[record.key]
                      : currentPersistedCount;
                  const baselineCount = baselineCounts[record.key];
                  const countChangedPersisted =
                    baselineCount !== undefined &&
                    Number(effectiveCount) !== Number(baselineCount);

                  let currentPersistedExp =
                    meta?.manualExpirationDate &&
                    meta.manualExpirationDate !== CLEAR_SENTINEL
                      ? meta.manualExpirationDate
                      : record.type === 'batch'
                        ? formatInputDate(record.expirationDate)
                        : '';
                  currentPersistedExp = normDate(currentPersistedExp);
                  const baseExp = baselineExp[record.key];
                  const expChangedPersisted =
                    baseExp !== undefined && currentPersistedExp !== baseExp;
                  const hasPendingExpEdit =
                    editVal !== undefined && editVal !== persistedVal;
                  const rowModified =
                    countChangedPersisted ||
                    expChangedPersisted ||
                    hasPendingExpEdit;

                  // Date handling
                  let dateValue = null;
                  let baseStr = '';
                  if (hasEditState) {
                    if (editVal === CLEAR_SENTINEL) baseStr = '';
                    else if (editVal) baseStr = editVal;
                  } else {
                    if (
                      meta?.manualExpirationDate &&
                      meta.manualExpirationDate !== CLEAR_SENTINEL
                    )
                      baseStr = formatInputDate(meta.manualExpirationDate);
                    else if (record.type === 'batch')
                      baseStr = formatInputDate(record.expirationDate);
                  }
                  if (baseStr) {
                    const d = DateTime.fromISO(baseStr);
                    if (d.isValid) dateValue = d;
                  }
                  const originalDateStr =
                    record.type === 'batch'
                      ? formatInputDate(record.expirationDate)
                      : '';
                  const currentEditStr = isMarkedForRemoval
                    ? CLEAR_SENTINEL
                    : dateValue
                    ? dateValue.toFormat('yyyy-LL-dd')
                      : '';
                  const isDifferentFromOriginal =
                    record.type === 'batch' &&
                    (currentEditStr === CLEAR_SENTINEL ||
                      (!!originalDateStr &&
                        currentEditStr !== originalDateStr) ||
                      (!currentEditStr && !!originalDateStr));

                  // Expand sources if present
                  if (
                    (record.type === 'batch' || record.type === 'noexp') &&
                    (record.sources?.length || 0) > 0
                  ) {
                    return record.sources.map((src, idx) => {
                      const skey =
                        src.id || src.key || `${record.key}-src-${idx}`;
                      // Stock “live” del source
                      const sourceLive =
                        Number(src.quantity ?? src.stock ?? 0) || 0;
                      // Si el lote tiene un solo source, usar el stock del lote (congelado) para la columna Stock
                      const useChildFrozen =
                        (record.sources?.length || 0) === 1 &&
                        Number.isFinite(Number(record.stock));
                      const stock = useChildFrozen
                        ? Number(record.stock ?? sourceLive)
                        : sourceLive;
                      // Conteo real por source: prioriza ediciones/persistido; fallback al valor live del source
                      const sReal =
                        counts[skey] ??
                        serverCounts[skey] ??
                        src.real ??
                        sourceLive;
                      const sDiff = Number(sReal ?? 0) - stock;
                      const sMeta = countsMeta[skey];
                      const locationRaw = src.location || '—';
                      const fullLocationLabel =
                        locationNamesMap[locationRaw] || locationRaw;
                      const tagLocationLabel =
                        shortenLocationPath(fullLocationLabel);
                      const isLoadingLoc =
                        !locationNamesMap[locationRaw] &&
                        !!resolvingLocations[locationRaw];
                      const srcEditVal = expirationEdits[skey];
                      const srcPersistedVal = sMeta?.manualExpirationDate;

                      const currentSrcPersistedCount =
                        serverCounts[skey] !== undefined
                          ? Number(serverCounts[skey])
                          : stock;
                      const srcEffective =
                        counts[skey] !== undefined
                          ? counts[skey]
                          : currentSrcPersistedCount;
                      const baseSrcCount = baselineCounts[skey];
                      const srcCountChangedPersisted =
                        baseSrcCount !== undefined &&
                        Number(srcEffective) !== Number(baseSrcCount);
                      let currentSrcPersistedExp =
                        srcPersistedVal && srcPersistedVal !== CLEAR_SENTINEL
                          ? srcPersistedVal
                          : src.expirationDate
                            ? formatInputDate(src.expirationDate)
                            : record.type === 'batch'
                              ? formatInputDate(record.expirationDate)
                              : '';
                      currentSrcPersistedExp = normDate(currentSrcPersistedExp);
                      const baseSrcExp = baselineExp[skey];
                      const srcExpChangedPersisted =
                        baseSrcExp !== undefined &&
                        currentSrcPersistedExp !== baseSrcExp;
                      const srcHasPendingExpEdit =
                        srcEditVal !== undefined &&
                        srcEditVal !== srcPersistedVal;
                      const sourceModified =
                        srcCountChangedPersisted ||
                        srcExpChangedPersisted ||
                        srcHasPendingExpEdit;

                      const srcHasEditState =
                        Object.prototype.hasOwnProperty.call(
                          expirationEdits,
                          skey,
                        );
                      let sourceDateValue = null;
                      let srcBaseStr = '';
                      if (srcHasEditState) {
                        if (srcEditVal === CLEAR_SENTINEL) srcBaseStr = '';
                        else if (srcEditVal) srcBaseStr = srcEditVal;
                      } else {
                        if (
                          sMeta?.manualExpirationDate &&
                          sMeta.manualExpirationDate !== CLEAR_SENTINEL
                        )
                          srcBaseStr = formatInputDate(
                            sMeta.manualExpirationDate,
                          );
                        else if (src.expirationDate)
                          srcBaseStr = formatInputDate(src.expirationDate);
                        else if (
                          record.type === 'batch' &&
                          record.expirationDate
                        )
                          srcBaseStr = formatInputDate(record.expirationDate);
                      }
                      if (srcBaseStr) {
                        const d = DateTime.fromISO(srcBaseStr);
                        if (d.isValid) sourceDateValue = d;
                      }

                      return (
                        <tr key={skey}>
                          <td>
                            <LotCellWrap>
                              <LotNameBlock>
                                <span style={{ display: 'block' }}>
                                  Lote{' '}
                                  {src.batchNumberId ||
                                    src.batchId ||
                                    record.batchNumberId ||
                                    record.batchId ||
                                    'x'}
                                </span>
                                {sourceModified && (
                                  <Tag
                                    color="orange"
                                    size="small"
                                    style={{ marginTop: 2 }}
                                  >
                                    Editado
                                  </Tag>
                                )}
                              </LotNameBlock>
                            </LotCellWrap>
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <DatePicker
                                value={sourceDateValue}
                                format="DD/MM/YYYY"
                                allowClear
                                disabled={readOnly}
                                placeholder={
                                  record.type === 'batch'
                                    ? 'Sin fecha'
                                    : 'Sin asignar'
                                }
                                onChange={(date) => {
                                  if (!date) {
                                    const hadExisting =
                                      !!src.expirationDate ||
                                      !!sMeta?.manualExpirationDate ||
                                      !!sourceDateValue;
                                    if (!hadExisting) {
                                      onChangeExpiration &&
                                        onChangeExpiration(skey, undefined);
                                      return;
                                    }
                                    if (record.type === 'batch') {
                                      const prevVal =
                                        sMeta?.manualExpirationDate
                                          ? formatInputDate(
                                              sMeta.manualExpirationDate,
                                            )
                                          : formatInputDate(
                                              src.expirationDate ||
                                                record.expirationDate,
                                            );
                                      onChangeExpiration &&
                                        onChangeExpiration(skey, undefined);
                                      Modal.confirm({
                                        title: 'Eliminar fecha de lote',
                                        content:
                                          'La fecha se quitará de esta partida y todas las partidas del mismo lote. ¿Continuar?',
                                        okText: 'Sí, eliminar',
                                        cancelText: 'Cancelar',
                                        okButtonProps: { danger: true },
                                        onOk: () => {
                                          onChangeExpiration &&
                                            onChangeExpiration(
                                              skey,
                                              CLEAR_SENTINEL,
                                            );
                                          syncSameLotDates(
                                            skey,
                                            CLEAR_SENTINEL,
                                            src,
                                          );
                                        },
                                        onCancel: () => {
                                          if (prevVal)
                                            onChangeExpiration &&
                                              onChangeExpiration(skey, prevVal);
                                        },
                                      });
                                    } else if (record.type === 'noexp') {
                                      onChangeExpiration &&
                                        onChangeExpiration(skey, undefined);
                                    }
                                    return;
                                  }
                                  const iso = date.toISODate();
                                  onChangeExpiration &&
                                    onChangeExpiration(skey, iso);
                                  syncSameLotDates(skey, iso, src);
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <Tooltip
                              title={
                                isLoadingLoc
                                  ? 'Resolviendo ubicación…'
                                  : fullLocationLabel
                              }
                            >
                              <Tag>
                                {isLoadingLoc ? (
                                  <span style={{ opacity: 0.6, fontSize: 11 }}>
                                    Cargando…
                                  </span>
                                ) : (
                                  shortenLocationPath(tagLocationLabel)
                                )}
                              </Tag>
                            </Tooltip>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong>{formatNumber(stock)}</strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <InputNumber
                              min={0}
                              value={sReal}
                              onChange={(val) =>
                                onChangeCount(skey, Number(val ?? 0))
                              }
                              style={{ width: 90 }}
                              disabled={readOnly}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Diff $value={sDiff}>{formatNumber(sDiff)}</Diff>
                          </td>
                          <td>
                            {sMeta?.updatedBy ? (
                              <EditorsList
                                editors={[
                                  {
                                    uid: sMeta.updatedBy,
                                    name:
                                      usersNameCache[sMeta.updatedBy] ||
                                      sMeta.updatedByName ||
                                      sMeta.updatedBy,
                                    updatedAt: sMeta.updatedAt,
                                  },
                                ]}
                              />
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {!readOnly &&
                              (() => {
                                const menuItems = [];
                                const originalDate =
                                  src.expirationDate || record.expirationDate;
                                const srcHasChanged = !!(
                                  countsMeta[skey]?.manualExpirationDate ||
                                  expirationEdits[skey] !== undefined ||
                                  (originalDate &&
                                    formatInputDate(originalDate) !==
                                      (expirationEdits[skey] ||
                                        countsMeta[skey]
                                          ?.manualExpirationDate ||
                                        ''))
                                );
                                if (record.type === 'batch' && originalDate) {
                                  menuItems.push({
                                    key: 'restore-date',
                                    label:
                                      'Restablecer fecha de vencimiento original',
                                    disabled: !srcHasChanged,
                                    onClick: () => {
                                      const formattedDate =
                                        formatInputDate(originalDate);
                                      onChangeExpiration &&
                                        onChangeExpiration(skey, formattedDate);
                                      syncSameLotDates(
                                        skey,
                                        formattedDate,
                                        src,
                                      );
                                    },
                                  });
                                }
                                const hasCurrentDate =
                                  sourceDateValue || srcBaseStr;
                                if (
                                  (record.type === 'batch' ||
                                    record.type === 'noexp') &&
                                  hasCurrentDate
                                ) {
                                  if (menuItems.length)
                                    menuItems.push({ type: 'divider' });
                                  menuItems.push({
                                    key: 'clear-date',
                                    label: 'Borrar fecha de vencimiento',
                                    onClick: () => {
                                      onChangeExpiration &&
                                        onChangeExpiration(
                                          skey,
                                          CLEAR_SENTINEL,
                                        );
                                      syncSameLotDates(
                                        skey,
                                        CLEAR_SENTINEL,
                                        src,
                                      );
                                    },
                                  });
                                }
                                // Restaurar conteos
                                const sStockBase = stock;
                                const persistedSourceCount =
                                  serverCounts[skey] !== undefined
                                    ? Number(serverCounts[skey])
                                    : sStockBase;
                                const baselineSourceCount =
                                  baselineCounts[skey];
                                const effectiveSourceVal =
                                  counts[skey] !== undefined
                                    ? Number(counts[skey])
                                    : persistedSourceCount;
                                const hasEditedSourceCount =
                                  counts[skey] !== undefined &&
                                  Number(counts[skey]) !== persistedSourceCount;
                                const canRestoreBaseline =
                                  baselineSourceCount !== undefined &&
                                  Number(baselineSourceCount) !==
                                    effectiveSourceVal;
                                if (hasEditedSourceCount) {
                                  if (menuItems.length)
                                    menuItems.push({ type: 'divider' });
                                  menuItems.push({
                                    key: 'restore-count-persisted',
                                    label: 'Restablecer conteo guardado',
                                    onClick: () =>
                                      onChangeCount(
                                        skey,
                                        Number(persistedSourceCount),
                                      ),
                                  });
                                }
                                if (canRestoreBaseline) {
                                  if (!hasEditedSourceCount && menuItems.length)
                                    menuItems.push({ type: 'divider' });
                                  menuItems.push({
                                    key: 'restore-count-baseline',
                                    label: 'Restablecer conteo original',
                                    onClick: () =>
                                      onChangeCount(
                                        skey,
                                        Number(baselineSourceCount),
                                      ),
                                  });
                                }
                                if (!menuItems.length) return null;
                                return (
                                  <Dropdown
                                    menu={{ items: menuItems }}
                                    trigger={['click']}
                                  >
                                    <Button size="small">⋯</Button>
                                  </Dropdown>
                                );
                              })()}
                          </td>
                        </tr>
                      );
                    });
                  }

                  // Row without sources
                  return [
                    <tr key={record.key}>
                      <td>
                        <LotCellWrap>
                          <LotNameBlock>
                            <span style={{ display: 'block' }}>
                              {record.type === 'noexp' ? (
                                <Tag
                                  color="default"
                                  style={{ marginInlineEnd: 0 }}
                                >
                                  Sin vencimiento
                                </Tag>
                              ) : (
                                <>
                                  Lote{' '}
                                  {record.batchNumberId ??
                                    record.batchId ??
                                    'x'}
                                </>
                              )}
                            </span>
                            {rowModified && (
                              <Tag
                                color="orange"
                                size="small"
                                style={{ marginTop: 2 }}
                              >
                                Editado
                              </Tag>
                            )}
                          </LotNameBlock>
                        </LotCellWrap>
                      </td>
                      <td>
                        <DatePicker
                          value={dateValue}
                          format="DD/MM/YYYY"
                          allowClear
                          disabled={readOnly}
                          placeholder={
                            record.type === 'batch'
                              ? 'Sin fecha'
                              : 'Sin asignar'
                          }
                          onChange={(date) => {
                            if (!date) {
                              const hadExisting =
                                !!record.expirationDate ||
                                !!meta?.manualExpirationDate ||
                                !!dateValue;
                              if (!hadExisting) {
                                onChangeExpiration &&
                                  onChangeExpiration(record.key, undefined);
                                return;
                              }
                              if (record.type === 'batch') {
                                const prevVal = meta?.manualExpirationDate
                                  ? formatInputDate(meta.manualExpirationDate)
                                  : formatInputDate(record.expirationDate);
                                onChangeExpiration &&
                                  onChangeExpiration(record.key, undefined);
                                Modal.confirm({
                                  title: 'Eliminar fecha de lote',
                                  content:
                                    'La fecha se quitará de este lote y todos los lotes con el mismo número. ¿Continuar?',
                                  okText: 'Sí, eliminar',
                                  cancelText: 'Cancelar',
                                  okButtonProps: { danger: true },
                                  onOk: () => {
                                    onChangeExpiration &&
                                      onChangeExpiration(
                                        record.key,
                                        CLEAR_SENTINEL,
                                      );
                                    syncSameLotRecords(
                                      record.key,
                                      CLEAR_SENTINEL,
                                      record,
                                    );
                                  },
                                  onCancel: () => {
                                    if (prevVal)
                                      onChangeExpiration &&
                                        onChangeExpiration(record.key, prevVal);
                                  },
                                });
                              } else {
                                onChangeExpiration &&
                                  onChangeExpiration(record.key, undefined);
                              }
                              return;
                            }
                            const iso = date.toISODate();
                            onChangeExpiration &&
                              onChangeExpiration(record.key, iso);
                            if (record.type === 'batch')
                              syncSameLotRecords(record.key, iso, record);
                          }}
                        />
                      </td>
                      <td>
                        {record.locations?.length ? (
                          <TagsWrap>
                            {record.locations.map((l, idx) => {
                              const raw = l.location || '—';
                              const full = locationNamesMap[raw] || raw;
                              const shortened = shortenLocationPath(full);
                              const isLoadingLoc =
                                !locationNamesMap[raw] &&
                                !!resolvingLocations[raw];
                              return (
                                <Tooltip
                                  key={`${record.key}-loc-${idx}`}
                                  title={
                                    isLoadingLoc
                                      ? 'Resolviendo ubicación…'
                                      : full
                                  }
                                >
                                  <Tag>
                                    {isLoadingLoc ? (
                                      <span
                                        style={{ opacity: 0.6, fontSize: 11 }}
                                      >
                                        Cargando…
                                      </span>
                                    ) : (
                                      shortenLocationPath(shortened)
                                    )}
                                  </Tag>
                                </Tooltip>
                              );
                            })}
                          </TagsWrap>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong>{formatNumber(record.stock)}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <InputNumber
                          min={0}
                          value={real}
                          onChange={(val) =>
                            onChangeCount(record.key, Number(val ?? 0))
                          }
                          style={{ width: 90 }}
                          disabled={readOnly}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Diff $value={diff}>{formatNumber(diff)}</Diff>
                      </td>
                      <td>
                        {meta?.updatedBy ? (
                          <EditorsList
                            editors={[
                              {
                                uid: meta.updatedBy,
                                name:
                                  usersNameCache[meta.updatedBy] ||
                                  meta.updatedByName ||
                                  meta.updatedBy,
                                updatedAt: meta.updatedAt,
                              },
                            ]}
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!readOnly &&
                          (() => {
                            const menuItems = [];
                            if (record.type === 'batch' && originalDateStr) {
                              menuItems.push({
                                key: 'restore-date',
                                label:
                                  'Restablecer fecha de vencimiento original',
                                disabled: !isDifferentFromOriginal,
                                onClick: () => {
                                  onChangeExpiration &&
                                    onChangeExpiration(
                                      record.key,
                                      originalDateStr,
                                    );
                                  syncSameLotRecords(
                                    record.key,
                                    originalDateStr,
                                    record,
                                  );
                                },
                              });
                            }
                            const hasCurrentDate = dateValue || baseStr;
                            if (
                              (record.type === 'batch' ||
                                record.type === 'noexp') &&
                              hasCurrentDate
                            ) {
                              if (menuItems.length)
                                menuItems.push({ type: 'divider' });
                              menuItems.push({
                                key: 'clear-date',
                                label: 'Borrar fecha de vencimiento',
                                onClick: () => {
                                  onChangeExpiration &&
                                    onChangeExpiration(
                                      record.key,
                                      CLEAR_SENTINEL,
                                    );
                                  if (record.type === 'batch')
                                    syncSameLotRecords(
                                      record.key,
                                      CLEAR_SENTINEL,
                                      record,
                                    );
                                },
                              });
                            }
                            if (!record.sources?.length) {
                              const persistedRecordCount =
                                serverCounts[record.key] !== undefined
                                  ? Number(serverCounts[record.key])
                                  : Number(record.stock ?? 0);
                              const hasEditedRecordCount =
                                counts[record.key] !== undefined &&
                                Number(counts[record.key]) !==
                                  persistedRecordCount;
                              const baselineRecordCount =
                                baselineCounts[record.key];
                              const effectiveRecordVal =
                                counts[record.key] !== undefined
                                  ? Number(counts[record.key])
                                  : persistedRecordCount;
                              const canRestoreBaseline =
                                baselineRecordCount !== undefined &&
                                Number(baselineRecordCount) !==
                                  effectiveRecordVal;
                              if (hasEditedRecordCount) {
                                if (menuItems.length)
                                  menuItems.push({ type: 'divider' });
                                menuItems.push({
                                  key: 'restore-count-persisted',
                                  label: 'Restablecer conteo guardado',
                                  onClick: () =>
                                    onChangeCount(
                                      record.key,
                                      Number(persistedRecordCount),
                                    ),
                                });
                              }
                              if (canRestoreBaseline) {
                                if (!hasEditedRecordCount && menuItems.length)
                                  menuItems.push({ type: 'divider' });
                                menuItems.push({
                                  key: 'restore-count-baseline',
                                  label: 'Restablecer conteo original',
                                  onClick: () =>
                                    onChangeCount(
                                      record.key,
                                      Number(baselineRecordCount),
                                    ),
                                });
                              }
                            }
                            if (!menuItems.length) return null;
                            return (
                              <Dropdown
                                menu={{ items: menuItems }}
                                trigger={['click']}
                              >
                                <Button size="small">⋯</Button>
                              </Dropdown>
                            );
                          })()}
                      </td>
                    </tr>,
                  ];
                });
              })()}
            </tbody>
          </SimpleTable>
          {(() => {
            // Usar los totales precalculados del grupo para mantener consistencia
            // con la tabla principal y respetar el stock congelado cuando la sesion esta cerrada.
            const list = group._children || [];
            const totalStock = Number(group.totalStock || 0);
            const totalReal = Number(group.totalReal || 0);
            const totalDiff = totalReal - totalStock;
            return (
              <div style={{ marginTop: 16 }}>
                <SummaryBar
                  stats={[
                    { label: 'Lotes', value: list.length },
                    { label: 'Stock total', value: formatNumber(totalStock) },
                    {
                      label: 'Conteo real total',
                      value: formatNumber(totalReal),
                    },
                    {
                      label: 'Diferencia',
                      value: (
                        <Diff $value={totalDiff}>
                          {formatNumber(totalDiff)}
                        </Diff>
                      ),
                    },
                  ]}
                  justify="flex-start"
                />
              </div>
            );
          })()}
        </>
      )}
    </Modal>
  );
}

const SimpleTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead th {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  tbody td {
    padding: 10px 8px;
    vertical-align: top;
    border-bottom: 1px solid #f5f5f5;
  }
`;

const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const LotCellWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
`;

const LotNameBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 36px;
  line-height: 1.1;
`;

export default GroupedLotsModal;
