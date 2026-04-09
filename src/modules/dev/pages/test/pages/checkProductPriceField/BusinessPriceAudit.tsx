import React, { useMemo, useReducer } from 'react';

import {
  fbFixPricesForBusinesses,
  fbFixAllPricesToListPrice,
  fbAuditAllBusinessesPriceVsList,
  fbCSVProblemProductsAll,
  fbCSVProblemProductsForBusinesses,
  fbExportProblemProductsAll,
} from '@/firebase/products/fbAuditPriceListMismatches';

type UnknownStrategy = 'none' | 'mark' | 'copyPriceToList';
type ExportFormat = 'csv' | 'xlsx' | 'both';

interface ProgressPayload {
  scanned?: number;
  totalScanned?: number;
  updated?: number;
  totalUpdated?: number;
  skipped?: number;
  totalSkipped?: number;
  unknown?: number;
  totalUnknown?: number;
  total?: number;
  totalCount?: number;
  scope?: 'list' | 'all';
  phase?: string;
  dryRun?: boolean;
  businessID?: string;
  businessName?: string;
}

interface ProgressState {
  scanned: number;
  total: number | null;
  updated?: number;
  skipped?: number;
  unknown?: number;
  scope?: 'list' | 'all';
  phase?: string;
  dryRun?: boolean;
  businessID?: string;
  businessName?: string;
}

interface BusinessFixRow {
  businessID: string;
  businessName?: string;
  scanned?: number;
  updated?: number;
  skipped?: number;
  unknown?: number;
  dryRun?: boolean;
}

interface BusinessAuditSummary {
  businessID: string;
  total?: number;
  equal?: number;
  mismatch?: number;
  unknown?: number;
  pctEqual?: number;
  pctMismatch?: number;
  pctUnknown?: number;
}

interface BusinessTotals {
  totalUpdated: number;
  totalSkipped: number;
  totalUnknown: number;
  totalScanned: number;
  dryRun?: boolean;
}

interface BusinessPriceAuditState {
  input: string;
  busy: boolean;
  progress: ProgressState | null;
  rows: BusinessFixRow[];
  allSummary: BusinessAuditSummary[];
  allTotals: BusinessTotals | null;
  unknownStrategy: UnknownStrategy;
  exportFormat: ExportFormat;
}

type BusinessPriceAuditAction =
  | { type: 'setInput'; value: string }
  | { type: 'setBusy'; value: boolean }
  | { type: 'setProgress'; value: ProgressState | null }
  | { type: 'applyProgress'; value: ProgressPayload }
  | { type: 'setRows'; value: BusinessFixRow[] }
  | { type: 'setAllSummary'; value: BusinessAuditSummary[] }
  | { type: 'setAllTotals'; value: BusinessTotals | null }
  | { type: 'setUnknownStrategy'; value: UnknownStrategy }
  | { type: 'setExportFormat'; value: ExportFormat };

const initialBusinessPriceAuditState: BusinessPriceAuditState = {
  input: '',
  busy: false,
  progress: null,
  rows: [],
  allSummary: [],
  allTotals: null,
  unknownStrategy: 'none',
  exportFormat: 'xlsx',
};

const businessPriceAuditReducer = (
  state: BusinessPriceAuditState,
  action: BusinessPriceAuditAction,
): BusinessPriceAuditState => {
  switch (action.type) {
    case 'setInput':
      return { ...state, input: action.value };
    case 'setBusy':
      return { ...state, busy: action.value };
    case 'setProgress':
      return { ...state, progress: action.value };
    case 'applyProgress': {
      const previous = state.progress;
      const payload = action.value;
      const scanned =
        payload.scanned ?? payload.totalScanned ?? previous?.scanned ?? 0;
      const updated =
        payload.updated ?? payload.totalUpdated ?? previous?.updated ?? 0;
      const skipped =
        payload.skipped ?? payload.totalSkipped ?? previous?.skipped ?? 0;
      const unknown =
        payload.unknown ?? payload.totalUnknown ?? previous?.unknown ?? 0;
      const total = payload.total ?? payload.totalCount ?? previous?.total ?? null;
      return {
        ...state,
        progress: {
          ...(previous || { scanned: 0, total: null }),
          ...payload,
          scanned,
          updated,
          skipped,
          unknown,
          total,
        },
      };
    }
    case 'setRows':
      return { ...state, rows: action.value };
    case 'setAllSummary':
      return { ...state, allSummary: action.value };
    case 'setAllTotals':
      return { ...state, allTotals: action.value };
    case 'setUnknownStrategy':
      return { ...state, unknownStrategy: action.value };
    case 'setExportFormat':
      return { ...state, exportFormat: action.value };
    default:
      return state;
  }
};

