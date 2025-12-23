import { UnorderedListOutlined } from '@ant-design/icons';
import {
  InputNumber,
  Tag,
  Tooltip,
  Empty,
  Button,
  DatePicker,
  Dropdown,
  Modal,
} from 'antd';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';

import { GroupedLotsModal } from './GroupedLotsModal';
import { EditorsList } from './inventoryTableComponents.jsx';
import {
  formatNumber,
  formatInputDate,
  formatDate,
  shortenLocationPath,
  getTsMs,
  Diff,
  TagsWrap,
} from './inventoryTableUtils.js';

/**
 * InventoryGroupedTable
 * Props:
 * - groups: Array<{
 *     productId, productName, totalStock, totalReal, totalDiff,
 *     children: Array<{
 *       key, type: 'noexp' | 'batch', productId, productName,
 *       batchId?: string, batchNumberId?: number | string,
 *       expirationDate?: any, // Date | string | null
 *       stock: number,
 *       real: number,
 *       diff: number,
 *       locations: Array<{ location: string, quantity: number }>
 *     }>
 *   }>
 * - counts: Record<string, number>
 * - onChangeCount: (key: string, value: number) => void
 * - loading: boolean
 */
export default function InventoryGroupedTable({
  groups,
  counts,
  countsMeta = {},
  usersNameCache = {},
  resolvingUIDs = {},
  locationNamesMap = {},
  resolvingLocations = {},
  onChangeCount,
  loading,
  readOnly = false,
  expirationEdits = {},
  onChangeExpiration,
  rowSize = 'medium',
  onSave,
  serverCounts = {},
  saving = false,
}) {
  const [modalGroup, setModalGroup] = useState(null); // grupo seleccionado para ver lotes
  // Eliminado noExpDetails y modal asociado; ya no se muestran detalles separados para "sin vencimiento".
  const CLEAR_SENTINEL = '__REMOVE__';
  // Baseline para mantener indicador de cambios incluso tras guardar
  // Derivar baseline usando useMemo en lugar de useState+useEffect
  const baselineSnapshot = useMemo(() => {
    if (!groups || !groups.length) {
      return { counts: {}, expirations: {} };
    }

    const countsBase = {};
    const expBase = {};
    const norm = (d) => formatInputDate(d) || '';
    
    groups.forEach((g) => {
      (g._children || []).forEach((ch) => {
        const key = ch.key;
        if (key && countsBase[key] === undefined) {
          const persistedCount =
            serverCounts[key] !== undefined
              ? Number(serverCounts[key])
              : Number(ch.stock ?? 0);
          countsBase[key] = Number(persistedCount);
        }
        if (key && expBase[key] === undefined) {
          const metaVal = countsMeta[key]?.manualExpirationDate;
          if (metaVal && metaVal !== CLEAR_SENTINEL)
            expBase[key] = norm(metaVal);
          else if (ch.type === 'batch' && ch.expirationDate)
            expBase[key] = norm(formatInputDate(ch.expirationDate));
          else expBase[key] = '';
        }
        if (Array.isArray(ch.sources)) {
          ch.sources.forEach((src) => {
            const skey = src.id || src.key;
            if (!skey) return;
            if (countsBase[skey] === undefined) {
              const persisted =
                serverCounts[skey] !== undefined
                  ? Number(serverCounts[skey])
                  : Number(src.stock ?? src.quantity ?? 0);
              countsBase[skey] = Number(persisted);
            }
            if (expBase[skey] === undefined) {
              const sMetaVal = countsMeta[skey]?.manualExpirationDate;
              if (sMetaVal && sMetaVal !== CLEAR_SENTINEL)
                expBase[skey] = norm(sMetaVal);
              else if (src.expirationDate)
                expBase[skey] = norm(formatInputDate(src.expirationDate));
              else if (ch.type === 'batch' && ch.expirationDate)
                expBase[skey] = norm(formatInputDate(ch.expirationDate));
              else expBase[skey] = '';
            }
          });
        }
      });
      // Baseline también para claves agregadas (topKey) cuando aplique
      if (g.topKey) {
        // Counts baseline para topKey
        if (countsBase[g.topKey] === undefined) {
          const firstChild = (g._children || [])[0] || {};
          const persistedTop =
            serverCounts[g.topKey] !== undefined
              ? Number(serverCounts[g.topKey])
              : Number(firstChild.stock ?? 0);
          countsBase[g.topKey] = Number(persistedTop);
        }
        // Expiration baseline para topKey: manual del grupo o fecha original del primer hijo (si es batch)
        if (expBase[g.topKey] === undefined) {
          const firstChild = (g._children || [])[0] || {};
          const m = countsMeta[g.topKey]?.manualExpirationDate;
          if (m && m !== CLEAR_SENTINEL) expBase[g.topKey] = norm(m);
          else if (firstChild.type === 'batch' && firstChild.expirationDate)
            expBase[g.topKey] = norm(
              formatInputDate(firstChild.expirationDate),
            );
          else expBase[g.topKey] = '';
        }
      }
    });
    
    return { counts: countsBase, expirations: expBase };
  }, [groups, serverCounts, countsMeta]);

  // Mapear a columnas de AdvancedTable
  // Columnas (incluye indicador de cambios en Producto)
  const columns = useMemo(
    () => [
      {
        Header: 'Producto',
        accessor: 'productNameNode',
        sortable: true,
        align: 'left',
        minWidth: '220px',
        maxWidth: '1.3fr',
        cell: ({ value }) => value,
        // Usar el nombre real para ordenamiento alfabético
        sortableValue: (val, row) => row?.productName?.toLowerCase?.() || '',
      },
      {
        Header: 'Vencimiento',
        accessor: 'expirationNode',
        sortable: true,
        align: 'left',
        minWidth: '140px',
        maxWidth: '1fr',
        cell: ({ value }) => value,
        sortableValue: (val, row) => {
          // Use hidden sort value computed per-row
          return row?.expirationSortValue || '';
        },
      },
      {
        Header: 'Ubicaciones',
        accessor: 'locationsNode',
        align: 'left',
        minWidth: '220px',
        maxWidth: '1.4fr',
        cell: ({ value }) => value,
      },
      {
        Header: 'Stock',
        accessor: 'totalStock',
        align: 'right',
        minWidth: '110px',
        maxWidth: '0.6fr',
        cell: ({ value }) => <strong>{formatNumber(value)}</strong>,
      },
      {
        Header: 'Conteo real',
        accessor: 'conteoNode',
        align: 'right',
        minWidth: '130px',
        maxWidth: '0.7fr',
        clickable: false,
        cell: ({ value }) => value,
      },
      {
        Header: 'Diferencia',
        accessor: 'diffNode',
        align: 'right',
        minWidth: '130px',
        maxWidth: '0.7fr',
        cell: ({ value }) => value,
      },
      {
        Header: 'Editado por',
        accessor: 'userNode',
        align: 'left',
        minWidth: '180px',
        maxWidth: '1.2fr',
        clickable: false,
        cell: ({ value }) => value,
      },
      {
        Header: 'Acción',
        accessor: 'actionsNode',
        align: 'right',
        minWidth: '70px',
        maxWidth: '0.5fr',
        clickable: false,
        cell: ({ value }) => value,
      },
    ],
    [],
  );

  // Preconstruir nodos para columnas que necesitan estado/handlers
  const rows = useMemo(() => {
    if (!groups) return [];
    // Helper: valor persistido para una key (serverCounts o fallback a stock/quantity)
    const getPersistedCount = (k, node) => {
      if (serverCounts[k] !== undefined) return Number(serverCounts[k]);
      if (node && typeof node === 'object') {
        const stock = Number(node.stock ?? node.quantity ?? 0);
        return isFinite(stock) ? stock : 0;
      }
      return 0;
    };
    return groups.map((g) => {
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
              const val =
                counts[skey] ??
                serverCounts[skey] ??
                src.real ??
                src.stock ??
                src.quantity ??
                0;
              return s + Number(val || 0);
            }, 0);
            return acc + srcSum;
          }
          const childVal =
            counts[ch.key] ?? serverCounts[ch.key] ?? ch.real ?? ch.stock ?? 0;
          return acc + Number(childVal || 0);
        }, 0);
      };

      let computedSummedReal = null;
      let conteoEl = null;
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
      let diffEl = (
        <Diff $value={diffComputed}>{formatNumber(diffComputed)}</Diff>
      );
      const hasMultipleLots = hasMultipleUnderlyingLots; // mantener compatibilidad con nombre anterior
      let actionsEl = null;
      let userEl = null;
      let expirationNode = <span style={{ opacity: 0.6 }}>-</span>;
      let locationsNode = <span>-</span>;
      let expirationSortValue = '';

      // --------------------------------------------------
      // Detección de modificaciones (conteo o vencimiento)
      // --------------------------------------------------
      const normExp = (val) => {
        if (!val || val === CLEAR_SENTINEL) return '';
        // val puede venir como fecha completa o ya normalizada
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        return formatInputDate(val) || '';
      };
      let isModified = false;
      for (const child of g._children || []) {
        const childKey = child.key;
        // Conteo efectivo actual (prioriza edición en counts, luego persistido)
        const persistedCount =
          serverCounts[childKey] !== undefined
            ? Number(serverCounts[childKey])
            : Number(child.stock ?? 0);
        const effectiveCount =
          counts[childKey] !== undefined ? counts[childKey] : persistedCount;
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
              ? formatInputDate(child.expirationDate)
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
            const srcPersisted =
              serverCounts[skey] !== undefined
                ? Number(serverCounts[skey])
                : Number(src.stock ?? src.quantity ?? 0);
            const srcEffective =
              counts[skey] !== undefined ? counts[skey] : srcPersisted;
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
                  ? formatInputDate(src.expirationDate)
                  : child.type === 'batch'
                    ? formatInputDate(child.expirationDate)
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
        const firstChild = (g._children || [])[0] || {};
        const originalTop =
          firstChild.type === 'batch'
            ? formatInputDate(firstChild.expirationDate)
            : '';
        const editTop = expirationEdits[g.topKey];
        const metaTop = countsMeta[g.topKey]?.manualExpirationDate;
        const currentTop = (() => {
          if (editTop !== undefined) {
            if (editTop === CLEAR_SENTINEL) return '';
            return normExp(editTop);
          }
          if (metaTop && metaTop !== CLEAR_SENTINEL) return normExp(metaTop);
          return originalTop || '';
        })();
        const baseTop = baselineSnapshot.expirations[g.topKey];
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
        const firstChild = (g._children || [])[0];
        const persistedTop = getPersistedCount(g.topKey, firstChild);
        if (Number(counts[g.topKey]) !== Number(persistedTop))
          isModified = true;
      }

      // Nodo Producto con indicador
      const productName = g.productName || '—';
      const productNameNode = (
        <Tooltip title={productName} placement="topLeft">
          <ProductNameWrapper>
            <ProductNameCell>{productName}</ProductNameCell>
            {isModified && (
              <Tag color="orange" size="small" style={{ marginTop: 4 }}>
                Editado
              </Tag>
            )}
          </ProductNameWrapper>
        </Tooltip>
      );

      // Aggregated locations across children
      const allLocations = [];
      (g._children || []).forEach((c) => {
        if (Array.isArray(c.locations)) allLocations.push(...c.locations);
      });
      if (allLocations.length) {
        const agg = new Map();
        for (const l of allLocations) {
          if (!l?.location) continue;
          const prev = agg.get(l.location) || 0;
          agg.set(l.location, prev + Number(l.quantity || 0));
        }
        const entries = Array.from(agg.entries()).sort((a, b) => b[1] - a[1]);
        const MAX_SHOW = 6;
        const shown = entries.slice(0, MAX_SHOW);
        const extra = entries.length - shown.length;
        locationsNode = (
          <TagsWrap>
            {shown.map(([loc, q]) => {
              const label = locationNamesMap[loc] || shortenLocationPath(loc);
              const isLoadingLoc =
                !locationNamesMap[loc] && !!resolvingLocations[loc];
              return (
                <Tooltip key={loc} title={`${label} (${formatNumber(q)})`}>
                  <Tag>
                    {isLoadingLoc ? (
                      <span style={{ opacity: 0.6, fontSize: 11 }}>
                        Cargando…
                      </span>
                    ) : (
                      shortenLocationPath(label)
                    )}
                  </Tag>
                </Tooltip>
              );
            })}
            {extra > 0 && (
              <Tooltip
                title={
                  <div>
                    {entries.slice(MAX_SHOW).map(([loc, q]) => (
                      <div key={loc}>
                        {loc} ({formatNumber(q)})
                      </div>
                    ))}
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
        const child = (g._children || [])[0] || {};
        // Si hay ediciones por source, forzar modo detallado y bloquear edición agregada
        const value = (() => {
          if (
            hasSourceEdits &&
            Array.isArray(child.sources) &&
            child.sources.length
          ) {
            return child.sources.reduce(
              (s, src) =>
                s +
                Number(
                  counts[src.id || src.key] ??
                    serverCounts[src.id || src.key] ??
                    src.real ??
                    src.stock ??
                    0,
                ),
              0,
            );
          }
          return counts[g.topKey] ?? child.real ?? g.totalReal;
        })();
        if (hasSourceEdits) {
          conteoEl = <strong>{formatNumber(value)}</strong>;
        } else {
          conteoEl = (
            <InputNumber
              min={0}
              value={value}
              onChange={(val) => onChangeCount(g.topKey, Number(val ?? 0))}
              style={{ width: '100%' }}
              disabled={readOnly}
            />
          );
        }
        const diff = Number(value ?? 0) - Number(g.totalStock ?? 0);
        diffEl = <Diff $value={diff}>{formatNumber(diff)}</Diff>;

        // Detectar diferencias entre valores actuales persistidos y baseline original - para todos los productos
        const editedPairs = [];
        // NUEVO: detectar ediciones pendientes (counts vs persistido actual)
        const pendingCountPairs = [];
        const pushIfPending = (key, persisted) => {
          if (Object.prototype.hasOwnProperty.call(counts, key)) {
            const current = Number(counts[key]);
            if (Number(current) !== Number(persisted))
              pendingCountPairs.push([key, persisted]);
          }
        };
        // top agregado (si aplica)
        {
          const currentPersistedTop =
            serverCounts[g.topKey] !== undefined
              ? Number(serverCounts[g.topKey])
              : Number(child.stock ?? 0);
          const baselineTop = baselineSnapshot.counts[g.topKey];
          if (
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
          const currentPersistedChild =
            serverCounts[ch.key] !== undefined
              ? Number(serverCounts[ch.key])
              : Number(ch.stock ?? 0);
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
            const currentPersistedSrc =
              serverCounts[skey] !== undefined
                ? Number(serverCounts[skey])
                : Number(src.stock ?? src.quantity ?? 0);
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
        if ((child.type === 'batch' || child.type === 'noexp') && !readOnly) {
          const key = g.topKey;
          // Determinar estado: si no hay editVal en expirationEdits, usar valores guardados
          const editVal = expirationEdits?.[key];
          const hasEditState = Object.prototype.hasOwnProperty.call(
            expirationEdits,
            key,
          );
          const manualMetaVal = countsMeta[key]?.manualExpirationDate;
          const manualVal =
            manualMetaVal && manualMetaVal !== CLEAR_SENTINEL
              ? formatInputDate(manualMetaVal)
              : '';
          const originalVal =
            child.type === 'batch' ? formatInputDate(child.expirationDate) : '';
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
          const valueDay = currentStr
            ? DateTime.fromISO(currentStr)
            : null;
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
                  if (child.type === 'batch' && hasOriginal) {
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
                          onChangeExpiration &&
                            onChangeExpiration(key, prevVal);
                      },
                    });
                  } else {
                    onChangeExpiration && onChangeExpiration(key, undefined);
                  }
                  return;
                }
                const iso = date.format('YYYY-MM-DD');
                onChangeExpiration && onChangeExpiration(key, iso);
              }}
              style={{ width: '100%' }}
            />
          );
          // Acciones: restablecer fecha y/o conteo real
          const actions = [];
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
                <Button size="small" type="text">
                  ⋯
                </Button>
              </Dropdown>
            );
          }
        } else if (child.type === 'batch') {
          // Considerar manual a nivel de grupo o cualquier source dentro del lote
          const groupManual =
            countsMeta[g.topKey]?.manualExpirationDate ||
            countsMeta[child.key]?.manualExpirationDate;
          const anySourceManual =
            Array.isArray(child.sources) &&
            child.sources.some((src) => {
              const skey = src.id || src.key;
              return !!countsMeta[skey]?.manualExpirationDate;
            });
          const isManual = !!(groupManual || anySourceManual);
          const effectiveStr = groupManual
            ? formatInputDate(groupManual)
            : formatInputDate(child.expirationDate);
          expirationSortValue = effectiveStr || '';
          const displayDate =
            effectiveStr || formatInputDate(child.expirationDate);
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
        } else if (child.type === 'noexp') {
          const manualExists =
            countsMeta[g.topKey]?.manualExpirationDate ||
            countsMeta[child.key]?.manualExpirationDate
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
            const actions = [
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
                <Button size="small" type="text">
                  ⋯
                </Button>
              </Dropdown>
            );
          }
        }

        // Recolectar editores para grupo con un solo hijo
        const editorsMap = new Map();
        const meta = countsMeta[g.topKey];
        if (meta?.updatedBy) {
          const uid = meta.updatedBy;
          const updatedAt = meta.updatedAt;
          editorsMap.set(uid, {
            uid,
            name: usersNameCache[uid] || meta.updatedByName || uid,
            updatedAt,
          });
        }
        if (editorsMap.size) {
          const editors = Array.from(editorsMap.values()).sort(
            (a, b) => getTsMs(b.updatedAt) - getTsMs(a.updatedAt),
          );
          // Mostrar "Cargando…" solo si realmente falta nombre y el UID está resolviéndose
          const uid = meta?.updatedBy;
          const needsName = uid && !usersNameCache[uid] && !meta?.updatedByName;
          const anyLoading = needsName && !!resolvingUIDs[uid];
          userEl = anyLoading ? (
            <span style={{ fontSize: 11, color: '#6b7280' }}>Cargando…</span>
          ) : (
            <EditorsList editors={editors} />
          );
        }
      }

      if (hasMultipleLots) {
        // Detectar diferencias entre valores actuales persistidos y baseline original en todo el grupo
        const editedPairs = [];
        // NUEVO: detectar ediciones pendientes (counts vs persistido)
        const pendingCountPairs = [];
        (g._children || []).forEach((ch) => {
          const currentPersistedChild =
            serverCounts[ch.key] !== undefined
              ? Number(serverCounts[ch.key])
              : Number(ch.stock ?? 0);
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
            const currentPersistedSrc =
              serverCounts[skey] !== undefined
                ? Number(serverCounts[skey])
                : Number(src.stock ?? src.quantity ?? 0);
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
        const dateResetPairs = [];
        const norm = (v) => {
          if (!v || v === CLEAR_SENTINEL) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
          return formatInputDate(v) || '';
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
            if (changed && originalStr)
              dateResetPairs.push([skey, originalStr]);
          });
        });

        const restorePairs = pendingCountPairs.length
          ? pendingCountPairs
          : editedPairs;
        const menuItems = [
          {
            key: 'open-modal',
            label: 'Editar lotes',
            onClick: () => setModalGroup(g),
          },
          ...(editedPairs.length || dateResetPairs.length
            ? [{ type: 'divider' }]
            : []),
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
                ([k, orig]) =>
                  onChangeExpiration && onChangeExpiration(k, orig),
              ),
          },
        ].filter(Boolean);

        actionsEl = readOnly ? (
          <Tooltip title="Editar lotes">
            <Button
              size="small"
              type="text"
              shape="circle"
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
            <Button size="small" type="text">
              ⋯
            </Button>
          </Dropdown>
        );
        // Recolectar todos los editores de los hijos
        const editorsMap = new Map();
        (g._children || []).forEach((ch) => {
          const meta = countsMeta[ch.key];
          if (!meta?.updatedBy) return;
          const uid = meta.updatedBy;
          const existing = editorsMap.get(uid);
          const updatedAt = meta.updatedAt;
          const existingMs = existing ? getTsMs(existing.updatedAt) : -1;
          const currentMs = getTsMs(updatedAt);
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
            (a, b) => getTsMs(b.updatedAt) - getTsMs(a.updatedAt),
          );
          // Revisa cada hijo: si falta nombre (no cache y no updatedByName) y está resolviéndose
          const anyLoading = (g._children || []).some((ch) => {
            const m = countsMeta[ch.key];
            const uid = m?.updatedBy;
            if (!uid) return false;
            const hasName = !!(usersNameCache[uid] || m?.updatedByName);
            return !hasName && resolvingUIDs[uid];
          });
          userEl = anyLoading ? (
            <span style={{ fontSize: 11, color: '#6b7280' }}>Cargando…</span>
          ) : (
            <EditorsList editors={editors} />
          );
        }
        // Expiration summary for multiple lots (usar fecha efectiva: manual en grupo/source o fecha original)
        const expirations = new Set();
        (g._children || []).forEach((c) => {
          if (c.type !== 'batch') return;
          const groupManual = countsMeta[c.key]?.manualExpirationDate;
          if (groupManual) {
            const s = formatInputDate(groupManual);
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
                const s = formatInputDate(sMan);
                if (s) expirations.add(formatDate(s));
                added = true;
                break;
              }
            }
          }
          if (!added && c.expirationDate) {
            expirations.add(formatDate(c.expirationDate));
          }
        });
        if (expirations.size) {
          const list = Array.from(expirations).filter(Boolean);
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

      return {
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
    });
  }, [
    groups,
    counts,
    baselineSnapshot,
    onChangeCount,
    countsMeta,
    usersNameCache,
    readOnly,
    expirationEdits,
    onChangeExpiration,
    resolvingUIDs,
    serverCounts,
    locationNamesMap,
    resolvingLocations,
  ]);

  if (!loading && (!groups || groups.length === 0)) {
    return <Empty description="Sin registros" />;
  }

  return (
    <Wrapper>
      <AdvancedTable
        data={rows}
        columns={columns}
        loading={loading}
        numberOfElementsPerPage={15}
        tableName="inventory-grouped"
        rowSize={rowSize}
        rowBorder
        onRowClick={(row) => {
          try {
            if (!row || !Array.isArray(row._children)) return;
            // Contar unidades (lotes). Solo abrir modal si hay MÁS DE UN lote.
            let lotes = 0;
            for (const ch of row._children) {
              if (Array.isArray(ch.sources) && ch.sources.length > 0)
                lotes += ch.sources.length;
              else lotes += 1;
              if (lotes > 1) break; // cortar temprano apenas confirmamos que hay más de un lote
            }
            if (lotes > 1) setModalGroup(row);
          } catch {
            /* noop */
          }
        }}
      />

      {/* Resumen removido según solicitud */}

      <GroupedLotsModal
        open={!!modalGroup}
        group={modalGroup}
        counts={counts}
        countsMeta={countsMeta}
        usersNameCache={usersNameCache}
        locationNamesMap={locationNamesMap}
        resolvingLocations={resolvingLocations}
        expirationEdits={expirationEdits}
        onChangeExpiration={onChangeExpiration}
        onChangeCount={onChangeCount}
        onClose={() => setModalGroup(null)}
        onSave={onSave}
        serverCounts={serverCounts}
        saving={saving}
        readOnly={readOnly}
        baselineSnapshot={baselineSnapshot}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  height: 100%;
  overflow: auto;
`;

const ProductNameCell = styled.span`
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
`;
