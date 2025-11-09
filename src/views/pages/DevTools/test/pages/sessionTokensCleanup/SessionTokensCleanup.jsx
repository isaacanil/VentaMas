import { Alert, Button, Card, List, Space, Typography, message } from 'antd';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';
import { useState } from 'react';

import { db } from '../../../../../../firebase/firebaseconfig';

const { Paragraph, Text } = Typography;

const TOKEN_COLLECTION = 'sessionTokens';
const FETCH_LIMIT = 500;

const hasOnlyUserId = (data) => {
  if (!data || typeof data !== 'object') return false;
  const presentKeys = Object.keys(data).filter((key) => data[key] !== undefined);
  if (!presentKeys.length) return false;
  return presentKeys.every((key) => key === 'userId');
};

const toResultItem = (docSnap) => {
  const data = docSnap.data() || {};
  if (!hasOnlyUserId(data)) return null;
  return {
    id: docSnap.id,
    userId: data.userId ?? 'desconocido',
    keys: Object.keys(data),
  };
};

export default function SessionTokensCleanup() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [scanned, setScanned] = useState(0);
  const [error, setError] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchTokens = async () => {
    setLoading(true);
    setError(null);
    setScanned(0);
    try {
      const snapshot = await getDocs(
        query(collection(db, TOKEN_COLLECTION), limit(FETCH_LIMIT))
      );
      setScanned(snapshot.size);

      const items = snapshot.docs
        .map(toResultItem)
        .filter(Boolean);

      setTokens(items);

      if (!items.length) {
        messageApi.info('No se encontraron tokens incompletos en este lote.');
      }
    } catch (err) {
      const msg = err?.message || 'No se pudo consultar sessionTokens.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteTokens = async () => {
    if (!tokens.length || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const deletions = tokens.map(({ id }) =>
        deleteDoc(doc(db, TOKEN_COLLECTION, id))
      );
      const results = await Promise.allSettled(deletions);
      const failed = results.filter((result) => result.status === 'rejected');
      const successCount = results.length - failed.length;

      if (successCount) {
        messageApi.success(`Se eliminaron ${successCount} tokens.`);
      }
      if (failed.length) {
        setError(
          `No se pudieron eliminar ${failed.length} tokens. Revisa la consola para más detalles.`
        );
         
        console.error('SessionTokensCleanup delete errors:', failed);
      }
      setTokens([]);
    } catch (err) {
      const msg = err?.message || 'No se pudieron eliminar los tokens.';
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Card title="Depurar sessionTokens incompletos">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph>
            Esta herramienta busca documentos en <Text code>sessionTokens</Text> que sólo
            contengan el campo <Text code>userId</Text>. Está pensada para limpiar tokens
            heredados del sistema anterior.
          </Paragraph>
          <Alert
            type="warning"
            showIcon
            message="Alcance"
            description={
              <>
                <Paragraph style={{ marginBottom: 8 }}>
                  Cada ejecución procesa hasta {FETCH_LIMIT} documentos (sin paginar). Si el
                  proyecto tiene muchos registros, repite la búsqueda después de cada limpieza.
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
            Última consulta: se revisaron {scanned} documentos y se detectaron {tokens.length}{' '}
            tokens incompletos.
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
                      <Space direction="vertical">
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
