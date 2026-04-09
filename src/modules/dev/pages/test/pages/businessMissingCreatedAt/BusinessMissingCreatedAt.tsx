import {
  collection,
  doc,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useReducer,
} from 'react';

import { db } from '@/firebase/firebaseconfig';

interface MissingBusiness {
  id: string;
  name: string;
  createdAt: unknown;
  raw: Record<string, unknown>;
  hasCreatedAtNested: boolean;
  hasCreatedAtRoot: boolean;
}

interface ScanProgress {
  scanned: number;
  total: number;
}

interface BusinessMissingCreatedAtState {
  loading: boolean;
  missing: MissingBusiness[];
  progress: ScanProgress;
  fixing: boolean;
  useFixedDate: boolean;
}

type BusinessMissingCreatedAtAction =
  | { type: 'startScan' }
  | { type: 'setProgress'; progress: ScanProgress }
  | { type: 'finishScan'; missing: MissingBusiness[]; progress: ScanProgress }
  | { type: 'finishScanWithError' }
  | { type: 'setFixing'; value: boolean }
  | { type: 'removeBusiness'; businessId: string }
  | { type: 'clearMissing' }
  | { type: 'setUseFixedDate'; value: boolean };

const initialBusinessMissingCreatedAtState: BusinessMissingCreatedAtState = {
  loading: false,
  missing: [],
  progress: {
    scanned: 0,
    total: 0,
  },
  fixing: false,
  useFixedDate: false,
};

const businessMissingCreatedAtReducer = (
  state: BusinessMissingCreatedAtState,
  action: BusinessMissingCreatedAtAction,
): BusinessMissingCreatedAtState => {
  switch (action.type) {
    case 'startScan':
      return {
        ...state,
        loading: true,
        missing: [],
        progress: { scanned: 0, total: 0 },
      };
    case 'setProgress':
      return {
        ...state,
        progress: action.progress,
      };
    case 'finishScan':
      return {
        ...state,
        loading: false,
        missing: action.missing,
        progress: action.progress,
      };
    case 'finishScanWithError':
      return {
        ...state,
        loading: false,
      };
    case 'setFixing':
      return {
        ...state,
        fixing: action.value,
      };
    case 'removeBusiness':
      return {
        ...state,
        missing: state.missing.filter((business) => business.id !== action.businessId),
      };
    case 'clearMissing':
      return {
        ...state,
        missing: [],
      };
    case 'setUseFixedDate':
      return {
        ...state,
        useFixedDate: action.value,
      };
    default:
      return state;
  }
};

/**
 * Auditoría de negocios sin campo createdAt.
 * Permite:
 *  - Listar todos los negocios que NO tienen createdAt (o es falsy).
 *  - Fijar createdAt = serverTimestamp() de forma individual o masiva.
 *  - Exportar a CSV (descarga en el navegador) la lista filtrada.
 */
