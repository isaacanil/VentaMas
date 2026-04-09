import { Alert, Button, Card, List, Space, Typography, message } from 'antd';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';
import { useReducer } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const { Paragraph, Text } = Typography;

const FETCH_LIMIT = 500;

interface SessionTokenDoc {
  userId?: string;
  [key: string]: unknown;
}

interface TokenResultItem {
  id: string;
  userId: string;
  keys: string[];
}

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

const hasOnlyUserId = (data: SessionTokenDoc | null | undefined) => {
  if (!data || typeof data !== 'object') return false;
  const presentKeys = Object.keys(data).filter(
    (key) => data[key] !== undefined,
  );
  if (!presentKeys.length) return false;
  return presentKeys.every((key) => key === 'userId');
};

const toResultItem = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
): TokenResultItem | null => {
  const data = (docSnap.data() || {}) as SessionTokenDoc;
  if (!hasOnlyUserId(data)) return null;
  return {
    id: docSnap.id,
    userId: data.userId ?? 'desconocido',
    keys: Object.keys(data),
  };
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
    void getDocs(query(collection(db, 'sessionTokens'), limit(FETCH_LIMIT)))
      .then(
        (snapshot) => {
          const items = snapshot.docs.map(toResultItem).filter(Boolean);
          dispatch({
            type: 'finishFetch',
            scanned: snapshot.size,
            tokens: items,
          });

          if (!items.length) {
            messageApi.info('No se encontraron tokens incompletos en este lote.');
          }
        },
        (error) => {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo consultar sessionTokens.';
          dispatch({ type: 'fetchError', error: message });
        },
      );
  };

  const deleteTokens = () => {
    if (!tokens.length || deleting) return;
    dispatch({ type: 'startDelete' });
    const deletions = tokens.map(({ id }) =>
      deleteDoc(doc(db, 'sessionTokens', id)),
    );

    void Promise.allSettled(deletions)
      .then(
        (results) => {
          const failed = results.filter((result) => result.status === 'rejected');
          const successCount = results.length - failed.length;

          if (successCount) {
            messageApi.success(`Se eliminaron ${successCount} tokens.`);
          }
          if (failed.length) {
            dispatch({
              type: 'deleteError',
              error: `No se pudieron eliminar ${failed.length} tokens. Revisa la consola para más detalles.`,
            });
            console.error('SessionTokensCleanup delete errors:', failed);
            return;
          }
          dispatch({ type: 'finishDelete', tokens: [] });
        },
        (error) => {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudieron eliminar los tokens.';
          dispatch({ type: 'deleteError', error: message });
        },
      );
  };

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Card title="Depurar sessionTokens incompletos">
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph>
            Esta herramienta busca documentos en <Text code>sessionTokens</Text>{' '}
            que sólo contengan el campo <Text code>userId</Text>. Está pensada
            para limpiar tokens heredados del sistema anterior.
          </Paragraph>
          <Alert
            type="warning"
            showIcon
            message="Alcance"
            description={
              <>
                <Paragraph style={{ marginBottom: 8 }}>
                  Cada ejecución procesa hasta {FETCH_LIMIT} documentos (sin
                  paginar). Si el proyecto tiene muchos registros, repite la
                  búsqueda después de cada limpieza.
                </Paragraph>
                <Paragraph style={{ margin: 0 }}>
                  Verifica que no existan tokens activos antes de eliminar.
                </Paragraph>
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
            Última consulta: se revisaron {scanned} documentos y se detectaron{' '}
            {tokens.length} tokens incompletos.
          </Paragraph>
          {error ? (
            <Alert type="error" showIcon message={error} />
          ) : (
            <List
              bordered
              dataSource={tokens}
              locale={{ emptyText: 'Sin tokens para eliminar' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text code>{item.id}</Text>}
                    description={
                      <Space orientation="vertical">
                        <Text>
                          <Text strong>ID de usuario:</Text> {item.userId}
                        </Text>
                        <Text type="secondary">
                          Campos presentes: {item.keys.join(', ') || 'ninguno'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Card>
    </Space>
  );
}
