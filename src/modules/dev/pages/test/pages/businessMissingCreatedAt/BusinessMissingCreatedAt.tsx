import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { db } from '@/firebase/firebaseconfig';

import {
  BodyCell,
  Description,
  EmptyName,
  FixedDateToggle,
  HeaderCell,
  MissingRow,
  Page,
  ProgressFill,
  ProgressHeader,
  ProgressTrack,
  ProgressWrapper,
  ResultsSection,
  ResultsTable,
  ScanSummary,
  SuccessNotice,
  TableFrame,
  Toolbar,
} from './BusinessMissingCreatedAt.styles';

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
        missing: state.missing.filter(
          (business) => business.id !== action.businessId,
        ),
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
 * Auditoria de negocios sin campo createdAt.
 * Permite:
 *  - Listar todos los negocios que no tienen createdAt o es falsy.
 *  - Fijar createdAt = serverTimestamp() de forma individual o masiva.
 *  - Exportar a CSV la lista filtrada.
 */
export default function BusinessMissingCreatedAt() {
  const [state, dispatch] = useReducer(
    businessMissingCreatedAtReducer,
    initialBusinessMissingCreatedAtState,
  );
  const { loading, missing, progress, fixing, useFixedDate } = state;
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
          const businessObj =
            typeof data.business === 'object' && data.business !== null
              ? (data.business as Record<string, unknown>)
              : {};
          const createdAtNested = businessObj.createdAt ?? null;
          const createdAtRoot = data.createdAt ?? null;
          const effectiveCreatedAt = createdAtNested || createdAtRoot;
          const hasCreated = !!createdAtNested;
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
    if (biz?.hasCreatedAtRoot && biz?.raw?.createdAt) {
      return biz.raw.createdAt;
    }
    if (useFixedDate) {
      return new Date(FIXED_ISO);
    }
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
        const batchSize = 400;
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
    // Escaneo manual para evitar carga involuntaria.
  }, []);

  const pctMissing = useMemo(() => {
    if (!progress.total) return 0;
    return (missing.length / progress.total) * 100;
  }, [missing.length, progress.total]);

  return (
    <Page>
      <h2>Negocios sin createdAt</h2>
      <Description>
        Escanea todos los documentos de <code>businesses</code> y muestra los
        que no tienen el campo <code>createdAt</code>.
      </Description>
      <Toolbar>
        <button onClick={scan} disabled={loading || fixing}>
          {loading ? 'Escaneando...' : 'Escanear'}
        </button>
        <button onClick={cancelScan} disabled={!loading}>
          Cancelar
        </button>
        <button
          onClick={fixAll}
          disabled={fixing || loading || missing.length === 0}
        >
          {fixing ? 'Aplicando...' : `Fijar todos (${missing.length})`}
        </button>
        <button onClick={exportCsv} disabled={missing.length === 0 || loading}>
          Exportar CSV ({missing.length})
        </button>
        <FixedDateToggle>
          <input
            type="checkbox"
            checked={useFixedDate}
            onChange={(e) =>
              dispatch({ type: 'setUseFixedDate', value: e.target.checked })
            }
          />
          <span>Usar fecha fija 1 Ene 2024 00:00 UTC</span>
        </FixedDateToggle>
        <ScanSummary>
          Escaneado: {progress.scanned} / {progress.total} - Faltantes:{' '}
          {totalMissing} ({pctMissing.toFixed(2)}%)
        </ScanSummary>
      </Toolbar>
      {loading && (
        <ProgressWrapper>
          <ProgressBar progress={progress} />
        </ProgressWrapper>
      )}
      {missing.length > 0 && (
        <ResultsSection>
          <TableFrame>
            <ResultsTable>
              <thead>
                <tr>
                  <HeaderCell>ID</HeaderCell>
                  <HeaderCell>Nombre</HeaderCell>
                  <HeaderCell>Accion</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {missing.map((business) => (
                  <MissingRow key={business.id}>
                    <BodyCell>{business.id}</BodyCell>
                    <BodyCell>
                      {business.name ? (
                        business.name
                      ) : (
                        <EmptyName>(sin nombre)</EmptyName>
                      )}
                    </BodyCell>
                    <BodyCell>
                      <button
                        onClick={() => fixOne(business)}
                        disabled={fixing}
                      >
                        Fijar createdAt
                      </button>
                    </BodyCell>
                  </MissingRow>
                ))}
              </tbody>
            </ResultsTable>
          </TableFrame>
        </ResultsSection>
      )}
      {!loading && progress.total > 0 && missing.length === 0 && (
        <SuccessNotice>Todos los negocios tienen createdAt OK</SuccessNotice>
      )}
    </Page>
  );
}

function ProgressBar({ progress }: { progress: ScanProgress }) {
  const pct = progress.total
    ? Math.min(100, Math.floor((progress.scanned / progress.total) * 100))
    : 0;
  return (
    <div>
      <ProgressHeader>
        <span>Escaneando negocios...</span>
        <span>{pct}%</span>
      </ProgressHeader>
      <ProgressTrack>
        <ProgressFill $pct={pct} />
      </ProgressTrack>
    </div>
  );
}

function sanitizeCsv(text: unknown) {
  if (!text) return '';
  return String(text)
    .replace(/[\n\r]+/g, ' ')
    .trim();
}

function escapeCsv(value: unknown) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
