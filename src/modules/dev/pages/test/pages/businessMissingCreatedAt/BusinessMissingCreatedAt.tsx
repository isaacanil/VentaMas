import { useCallback, useMemo, useReducer, useRef } from 'react';

import { downloadCsvFile } from '@/utils/export/csv';

import {
  BodyCell,
  Description,
  EmptyName,
  FixedDateToggle,
  HeaderCell,
  MissingRow,
  Page,
  ProgressWrapper,
  ResultsSection,
  ResultsTable,
  ScanSummary,
  SuccessNotice,
  TableFrame,
  Toolbar,
} from './BusinessMissingCreatedAt.styles';
import { ProgressBar } from './ProgressBar';
import {
  fixBusinessCreatedAt,
  fixMissingBusinessesCreatedAt,
  scanBusinessesMissingCreatedAt,
} from './services/businessMissingCreatedAt.service';
import type { MissingBusiness, ScanProgress } from './types';
import {
  buildMissingBusinessesCsv,
  createMissingBusinessesCsvFilename,
} from './utils/businessMissingCreatedAtCsv';

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
  | { type: 'finishScanFailed' }
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
    case 'finishScanFailed':
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
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const totalMissing = missing.length;

  const scan = useCallback(async () => {
    dispatch({ type: 'startScan' });
    abortRef.current.aborted = false;

    try {
      const result = await scanBusinessesMissingCreatedAt({
        onProgress: (nextProgress) => {
          dispatch({
            type: 'setProgress',
            progress: nextProgress,
          });
        },
        shouldAbort: () => abortRef.current.aborted,
      });

      dispatch({
        type: 'finishScan',
        missing: result.missing,
        progress: result.progress,
      });
    } catch (error) {
      console.error('Error escaneando negocios:', error);
      alert(formatErrorMessage('Error escaneando negocios', error));
      dispatch({ type: 'finishScanFailed' });
    }
  }, []);

  const cancelScan = () => {
    abortRef.current.aborted = true;
  };

  const fixOne = async (biz: MissingBusiness) => {
    if (fixing) return;
    dispatch({ type: 'setFixing', value: true });

    try {
      await fixBusinessCreatedAt(biz, { useFixedDate });
      dispatch({ type: 'removeBusiness', businessId: biz.id });
    } catch (error) {
      console.error('Error fijando createdAt:', error);
      alert(formatErrorMessage('Error fijando createdAt', error));
    } finally {
      dispatch({ type: 'setFixing', value: false });
    }
  };

  const fixAll = async () => {
    if (fixing || missing.length === 0) return;
    if (!window.confirm(`Fijar createdAt en ${missing.length} negocio(s)?`))
      return;
    dispatch({ type: 'setFixing', value: true });

    try {
      await fixMissingBusinessesCreatedAt(missing, { useFixedDate });
      dispatch({ type: 'clearMissing' });
      alert(
        'CreatedAt fijado para todos los negocios faltantes. Vuelve a escanear para verificar.',
      );
    } catch (error) {
      console.error('Error en fixAll:', error);
      alert(formatErrorMessage('Error en fixAll', error));
    } finally {
      dispatch({ type: 'setFixing', value: false });
    }
  };

  const exportCsv = () => {
    if (missing.length === 0) return;
    downloadCsvFile({
      csv: buildMissingBusinessesCsv(missing),
      fileName: createMissingBusinessesCsvFilename(),
    });
  };

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

function formatErrorMessage(prefix: string, error: unknown) {
  return `${prefix}: ${error instanceof Error ? error.message : String(error)}`;
}