export default function BusinessPriceAudit() {
  const [state, dispatch] = useReducer(
    businessPriceAuditReducer,
    initialBusinessPriceAuditState,
  );
  const {
    input,
    busy,
    progress,
    rows,
    allSummary,
    allTotals,
    unknownStrategy,
    exportFormat,
  } = state;

  const handleUnknownStrategyChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const next = event.target.value;
    if (next === 'none' || next === 'mark' || next === 'copyPriceToList') {
      dispatch({ type: 'setUnknownStrategy', value: next });
    }
  };

  const handleExportFormatChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const next = event.target.value;
    if (next === 'csv' || next === 'xlsx' || next === 'both') {
      dispatch({ type: 'setExportFormat', value: next });
    }
  };

  const businessIDs = useMemo<string[]>(() => {
    return input
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [input]);

  // Normaliza distintos payloads de progreso
  const handleProgress = (p: ProgressPayload) => {
    dispatch({ type: 'applyProgress', value: p });
  };

  // Helpers para exportar CSV después de cada acción
  const ts = () => new Date().toISOString().replace(/[:.]/g, '-');
  const exportCsvForList = async (label = '') => {
    if (businessIDs.length === 0) return;
    setProgress({ scope: 'list', phase: 'exporting', scanned: 0, total: 0 });
    await fbCSVProblemProductsForBusinesses(businessIDs, {
      includeBusinessName: true,
      includeHeaders: true,
      filename: `problem-products-list${label ? '-' + label : ''}-${ts()}.csv`,
      download: true,
      onProgress: handleProgress,
    });
  };
  const exportCsvForAll = async (label = '') => {
    setProgress({ scope: 'all', phase: 'exporting', scanned: 0, total: 0 });
    if (exportFormat === 'csv') {
      await fbCSVProblemProductsAll({
        includeBusinessName: true,
        includeHeaders: true,
        filename: `problem-products-all${label ? '-' + label : ''}-${ts()}.csv`,
        download: true,
        onProgress: handleProgress,
      });
    } else {
      await fbExportProblemProductsAll({
        includeBusinessName: true,
        format: exportFormat, // 'xlsx' | 'both'
        filenameBase: `problem-products-all${label ? '-' + label : ''}-${ts()}`,
        onProgress: handleProgress,
      });
    }
  };

  // Acciones: Lista
  const handleAuditList = async () => {
    if (businessIDs.length === 0) return;
    dispatch({ type: 'setBusy', value: true });
    dispatch({ type: 'setAllSummary', value: [] });
    dispatch({ type: 'setAllTotals', value: null });
    dispatch({ type: 'setProgress', value: {
      scope: 'list',
      phase: 'starting',
      scanned: 0,
      total: 0,
      dryRun: true,
    }});
    fbFixPricesForBusinesses(businessIDs, {
        dryRun: true,
        onProgress: handleProgress,
      })
      .then(async (res) => {
        dispatch({ type: 'setRows', value: res as BusinessFixRow[] });
        await exportCsvForList('dryrun');
      })
      .finally(() => {
        dispatch({ type: 'setBusy', value: false });
        dispatch({ type: 'setProgress', value: null });
      });
  };

  const handleFixList = async () => {
    if (businessIDs.length === 0) return;
    if (
      !window.confirm(
        'Esto igualará price = listPrice en los negocios ingresados. ¿Deseas continuar?',
      )
    )
      return;
    dispatch({ type: 'setBusy', value: true });
    dispatch({ type: 'setAllSummary', value: [] });
    dispatch({ type: 'setAllTotals', value: null });
    dispatch({ type: 'setProgress', value: {
      scope: 'list',
      phase: 'starting',
      scanned: 0,
      total: 0,
      dryRun: false,
    }});
    fbFixPricesForBusinesses(businessIDs, {
        dryRun: false,
        onProgress: handleProgress,
      })
      .then(async (res) => {
        dispatch({ type: 'setRows', value: res as BusinessFixRow[] });
        await exportCsvForList('post-fix');
      })
      .finally(() => {
        dispatch({ type: 'setBusy', value: false });
        dispatch({ type: 'setProgress', value: null });
      });
  };

  // Acciones: Global
  const handleAuditAllSummary = async () => {
    dispatch({ type: 'setBusy', value: true });
    dispatch({ type: 'setRows', value: [] });
    dispatch({ type: 'setAllTotals', value: null });
    fbAuditAllBusinessesPriceVsList(1000)
      .then(async (res) => {
        dispatch({
          type: 'setAllSummary',
          value: res as BusinessAuditSummary[],
        });
        await exportCsvForAll('summary');
      })
      .finally(() => {
        dispatch({ type: 'setBusy', value: false });
      });
  };

  const handleAuditAllDryRun = async () => {
    if (
      !window.confirm(
        'Auditar TODOS (simulación del fix). Puede tardar si hay muchos datos. ¿Deseas continuar?',
      )
    )
      return;
    dispatch({ type: 'setBusy', value: true });
    dispatch({ type: 'setRows', value: [] });
    dispatch({ type: 'setAllSummary', value: [] });
    dispatch({ type: 'setProgress', value: {
      scope: 'all',
      phase: 'starting',
      scanned: 0,
      total: 0,
      dryRun: true,
    }});
    fbFixAllPricesToListPrice({
        dryRun: true,
        unknownStrategy,
        onProgress: handleProgress,
      })
      .then(async (res) => {
        dispatch({ type: 'setAllTotals', value: res as BusinessTotals });
        await exportCsvForAll('dryrun');
      })
      .finally(() => {
        dispatch({ type: 'setBusy', value: false });
        dispatch({ type: 'setProgress', value: null });
      });
  };

  const handleFixAll = async () => {
    if (
      !window.confirm(
        'Igualar price = listPrice en TODOS los negocios (collectionGroup). ¿Deseas continuar?',
      )
    )
      return;
    dispatch({ type: 'setBusy', value: true });
    dispatch({ type: 'setRows', value: [] });
    dispatch({ type: 'setAllSummary', value: [] });
    dispatch({ type: 'setProgress', value: {
      scope: 'all',
      phase: 'starting',
      scanned: 0,
      total: 0,
      dryRun: false,
    }});
    fbFixAllPricesToListPrice({
        dryRun: false,
        unknownStrategy,
        onProgress: handleProgress,
      })
      .then(async (res) => {
        dispatch({ type: 'setAllTotals', value: res as BusinessTotals });
        await exportCsvForAll('post-fix');
      })
      .finally(() => {
        dispatch({ type: 'setBusy', value: false });
        dispatch({ type: 'setProgress', value: null });
      });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Auditoría por negocios: price vs listPrice</h2>
      <p style={{ color: '#555' }}>
        Ingresa una o varias businessID separadas por coma, espacio o salto de
        línea.
      </p>
      <textarea
        rows={4}
        placeholder="business-1, business-2, business-3"
        value={input}
        onChange={(e) =>
          dispatch({ type: 'setInput', value: e.target.value })
        }
        style={{ width: '100%', fontFamily: 'monospace' }}
      />

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleAuditList}
          disabled={busy || businessIDs.length === 0}
        >
          {busy ? 'Procesando…' : 'Auditar lista (dry-run)'}
        </button>
        <button
          onClick={handleFixList}
          disabled={busy || businessIDs.length === 0}
        >
          {busy ? 'Procesando…' : 'Arreglar lista'}
        </button>
        <button
          onClick={handleAuditAllSummary}
          disabled={busy}
          title="Auditar TODOS: resumen por negocio"
        >
          {busy ? 'Procesando…' : 'Auditar TODOS (resumen)'}
        </button>
        <button
          onClick={handleAuditAllDryRun}
          disabled={busy}
          title="Simular fix en TODOS (dry-run)"
        >
          {busy ? 'Procesando…' : 'Simular TODOS (dry-run)'}
        </button>
        <button
          onClick={handleFixAll}
          disabled={busy}
          title="Arreglar TODOS (aplica cambios)"
        >
          {busy ? 'Procesando…' : 'Arreglar TODOS'}
        </button>
        <label
          style={{
            marginLeft: 8,
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Estrategia unknown:
          <select
            value={unknownStrategy}
            onChange={handleUnknownStrategyChange}
            disabled={busy}
          >
            <option value="none">none</option>
            <option value="mark">mark (pricing.needsReview=true)</option>
            <option value="copyPriceToList">
              copyPriceToList (si hay price válido)
            </option>
          </select>
        </label>
        <label
          style={{
            marginLeft: 8,
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Export:
          <select
            value={exportFormat}
            onChange={handleExportFormatChange}
            disabled={busy}
          >
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
            <option value="both">Ambos</option>
          </select>
        </label>
        <span style={{ color: '#555' }}>
          ({businessIDs.length} negocio(s) en la lista)
        </span>
      </div>

      {busy && progress && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: '#555',
            }}
          >
            <span>
              {progress.scope === 'all' ? 'Global' : 'Lista'} · {progress.phase}
              {progress.businessID
                ? ` · ${progress.businessName ? progress.businessName + ' (' + progress.businessID + ')' : progress.businessID}`
                : ''}
            </span>
            <span>
              {progress.total
                ? `${Math.min(100, Math.floor((progress.scanned / progress.total) * 100))}%`
                : '…%'}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: '#eee',
              borderRadius: 6,
              overflow: 'hidden',
              marginTop: 6,
            }}
          >
            <div
              style={{
                width: progress.total
                  ? `${Math.min(100, Math.floor((progress.scanned / progress.total) * 100))}%`
                  : '20%',
                transition: 'width 200ms linear',
                background: '#1677ff',
                height: '100%',
              }}
            />
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
            Escaneado: {progress.scanned ?? 0} · Updated:{' '}
            {progress.updated ?? 0} · Skipped: {progress.skipped ?? 0} ·
            Unknown: {progress.unknown ?? 0}
          </div>
        </div>
      )}

      {/* Resultados por negocio (lista) */}
      {rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ overflow: 'auto', marginTop: 10 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 900,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>Business</th>
                  <th style={th}>Escaneado</th>
                  <th style={th}>Updated</th>
                  <th style={th}>Skipped</th>
                  <th style={th}>Unknown</th>
                  <th style={th}>Dry run</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.businessID}
                    style={{
                      background:
                        r.updated > 0
                          ? '#fff4f2'
                          : r.unknown > 0
                            ? '#fffbe6'
                            : '#f7fff7',
                    }}
                  >
                    <td style={td}>
                      {r.businessName ? (
                        <>
                          <div style={{ fontWeight: 600 }}>
                            {r.businessName}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {r.businessID}
                          </div>
                        </>
                      ) : (
                        r.businessID
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.scanned ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.updated ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.skipped ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.unknown ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {r.dryRun ? 'Sí' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auditoría global: resumen por negocio */}
      {allSummary.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ overflow: 'auto', marginTop: 10 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 900,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>BusinessID</th>
                  <th style={th}>Total</th>
                  <th style={th}>Equal</th>
                  <th style={th}>Mismatch</th>
                  <th style={th}>Unknown</th>
                  <th style={th}>% Equal</th>
                  <th style={th}>% Mismatch</th>
                  <th style={th}>% Unknown</th>
                </tr>
              </thead>
              <tbody>
                {allSummary.map((r) => (
                  <tr
                    key={r.businessID}
                    style={{
                      background:
                        r.mismatch > 0
                          ? '#fff4f2'
                          : r.unknown > 0
                            ? '#fffbe6'
                            : '#f7fff7',
                    }}
                  >
                    <td style={td}>{r.businessID}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.total ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.equal ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.mismatch ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {r.unknown ?? 0}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {typeof r.pctEqual === 'number'
                        ? r.pctEqual.toFixed(2)
                        : r.pctEqual}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {typeof r.pctMismatch === 'number'
                        ? r.pctMismatch.toFixed(2)
                        : r.pctMismatch}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {typeof r.pctUnknown === 'number'
                        ? r.pctUnknown.toFixed(2)
                        : r.pctUnknown}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totales globales del fix/auditoría TODOS */}
      {allTotals && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              background: '#eafaf1',
              color: '#0f7a3e',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            Updated: <strong>{allTotals.totalUpdated}</strong>
          </span>
          <span
            style={{
              background: '#e0f2fe',
              color: '#075985',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            Skipped: <strong>{allTotals.totalSkipped}</strong>
          </span>
          <span
            style={{
              background: '#fff8e1',
              color: '#8d6e63',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            Unknown: <strong>{allTotals.totalUnknown}</strong>
          </span>
          <span style={{ marginLeft: 8, color: '#555' }}>
            Escaneado: {allTotals.totalScanned}{' '}
            {allTotals.dryRun ? '(dry-run)' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  background: 'white',
  zIndex: 1,
};

const td: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #f0f0f0',
};