export default function BusinessMissingCreatedAt() {
  const [state, dispatch] = useReducer(
    businessMissingCreatedAtReducer,
    initialBusinessMissingCreatedAtState,
  );
  const { loading, missing, progress, fixing, useFixedDate } = state;
  // Fecha fija solicitada: 1 de enero 2024 00:00:00 UTC
  const FIXED_ISO = '2024-01-01T00:00:00.000Z';
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const totalMissing = missing.length;

  const scan = useCallback(async () => {
    dispatch({ type: 'startScan' });
    abortRef.current.aborted = false;
    const colRef = collection(db, 'businesses');

    getDocs(colRef)
      .then((snap) => {
        const total = snap.size;
        dispatch({
          type: 'setProgress',
          progress: { scanned: 0, total },
        });
        const miss: MissingBusiness[] = [];
        let scanned = 0;
        snap.forEach((d) => {
          if (abortRef.current.aborted) return;
          const data = (d.data() || {}) as Record<string, unknown>;
          console.log('Escaneando negocio:', d.id, data.business);
          // NUEVO: el esquema real usa objeto anidado 'business'
          const businessObj =
            typeof data.business === 'object' && data.business !== null
              ? (data.business as Record<string, unknown>)
              : {};
          // createdAt puede estar (incorrectamente) en root por algún hotfix anterior; damos fallback pero criterio de ausencia es el anidado
          const createdAtNested = businessObj.createdAt ?? null;
          const createdAtRoot = data.createdAt ?? null;
          const effectiveCreatedAt = createdAtNested || createdAtRoot; // para mostrar
          const hasCreated = !!createdAtNested; // Solo consideramos válido si está en la ruta correcta business.createdAt
          const name =
            typeof businessObj.name === 'string'
              ? businessObj.name
              : '(sin nombre)';
          const item: MissingBusiness = {
            id: d.id,
            name,
            createdAt: effectiveCreatedAt,
            raw: data,
            hasCreatedAtNested: !!createdAtNested,
            hasCreatedAtRoot: !!createdAtRoot,
          };
          if (!hasCreated) miss.push(item);
          scanned += 1;
          if (scanned % 50 === 0) {
            dispatch({
              type: 'setProgress',
              progress: { scanned, total },
            });
          }
        });
        dispatch({
          type: 'finishScan',
          missing: miss,
          progress: { scanned: total, total },
        });
      })
      .catch((err) => {
        console.error('Error escaneando negocios:', err);
        alert(
          'Error escaneando negocios: ' +
            (err instanceof Error ? err.message : String(err)),
        );
      })
      .finally(() => {
        dispatch({ type: 'finishScanWithError' });
      });
  }, []);

  const cancelScan = () => {
    abortRef.current.aborted = true;
  };

  const getCreatedAtValue = (biz: MissingBusiness): unknown => {
    // Si el documento tiene un createdAt legacy en la raíz, conservarlo.
    if (biz?.hasCreatedAtRoot && biz?.raw?.createdAt) {
      return biz.raw.createdAt; // Puede ser Timestamp Firestore o string ISO; se persiste tal cual.
    }
    // Si se activó la fecha fija, usar esa.
    if (useFixedDate) {
      return new Date(FIXED_ISO); // Firestore lo convertirá a Timestamp
    }
    // Caso default: serverTimestamp() actual.
    return serverTimestamp();
  };

  const fixOne = async (biz: MissingBusiness) => {
    if (fixing) return;
    dispatch({ type: 'setFixing', value: true });
    updateDoc(doc(db, 'businesses', biz.id), {
        'business.createdAt': getCreatedAtValue(biz),
      })
      .then(() => {
        dispatch({ type: 'removeBusiness', businessId: biz.id });
      })
      .catch((err) => {
        console.error('Error fijando createdAt:', err);
        alert(
          'Error fijando createdAt: ' +
            (err instanceof Error ? err.message : String(err)),
        );
      })
      .finally(() => {
        dispatch({ type: 'setFixing', value: false });
      });
  };

  const fixAll = async () => {
    if (fixing || missing.length === 0) return;
    if (!window.confirm(`Fijar createdAt en ${missing.length} negocio(s)?`))
      return;
    dispatch({ type: 'setFixing', value: true });
    Promise.resolve()
      .then(async () => {
        const batchSize = 400; // margen bajo el límite de 500
        let remaining = [...missing];
        while (remaining.length) {
          const slice = remaining.slice(0, batchSize);
          remaining = remaining.slice(batchSize);
          const batch = writeBatch(db);
          slice.forEach((biz) => {
            const ref = doc(db, 'businesses', biz.id);
            batch.update(ref, { 'business.createdAt': getCreatedAtValue(biz) });
          });
          await batch.commit();
        }
      })
      .then(() => {
        dispatch({ type: 'clearMissing' });
        alert(
          'CreatedAt fijado para todos los negocios faltantes. Vuelve a escanear para verificar.',
        );
      })
      .catch((err) => {
        console.error('Error en fixAll:', err);
        alert(
          'Error en fixAll: ' +
            (err instanceof Error ? err.message : String(err)),
        );
      })
      .finally(() => {
        dispatch({ type: 'setFixing', value: false });
      });
  };

  const exportCsv = () => {
    if (missing.length === 0) return;
    const headers = ['id', 'name'];
    const rows = missing.map((b) => [b.id, sanitizeCsv(b.name)]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-missing-createdAt-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Escaneo manual; no automático para evitar carga involuntaria.
  }, []);

  const pctMissing = useMemo(() => {
    if (!progress.total) return 0;
    return (missing.length / progress.total) * 100;
  }, [missing.length, progress.total]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Negocios sin createdAt</h2>
      <p style={{ color: '#555', marginTop: 4 }}>
        Escanea todos los documentos de <code>businesses</code> y muestra los
        que no tienen el campo <code>createdAt</code>.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={scan} disabled={loading || fixing}>
          {loading ? 'Escaneando…' : 'Escanear'}
        </button>
        <button onClick={cancelScan} disabled={!loading}>
          Cancelar
        </button>
        <button
          onClick={fixAll}
          disabled={fixing || loading || missing.length === 0}
        >
          {fixing ? 'Aplicando…' : `Fijar todos (${missing.length})`}
        </button>
        <button onClick={exportCsv} disabled={missing.length === 0 || loading}>
          Exportar CSV ({missing.length})
        </button>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            background: '#f6f6f6',
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          <input
            type="checkbox"
            checked={useFixedDate}
            onChange={(e) =>
              dispatch({ type: 'setUseFixedDate', value: e.target.checked })
            }
            style={{ margin: 0 }}
          />
          <span>Usar fecha fija 1 Ene 2024 00:00 UTC</span>
        </label>
        <span style={{ alignSelf: 'center', fontSize: 13, color: '#555' }}>
          Escaneado: {progress.scanned} / {progress.total} · Faltantes:{' '}
          {totalMissing} ({pctMissing.toFixed(2)}%)
        </span>
      </div>
      {loading && (
        <div style={{ marginTop: 12 }}>
          <ProgressBar progress={progress} />
        </div>
      )}
      {missing.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              overflow: 'auto',
              maxHeight: '60vh',
              border: '1px solid #eee',
              borderRadius: 6,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 600,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Nombre</th>
                  <th style={th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {missing.map((b) => (
                  <tr key={b.id} style={{ background: '#fff8e1' }}>
                    <td style={td}>{b.id}</td>
                    <td style={td}>
                      {b.name ? (
                        b.name
                      ) : (
                        <em style={{ color: '#999' }}>(sin nombre)</em>
                      )}
                    </td>
                    <td style={{ ...td }}>
                      <button onClick={() => fixOne(b)} disabled={fixing}>
                        Fijar createdAt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && progress.total > 0 && missing.length === 0 && (
        <div
          style={{
            marginTop: 16,
            color: '#0f7a3e',
            background: '#eafaf1',
            padding: '8px 12px',
            borderRadius: 6,
          }}
        >
          Todos los negocios tienen createdAt ✔
        </div>
      )}
    </div>
  );
}

function ProgressBar({ progress }: { progress: ScanProgress }) {
  const pct = progress.total
    ? Math.min(100, Math.floor((progress.scanned / progress.total) * 100))
    : 0;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#555',
        }}
      >
        <span>Escaneando negocios…</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: 8,
          background: '#eee',
          borderRadius: 6,
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: pct + '%',
            background: '#1677ff',
            height: '100%',
            transition: 'width 200ms linear',
          }}
        />
      </div>
    </div>
  );
}

const th = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  background: 'white',
  zIndex: 1,
};

const td = {
  padding: '6px 10px',
  borderBottom: '1px solid #f2f2f2',
  fontSize: 13,
};

function sanitizeCsv(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\n\r]+/g, ' ')
    .trim();
}

function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
