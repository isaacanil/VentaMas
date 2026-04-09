import { UnorderedListOutlined } from '@/constants/icons/antd';
import { Button, Dropdown, InputNumber, Modal, Tag, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';

import { ActionMenuButton } from '@/components/ActionMenuButton';
import DatePicker from '@/components/DatePicker';
import { CLEAR_SENTINEL } from '@/utils/inventory/constants';

import { EditorsList } from '../../../../inventoryTableComponents';
import {
  getEffectiveCount,
  getPersistedCount,
  normalizeExpirationValue,
  resolveLocationDisplay,
  formatDate,
  formatInputDate,
  formatNumber,
  getTsMs,
  shortenLocationPath,
  Diff,
  TagsWrap,
} from '../../../../inventoryTableUtils';
import { ProductNameCell } from '../../../components/ProductNameCell';

import type {
  InventoryGroup,
  InventoryLocation,
  TimestampLike,
} from '@/utils/inventory/types';
import type { MenuProps } from 'antd';
import type { BuildGroupedRowMetaParams, InventoryRowMeta } from '../types';

const FULL_WIDTH_STYLE = { width: '100%' };

export function buildGroupedRowMeta({
  group,
  baselineSnapshot,
  counts,
  countsMeta,
  expirationEdits,
  locationNamesMap,
  onChangeCount,
  onChangeExpiration,
  readOnly,
  resolvingLocations,
  resolvingUIDs,
  serverCounts,
  usersNameCache,
  setModalGroup,
}: BuildGroupedRowMetaParams) {
  const getLocationDisplay = (
    locKey: string | null | undefined,
    fallbackLabel = '',
  ): ReturnType<typeof resolveLocationDisplay> =>
    resolveLocationDisplay(
      locKey,
      fallbackLabel,
      locationNamesMap,
      resolvingLocations,
    );

  const buildMeta = (g: InventoryGroup): InventoryRowMeta => {
    if (!g) return {} as InventoryRowMeta;
    // Calcular número de lotes subyacentes (incluye sources dentro de un único child noexp o batch)
    const underlyingLotsCount = (g._children || []).reduce((acc, ch) => {
      if (Array.isArray(ch.sources) && ch.sources.length > 0)
        return acc + ch.sources.length;
      return acc + 1;
    }, 0);
    const hasMultipleUnderlyingLots = underlyingLotsCount > 1;
    // Detectar si hay ediciones a nivel source (cuando el usuario ya eligió modo detallado)
    const hasSourceEdits = (g._children || []).some((ch) =>
      (ch.sources || []).some((src) => {
        const skey = src.id || src.key;
        return skey && Object.prototype.hasOwnProperty.call(counts, skey);
      }),
    );

    // ------------------------------
    // Conteo real (consistencia con modal)
    // Prioridad de cada unidad: counts[key] (edición en memoria) -> serverCounts[key] (persistido) -> real inicial -> stock
    // Para grupos con múltiples lotes debemos sumar cada hijo y sus sources (evitando doble conteo) igual que en el modal.
    // ------------------------------
    const computeSummedReal = () => {
      return (g._children || []).reduce((acc, ch) => {
        if (Array.isArray(ch.sources) && ch.sources.length) {
          // Sumamos cada source individualmente
          const srcSum = ch.sources.reduce((s, src) => {
            const skey = src.id || src.key;
            const val = getEffectiveCount(
              counts,
              serverCounts,
              skey,
              src.real ?? src.stock ?? src.quantity ?? 0,
            );
            return s + Number(val || 0);
          }, 0);
          return acc + srcSum;
        }
        const childVal = getEffectiveCount(
          counts,
          serverCounts,
          ch.key,
          ch.real ?? ch.stock ?? 0,
        );
        return acc + Number(childVal || 0);
      }, 0);
    };

    let computedSummedReal: number | null = null;
    let conteoEl: ReactNode = null;
    let diffComputed = 0;

    if (hasSourceEdits || hasMultipleUnderlyingLots) {
      // Recalcular total a partir de cada unidad (children + sources)
      computedSummedReal = computeSummedReal();
      conteoEl = <span>{formatNumber(computedSummedReal)}</span>;
      diffComputed =
        Number(computedSummedReal || 0) - Number(g.totalStock || 0);
    } else {
      // Caso simple: usar edición agregada (topKey) o datos del grupo
      const baseReal = g.totalReal;
      conteoEl = <span>{formatNumber(baseReal)}</span>;
      diffComputed = Number(baseReal || 0) - Number(g.totalStock || 0);
    }

    // Si más abajo (en canEditAtTop) se transforma a InputNumber se recalculará allí el diff de nuevo.
    let diffEl: ReactNode = (
      <Diff $value={diffComputed}>{formatNumber(diffComputed)}</Diff>
    );
    const hasMultipleLots = hasMultipleUnderlyingLots; // mantener compatibilidad con nombre anterior
    let actionsEl: ReactNode = null;
    let userEl: ReactNode = null;
    let expirationNode: ReactNode = <span style={{ opacity: 0.6 }}>-</span>;
    let locationsNode: ReactNode = <span>-</span>;
    let expirationSortValue = '';

    // --------------------------------------------------
    // Detección de modificaciones (conteo o vencimiento)
    // --------------------------------------------------
    const normExp = (val: Parameters<typeof normalizeExpirationValue>[0]) =>
      normalizeExpirationValue(val);
    let isModified = false;
    for (const child of g._children || []) {
      const childKey = child.key;
      if (!childKey) continue;
      // Conteo efectivo actual (prioriza edición en counts, luego persistido)
      const persistedCount = getPersistedCount(
        serverCounts,
        childKey,
        Number(child.stock ?? 0),
      );
      const effectiveCount = getEffectiveCount(
        counts,
        serverCounts,
        childKey,
        Number(child.stock ?? 0),
      );
      const baseCount = baselineSnapshot.counts[childKey];
      if (
        baseCount !== undefined &&
        Number(effectiveCount) !== Number(baseCount)
      ) {
        isModified = true;
        break;
      }
      // Pending (counts vs persistido actual)
      if (
        Object.prototype.hasOwnProperty.call(counts, childKey) &&
        Number(counts[childKey]) !== Number(persistedCount)
      ) {
        isModified = true;
        break;
      }
      // Expiración persistida actual
      const metaVal = countsMeta[childKey]?.manualExpirationDate;
      let persistedExp =
        metaVal && metaVal !== CLEAR_SENTINEL
          ? metaVal
          : child.type === 'batch'
            ? formatInputDate(child.expirationDate ?? null)
            : '';
      persistedExp = normExp(persistedExp);
      const baseExp = baselineSnapshot.expirations[childKey];
      if (baseExp !== undefined && persistedExp !== baseExp) {
        isModified = true;
        break;
      }
      // Edits no guardados (señal inmediata)
      if (expirationEdits[childKey] !== undefined) {
        isModified = true;
        break;
      }
      if (child.sources) {
        for (const src of child.sources) {
          const skey = src.id || src.key;
          if (!skey) continue;
          const srcPersisted = getPersistedCount(
            serverCounts,
            skey,
            Number(src.stock ?? src.quantity ?? 0),
          );
          const srcEffective = getEffectiveCount(
            counts,
            serverCounts,
            skey,
            Number(src.stock ?? src.quantity ?? 0),
          );
          const baseSrcCount = baselineSnapshot.counts[skey];
          if (
            baseSrcCount !== undefined &&
            Number(srcEffective) !== Number(baseSrcCount)
          ) {
            isModified = true;
            break;
          }
          if (
            Object.prototype.hasOwnProperty.call(counts, skey) &&
            Number(counts[skey]) !== Number(srcPersisted)
          ) {
            isModified = true;
            break;
          }
          const sMetaVal = countsMeta[skey]?.manualExpirationDate;
          let sExp =
            sMetaVal && sMetaVal !== CLEAR_SENTINEL
              ? sMetaVal
              : src.expirationDate
                ? formatInputDate(src.expirationDate ?? null)
                : child.type === 'batch'
                  ? formatInputDate(child.expirationDate ?? null)
                  : '';
          sExp = normExp(sExp);
          const baseSExp = baselineSnapshot.expirations[skey];
          if (baseSExp !== undefined && sExp !== baseSExp) {
            isModified = true;
            break;
          }
          if (expirationEdits[skey] !== undefined) {
            isModified = true;
            break;
          }
        }
        if (isModified) break;
      }
    }
    // Considerar fecha manual guardada a nivel de grupo (topKey)
    if (!isModified && g.canEditAtTop && g.topKey) {
      const key = g.topKey;
      const firstChild = g._children?.[0];
      const originalTop =
        firstChild?.type === 'batch'
          ? formatInputDate(firstChild?.expirationDate ?? null)
          : '';
      const editTop = expirationEdits[key];
      const metaTop = countsMeta[key]?.manualExpirationDate;
      const currentTop = (() => {
        if (editTop !== undefined) {
          if (editTop === CLEAR_SENTINEL) return '';
          return normExp(editTop);
        }
        if (metaTop && metaTop !== CLEAR_SENTINEL) return normExp(metaTop);
        return originalTop || '';
      })();
      const baseTop = baselineSnapshot.expirations[key];
      if (baseTop !== undefined) {
        if (currentTop !== baseTop) isModified = true;
      } else {
        // Sin baseline: marcar como modificado si difiere del original
        if (currentTop !== (originalTop || '')) isModified = true;
      }
    }
    // Pendiente en topKey (edición agregada) si no se detectó antes
    if (
      !isModified &&
      g.canEditAtTop &&
      g.topKey &&
      Object.prototype.hasOwnProperty.call(counts, g.topKey)
    ) {
      const key = g.topKey;
      const firstChild = g._children?.[0];
      const persistedTop = getPersistedCount(
        serverCounts,
        key,
        Number(firstChild?.stock ?? 0),
      );
      if (Number(counts[key]) !== Number(persistedTop)) isModified = true;
    }

    // Nodo Producto con indicador
    const productName = g.productName || '—';
    const productNameNode = (
      <ProductNameCell productName={productName} isModified={isModified} />
    );

    // Aggregated locations across children
    const allLocations: InventoryLocation[] = [];
    (g._children || []).forEach((c) => {
      if (Array.isArray(c.locations)) allLocations.push(...c.locations);
    });
    if (allLocations.length) {
      const agg = new Map<string, { quantity: number; label: string }>();
      for (const l of allLocations) {
        const locKey = l?.locationKey || l?.location;
        if (!locKey) continue;
        const prev = agg.get(locKey) || { quantity: 0, label: '' };
        agg.set(locKey, {
          quantity: prev.quantity + Number(l.quantity || 0),
          label: prev.label || l?.locationLabel || '',
        });
      }
      const entries = Array.from(agg.entries()).sort(
        (a, b) => b[1].quantity - a[1].quantity,
      );
      const MAX_SHOW = 2;
      const shown = entries.slice(0, MAX_SHOW);
      const extra = entries.length - shown.length;
      locationsNode = (
        <TagsWrap>
          {shown.map(([loc, data]) => {
            const { label, isLoading } = getLocationDisplay(loc, data.label);
            const displayLabel = shortenLocationPath(label);
            return (
              <Tooltip
                key={loc}
                title={`${label} (${formatNumber(data.quantity)})`}
              >
                <Tag>
                  <span style={isLoading ? { opacity: 0.7 } : undefined}>
                    {displayLabel}
                  </span>
                </Tag>
              </Tooltip>
            );
          })}
          {extra > 0 && (
            <Tooltip
              title={
                <div>
                  {entries.slice(MAX_SHOW).map(([loc, data]) => {
                    const { label } = getLocationDisplay(loc, data.label);
                    return (
                      <div key={loc}>
                        {label} ({formatNumber(data.quantity)})
                      </div>
                    );
                  })}
                </div>
              }
            >
              <Tag>+{extra}</Tag>
            </Tooltip>
          )}
        </TagsWrap>
      );
    }

    if (g.canEditAtTop && g.topKey) {
      const child = g._children?.[0];
      const childType = child?.type;
      const childKey = child?.key;
      const childSources = child?.sources;
      // Si hay ediciones por source, forzar modo detallado y bloquear edición agregada
      const value = (() => {
        if (
          hasSourceEdits &&
          Array.isArray(childSources) &&
          childSources.length
        ) {
          return childSources.reduce((s, src) => {
            const skey = src.id || src.key;
            const fallback = Number(src.real ?? src.stock ?? src.quantity ?? 0);
            const val = skey
              ? getEffectiveCount(counts, serverCounts, skey, fallback)
              : fallback;
            return s + Number(val || 0);
          }, 0);
        }
        return counts[g.topKey] ?? child?.real ?? g.totalReal;
      })();
      if (hasSourceEdits) {
        conteoEl = <strong>{formatNumber(value)}</strong>;
      } else {
        const key = g.topKey!;
        conteoEl = (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => onChangeCount(key, Number(val ?? 0))}
            style={FULL_WIDTH_STYLE}
            disabled={readOnly}
          />
        );
      }
      const diff = Number(value ?? 0) - Number(g.totalStock ?? 0);
      diffEl = <Diff $value={diff}>{formatNumber(diff)}</Diff>;

      // Detectar diferencias entre valores actuales persistidos y baseline original - para todos los productos
      const editedPairs: Array<[string, number]> = [];
      // NUEVO: detectar ediciones pendientes (counts vs persistido actual)
      const pendingCountPairs: Array<[string, number]> = [];
      const pushIfPending = (key: string | undefined, persisted: number) => {
        if (!key) return;
        if (Object.prototype.hasOwnProperty.call(counts, key)) {
          const current = Number(counts[key]);
          if (Number(current) !== Number(persisted))
            pendingCountPairs.push([key, persisted]);
        }
      };
      // top agregado (si aplica)
      {
        const currentPersistedTop = getPersistedCount(
          serverCounts,
          g.topKey,
          Number(child?.stock ?? 0),
        );
        const baselineTop = baselineSnapshot.counts[g.topKey];
        if (
          g.topKey &&
          baselineTop !== undefined &&
          Number(currentPersistedTop) !== Number(baselineTop)
        ) {
          editedPairs.push([g.topKey, baselineTop]);
        }
        // pending top
        pushIfPending(g.topKey, currentPersistedTop);
      }
      // children + sources
      (g._children || []).forEach((ch) => {
        const currentPersistedChild = getPersistedCount(
          serverCounts,
          ch.key,
          Number(ch.stock ?? 0),
        );
        const baselineChild = baselineSnapshot.counts[ch.key];
        if (
          baselineChild !== undefined &&
          Number(currentPersistedChild) !== Number(baselineChild)
        ) {
          editedPairs.push([ch.key, baselineChild]);
        }
        pushIfPending(ch.key, currentPersistedChild);
        (ch.sources || []).forEach((src) => {
          const skey = src.id || src.key;
          if (!skey) return;
          const currentPersistedSrc = getPersistedCount(
            serverCounts,
            skey,
            Number(src.stock ?? src.quantity ?? 0),
          );
          const baselineSrc = baselineSnapshot.counts[skey];
          if (
            baselineSrc !== undefined &&
            Number(currentPersistedSrc) !== Number(baselineSrc)
          ) {
            editedPairs.push([skey, baselineSrc]);
          }
          pushIfPending(skey, currentPersistedSrc);
        });
      });

      // Expiration editable/visible a nivel agregado (usar topKey para guardar/leer manual)
      if ((childType === 'batch' || childType === 'noexp') && !readOnly) {
        const key = g.topKey!;
        // Determinar estado: si no hay editVal en expirationEdits, usar valores guardados
        const editVal = expirationEdits?.[key];
        const hasEditState = Object.prototype.hasOwnProperty.call(
          expirationEdits,
          key,
        );
        const manualMetaVal = countsMeta[key]?.manualExpirationDate;
        const manualVal =
          manualMetaVal && manualMetaVal !== CLEAR_SENTINEL
            ? formatInputDate(manualMetaVal ?? null)
            : '';
        const originalVal =
          childType === 'batch'
            ? formatInputDate(child?.expirationDate ?? null)
            : '';
        const isRemoved =
          editVal === CLEAR_SENTINEL || manualMetaVal === CLEAR_SENTINEL;

        let currentStr = '';
        if (hasEditState) {
          // Hay estado de edición: usar ese valor (puede ser undefined, null, CLEAR_SENTINEL, o fecha)
          if (editVal === CLEAR_SENTINEL) {
            currentStr = ''; // mostrar vacío si está marcado para eliminar
          } else if (editVal) {
            currentStr = editVal; // fecha editada
          }
          // Si editVal es undefined/null, currentStr queda vacío (campo limpio)
        } else {
          // No hay estado de edición: usar valores persistidos/originales
          currentStr = manualVal || originalVal || '';
        }
        const valueDay = (() => {
          if (!currentStr) return null;
          const parsed = DateTime.fromISO(currentStr);
          return parsed.isValid ? parsed : null;
        })();
        expirationSortValue = currentStr || '';
        const hasOriginal = !!originalVal;
        // Mostrar DatePicker
        expirationNode = (
          <DatePicker
            value={valueDay}
            format="DD/MM/YYYY"
            allowClear
            placeholder={hasOriginal ? 'Sin fecha' : 'Sin asignar'}
            disabledDate={(d) =>
              d &&
              d.endOf('day').toMillis() <
                DateTime.local().startOf('day').toMillis()
            }
            onChange={(date) => {
              if (!date) {
                // intento de limpiar
                const hadExisting =
                  !!originalVal || !!manualVal || !!currentStr;
                if (!hadExisting) {
                  // Eliminar del estado para que se vea vacío inmediatamente
                  onChangeExpiration && onChangeExpiration(key, undefined);
                  return;
                }
                if (childType === 'batch' && hasOriginal) {
                  // Marcar sentinel para eliminar, pero eliminar inmediatamente del estado edit
                  const prevVal = manualVal || originalVal;
                  onChangeExpiration && onChangeExpiration(key, undefined);
                  Modal.confirm({
                    title: 'Eliminar fecha de lote',
                    content:
                      'La fecha se quitará en la sesión (no altera aún el lote real). ¿Continuar?',
                    okText: 'Sí, eliminar',
                    cancelText: 'Cancelar',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      // Confirmar: marcar para eliminar
                      onChangeExpiration &&
                        onChangeExpiration(key, CLEAR_SENTINEL);
                    },
                    onCancel: () => {
                      // Cancelar: restaurar fecha previa
                      if (prevVal)
                        onChangeExpiration && onChangeExpiration(key, prevVal);
                    },
                  });
                } else {
                  onChangeExpiration && onChangeExpiration(key, undefined);
                }
                return;
              }
              const iso = date.toISODate();
              onChangeExpiration && onChangeExpiration(key, iso);
            }}
            style={FULL_WIDTH_STYLE}
          />
        );
        // Acciones: restablecer fecha y/o conteo real
        const actions: NonNullable<MenuProps['items']> = [];
        // --- Restablecer fecha de vencimiento (siempre visible si hay original) ---
        const canShowRestoreDate = hasOriginal;
        const isDateDifferent =
          isRemoved || (currentStr && currentStr !== originalVal);

        if (canShowRestoreDate) {
          actions.push({
            key: 'reset-original-date',
            label: 'Restablecer fecha de vencimiento original',
            disabled: !isDateDifferent,
            onClick: () =>
              onChangeExpiration && onChangeExpiration(key, originalVal),
          });
        }
        // --- Restablecer conteo real --- (prioriza pendientes)
        const restorePairs = pendingCountPairs.length
          ? pendingCountPairs
          : editedPairs;
        if (restorePairs.length) {
          if (actions.length) actions.push({ type: 'divider' });
          actions.push({
            key: 'reset-counts',
            label: 'Restablecer conteo real',
            onClick: () => {
              restorePairs.forEach(([k, v]) => onChangeCount(k, Number(v)));
            },
          });
        }
        if (actions.length) {
          actionsEl = (
            <Dropdown
              menu={{ items: actions }}
              placement="bottomRight"
              trigger={['click']}
            >
              <ActionMenuButton />
            </Dropdown>
          );
        }
      } else if (childType === 'batch') {
        // Considerar manual a nivel de grupo o cualquier source dentro del lote
        const groupManual =
          countsMeta[g.topKey]?.manualExpirationDate ||
          (childKey ? countsMeta[childKey]?.manualExpirationDate : undefined);
        const anySourceManual =
          Array.isArray(childSources) &&
          childSources.some((src) => {
            const skey = src.id || src.key;
            return !!countsMeta[skey]?.manualExpirationDate;
          });
        const isManual = !!(groupManual || anySourceManual);
        const effectiveStr = groupManual
          ? formatInputDate(groupManual ?? null)
          : formatInputDate(child?.expirationDate ?? null);
        expirationSortValue = effectiveStr || '';
        const displayDate =
          effectiveStr || formatInputDate(child?.expirationDate ?? null);
        expirationNode = (
          <span>
            {displayDate ? (
              formatDate(displayDate)
            ) : (
              <span style={{ opacity: 0.6 }}>-</span>
            )}
            {isManual && (
              <Tag color="gold" style={{ marginLeft: 4 }}>
                Manual
              </Tag>
            )}
          </span>
        );
      } else if (childType === 'noexp') {
        const manualExists =
          countsMeta[g.topKey]?.manualExpirationDate ||
          (childKey ? countsMeta[childKey]?.manualExpirationDate : undefined)
            ? true
            : false;
        expirationNode = (
          <span style={{ opacity: 0.7 }}>
            {manualExists ? <Tag color="gold">Manual</Tag> : '-'}
          </span>
        );
        expirationSortValue = '';
      }

      // Para productos sin fechas editables pero con cambios de conteo, mostrar botón de restablecer
      if (!actionsEl && !readOnly) {
        const restorePairs = pendingCountPairs.length
          ? pendingCountPairs
          : editedPairs;
        if (restorePairs.length) {
          const actions: NonNullable<MenuProps['items']> = [
            {
              key: 'reset-counts',
              label: 'Restablecer conteo real',
              onClick: () => {
                restorePairs.forEach(([k, v]) => onChangeCount(k, Number(v)));
              },
            },
          ];
          actionsEl = (
            <Dropdown
              menu={{ items: actions }}
              placement="bottomRight"
              trigger={['click']}
            >
              <ActionMenuButton />
            </Dropdown>
          );
        }
      }

      // Recolectar editores para grupo con un solo hijo
      const editorsMap = new Map<
        string,
        { uid: string; name: string; updatedAt?: TimestampLike }
      >();
      const meta = g.topKey ? countsMeta[g.topKey] : undefined;
      if (meta?.updatedBy) {
        const uid = meta.updatedBy;
        const updatedAt = meta.updatedAt;
        editorsMap.set(uid, {
          uid,
          name: usersNameCache[uid] || meta.updatedByName || uid,
          updatedAt: updatedAt ?? null,
        });
      }
      if (editorsMap.size) {
        const editors = Array.from(editorsMap.values()).sort(
          (a, b) => getTsMs(b.updatedAt ?? null) - getTsMs(a.updatedAt ?? null),
        );
        // Mostrar "Cargando…" solo si realmente falta nombre y el UID está resolviéndose
        const currentUid = meta?.updatedBy;
        const needsName = !!(
          currentUid &&
          !usersNameCache[currentUid] &&
          !meta?.updatedByName
        );
        const anyLoading = !!(
          currentUid &&
          needsName &&
          resolvingUIDs[currentUid]
        );
        userEl = anyLoading ? (
          <span style={{ fontSize: 11, color: '#6b7280' }}>Cargando…</span>
        ) : (
          <EditorsList editors={editors} />
        );
      }
    }

    if (hasMultipleLots) {
      // Detectar diferencias entre valores actuales persistidos y baseline original en todo el grupo
      const editedPairs: Array<[string, number]> = [];
      // NUEVO: detectar ediciones pendientes (counts vs persistido)
      const pendingCountPairs: Array<[string, number]> = [];
      (g._children || []).forEach((ch) => {
        const currentPersistedChild = getPersistedCount(
          serverCounts,
          ch.key,
          Number(ch.stock ?? 0),
        );
        const baselineChild = baselineSnapshot.counts[ch.key];
        if (
          baselineChild !== undefined &&
          Number(currentPersistedChild) !== Number(baselineChild)
        ) {
          editedPairs.push([ch.key, baselineChild]);
        }
        if (
          Object.prototype.hasOwnProperty.call(counts, ch.key) &&
          Number(counts[ch.key]) !== Number(currentPersistedChild)
        ) {
          pendingCountPairs.push([ch.key, currentPersistedChild]);
        }
        (ch.sources || []).forEach((src) => {
          const skey = src.id || src.key;
          if (!skey) return;
          const currentPersistedSrc = getPersistedCount(
            serverCounts,
            skey,
            Number(src.stock ?? src.quantity ?? 0),
          );
          const baselineSrc = baselineSnapshot.counts[skey];
          if (
            baselineSrc !== undefined &&
            Number(currentPersistedSrc) !== Number(baselineSrc)
          ) {
            editedPairs.push([skey, baselineSrc]);
          }
          if (
            Object.prototype.hasOwnProperty.call(counts, skey) &&
            Number(counts[skey]) !== Number(currentPersistedSrc)
          ) {
            pendingCountPairs.push([skey, currentPersistedSrc]);
          }
        });
      });

      // (Opcional) Detectar claves de fecha a restaurar al original
      const dateResetPairs: Array<[string, string]> = [];
      const norm = (
        v: Parameters<typeof formatInputDate>[0] | null | undefined,
      ) => {
        if (!v || v === CLEAR_SENTINEL) return '';
        if (typeof v === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(v)) return v;
        return formatInputDate(v ?? null) || '';
      };
      (g._children || []).forEach((ch) => {
        // Nivel hijo (lote agrupado)
        if (ch.type === 'batch' && ch.expirationDate) {
          const key = ch.key;
          const originalStr = norm(ch.expirationDate);
          const metaVal = countsMeta[key]?.manualExpirationDate;
          const editVal = expirationEdits[key];
          const isRemoved =
            editVal === CLEAR_SENTINEL || metaVal === CLEAR_SENTINEL;
          const currentStr = isRemoved
            ? CLEAR_SENTINEL
            : norm(editVal) || norm(metaVal) || originalStr;
          const changed =
            currentStr === CLEAR_SENTINEL ||
            (!!currentStr && currentStr !== originalStr);
          if (changed && originalStr) dateResetPairs.push([key, originalStr]);
        }
        // Nivel source
        (ch.sources || []).forEach((src) => {
          const skey = src.id || src.key;
          if (!skey) return;
          const original = src.expirationDate || ch.expirationDate;
          if (!original) return;
          const originalStr = norm(original);
          const sMetaVal = countsMeta[skey]?.manualExpirationDate;
          const sEditVal = expirationEdits[skey];
          const sRemoved =
            sEditVal === CLEAR_SENTINEL || sMetaVal === CLEAR_SENTINEL;
          const currentStr = sRemoved
            ? CLEAR_SENTINEL
            : norm(sEditVal) || norm(sMetaVal) || originalStr;
          const changed =
            currentStr === CLEAR_SENTINEL ||
            (!!currentStr && currentStr !== originalStr);
          if (changed && originalStr) dateResetPairs.push([skey, originalStr]);
        });
      });

      const restorePairs = pendingCountPairs.length
        ? pendingCountPairs
        : editedPairs;
      const menuItems: NonNullable<MenuProps['items']> = [
        {
          key: 'open-modal',
          label: 'Editar lotes',
          onClick: () => setModalGroup(g),
        },
      ];
      if (editedPairs.length || dateResetPairs.length) {
        menuItems.push({ type: 'divider' });
      }
      menuItems.push(
        {
          key: 'reset-counts',
          label: 'Restablecer conteo real',
          disabled: restorePairs.length === 0,
          onClick: () =>
            restorePairs.forEach(([k, v]) => onChangeCount(k, Number(v))),
        },
        {
          key: 'reset-dates',
          label: 'Restablecer fecha de vencimiento original',
          disabled: dateResetPairs.length === 0,
          onClick: () =>
            dateResetPairs.forEach(
              ([k, orig]) => onChangeExpiration && onChangeExpiration(k, orig),
            ),
        },
      );

      actionsEl = readOnly ? (
        <Tooltip title="Editar lotes">
          <Button
            icon={<UnorderedListOutlined />}
            onClick={() => setModalGroup(g)}
          />
        </Tooltip>
      ) : (
        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <ActionMenuButton />
        </Dropdown>
      );
      // Recolectar todos los editores de los hijos
      const editorsMap = new Map<
        string,
        { uid: string; name: string; updatedAt?: TimestampLike }
      >();
      (g._children || []).forEach((ch) => {
        const meta = countsMeta[ch.key];
        if (!meta?.updatedBy) return;
        const uid = meta.updatedBy;
        const existing = editorsMap.get(uid);
        const updatedAt = meta.updatedAt;
        const existingMs = existing ? getTsMs(existing.updatedAt ?? null) : -1;
        const currentMs = getTsMs(updatedAt ?? null);
        if (!existing || currentMs > existingMs) {
          editorsMap.set(uid, {
            uid,
            name: usersNameCache[uid] || meta.updatedByName || uid,
            updatedAt,
          });
        }
      });
      if (editorsMap.size) {
        const editors = Array.from(editorsMap.values()).sort(
          (a, b) => getTsMs(b.updatedAt ?? null) - getTsMs(a.updatedAt ?? null),
        );
        // Revisa cada hijo: si falta nombre (no cache y no updatedByName) y está resolviéndose
        const anyLoading = (g._children || []).some((ch) => {
          const m = countsMeta[ch.key];
          const uid = m?.updatedBy;
          if (!uid) return false;
          const hasName = !!(uid && (usersNameCache[uid] || m?.updatedByName));
          return !!(uid && !hasName && resolvingUIDs[uid as string]);
        });
        userEl = anyLoading ? (
          <span style={{ fontSize: 11, color: '#6b7280' }}>Cargando…</span>
        ) : (
          <EditorsList editors={editors} />
        );
      }
      // Expiration summary for multiple lots (usar fecha efectiva: manual en grupo/source o fecha original)
      const expirations = new Set<string>();
      (g._children || []).forEach((c) => {
        if (c.type !== 'batch') return;
        const groupManual = countsMeta[c.key]?.manualExpirationDate;
        if (groupManual) {
          const s = formatInputDate(groupManual ?? null);
          if (s) expirations.add(formatDate(s));
          return;
        }
        // Si no hay manual a nivel grupo, revisar sources
        let added = false;
        if (Array.isArray(c.sources)) {
          for (const src of c.sources) {
            const skey = src.id || src.key;
            const sMan = countsMeta[skey]?.manualExpirationDate;
            if (sMan) {
              const s = formatInputDate(sMan ?? null);
              if (s) expirations.add(formatDate(s));
              added = true;
              break;
            }
          }
        }
        if (!added && c.expirationDate) {
          expirations.add(formatDate(c.expirationDate ?? null));
        }
      });
      if (expirations.size) {
        const list = Array.from(expirations).filter((value): value is string =>
          Boolean(value),
        );
        const preview = list.slice(0, 2).join(', ');
        const rest = list.slice(2);
        expirationNode = (
          <Tooltip
            title={list.map((d) => (
              <div key={d}>{d}</div>
            ))}
          >
            <span>
              {preview}
              {rest.length ? `, +${rest.length}` : ''}
            </span>
          </Tooltip>
        );
        expirationSortValue = list.sort()[0] || '';
      } else {
        expirationNode = <span style={{ opacity: 0.6 }}>-</span>;
        expirationSortValue = '';
      }
    }

    const meta = {
      ...g,
      productNameNode, // para la columna Producto
      conteoNode: conteoEl,
      diffNode: diffEl,
      userNode: userEl,
      expirationNode,
      expirationSortValue,
      locationsNode,
      actionsNode: actionsEl,
      _hasMultipleLots: hasMultipleLots,
    };
    return meta;
  };

  return buildMeta(group);
}
