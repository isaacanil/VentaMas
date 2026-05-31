import { Alert, Button, Card, Space, Typography, message } from 'antd';
import { useReducer } from 'react';

import {
  ContentStack,
  LastWarningParagraph,
  PageStack,
  WarningParagraph,
} from './SessionTokensCleanup.styles';
import { SessionTokensCleanupResults } from './components/SessionTokensCleanupResults';
import {
  deleteSessionTokens,
  FETCH_LIMIT,
  fetchIncompleteSessionTokens,
} from './repositories/sessionTokensCleanup.repository';
import type { TokenResultItem } from './types';

const { Paragraph, Text } = Typography;

interface SessionTokensCleanupState {
  loading: boolean;
  deleting: boolean;
  tokens: TokenResultItem[];
  scanned: number;
  error: string | null;
}

type SessionTokensCleanupAction =
  | { type: 'startFetch' }
  | { type: 'finishFetch'; scanned: number; tokens: TokenResultItem[] }
  | { type: 'fetchError'; error: string }
  | { type: 'startDelete' }
  | { type: 'finishDelete'; tokens: TokenResultItem[] }
  | { type: 'deleteError'; error: string };

const initialSessionTokensCleanupState: SessionTokensCleanupState = {
  loading: false,
  deleting: false,
  tokens: [],
  scanned: 0,
  error: null,
};

const sessionTokensCleanupReducer = (
  state: SessionTokensCleanupState,
  action: SessionTokensCleanupAction,
): SessionTokensCleanupState => {
  switch (action.type) {
    case 'startFetch':
      return {
        ...state,
        loading: true,
        error: null,
        scanned: 0,
      };
    case 'finishFetch':
      return {
        ...state,
        loading: false,
        scanned: action.scanned,
        tokens: action.tokens,
      };
    case 'fetchError':
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    case 'startDelete':
      return {
        ...state,
        deleting: true,
        error: null,
      };
    case 'finishDelete':
      return {
        ...state,
        deleting: false,
        tokens: action.tokens,
      };
    case 'deleteError':
      return {
        ...state,
        deleting: false,
        error: action.error,
      };
    default:
      return state;
  }
};

export default function SessionTokensCleanup() {
  const [state, dispatch] = useReducer(
    sessionTokensCleanupReducer,
    initialSessionTokensCleanupState,
  );
  const { loading, deleting, tokens, scanned, error } = state;
  const [messageApi, contextHolder] = message.useMessage();

  const fetchTokens = () => {
    dispatch({ type: 'startFetch' });

    void fetchIncompleteSessionTokens().then(
      ({ scanned: scannedCount, tokens: nextTokens }) => {
        dispatch({
          type: 'finishFetch',
          scanned: scannedCount,
          tokens: nextTokens,
        });

        if (!nextTokens.length) {
          messageApi.info('No se encontraron tokens incompletos en este lote.');
        }
      },
      (error) => {
        dispatch({
          type: 'fetchError',
          error: formatErrorMessage(
            error,
            'No se pudo consultar sessionTokens.',
          ),
        });
      },
    );
  };

  const deleteTokens = () => {
    if (!tokens.length || deleting) return;
    dispatch({ type: 'startDelete' });

    void deleteSessionTokens(tokens.map(({ id }) => id)).then(
      ({ successCount, failedCount, failures }) => {
        if (successCount) {
          messageApi.success(`Se eliminaron ${successCount} tokens.`);
        }
        if (failedCount) {
          dispatch({
            type: 'deleteError',
            error: `No se pudieron eliminar ${failedCount} tokens. Revisa la consola para mas detalles.`,
          });
          console.error('SessionTokensCleanup delete errors:', failures);
          return;
        }
        dispatch({ type: 'finishDelete', tokens: [] });
      },
      (error) => {
        dispatch({
          type: 'deleteError',
          error: formatErrorMessage(
            error,
            'No se pudieron eliminar los tokens.',
          ),
        });
      },
    );
  };

  return (
    <PageStack orientation="vertical" size="large">
      {contextHolder}
      <Card title="Depurar sessionTokens incompletos">
        <ContentStack orientation="vertical" size="middle">
          <Paragraph>
            Esta herramienta busca documentos en <Text code>sessionTokens</Text>{' '}
            que solo contengan el campo <Text code>userId</Text>. Esta pensada
            para limpiar tokens heredados del sistema anterior.
          </Paragraph>
          <Alert
            type="warning"
            showIcon
            message="Alcance"
            description={
              <>
                <WarningParagraph>
                  Cada ejecucion procesa hasta {FETCH_LIMIT} documentos (sin
                  paginar). Si el proyecto tiene muchos registros, repite la
                  busqueda despues de cada limpieza.
                </WarningParagraph>
                <LastWarningParagraph>
                  Verifica que no existan tokens activos antes de eliminar.
                </LastWarningParagraph>
              </>
            }
          />
          <Space>
            <Button loading={loading} onClick={fetchTokens}>
              Buscar tokens incompletos
            </Button>
            <Button
              type="primary"
              danger
              disabled={!tokens.length}
              loading={deleting}
              onClick={deleteTokens}
            >
              Eliminar tokens listados
            </Button>
          </Space>
          <Paragraph type="secondary">
            Ultima consulta: se revisaron {scanned} documentos y se detectaron{' '}
            {tokens.length} tokens incompletos.
          </Paragraph>
          {error ? (
            <Alert type="error" showIcon message={error} />
          ) : (
            <SessionTokensCleanupResults tokens={tokens} />
          )}
        </ContentStack>
      </Card>
    </PageStack>
  );
}

function formatErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
