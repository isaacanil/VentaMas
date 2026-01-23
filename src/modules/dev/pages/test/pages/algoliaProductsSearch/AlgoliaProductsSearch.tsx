import { DatabaseOutlined, SearchOutlined } from '@/constants/icons/antd';
import { algoliasearch } from 'algoliasearch';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { ColumnsType } from 'antd/es/table';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { debounce } from '@/utils/lodash-minimal';

const { Title, Paragraph, Text } = Typography;

type AlgoliaClient = ReturnType<typeof algoliasearch>;
type AlgoliaIndex = ReturnType<AlgoliaClient['initIndex']>;

interface AlgoliaHit {
  objectID: string;
  name?: string;
  path?: string;
  pricing?: { price?: number | string | null };
  businessID?: string;
  category?: string | string[];
  stock?: number | string | null;
  _highlightResult?: {
    name?: {
      value?: string;
    };
  };
  [key: string]: unknown;
}

type DebouncedSearch = ((value: string) => void) & { cancel: () => void };

// Permite definir credenciales via variables de entorno (Vite) y deja valores de respaldo
const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || '2GBM9XH33Y';
const ALGOLIA_SEARCH_KEY =
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || 'eb98e5ddbe22530b98832c64a6c006cb';
const ALGOLIA_INDEX_NAME =
  import.meta.env.VITE_ALGOLIA_PRODUCTS_INDEX || 'products_index';

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

const formatCurrency = (value: unknown) => {
  if (value === undefined || value === null) return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return currencyFormatter.format(amount);
};

/**
 * Panel de diagnóstico para ejecutar búsquedas en Algolia
 * y revisar la consistencia de los documentos en Firestore.
 */
export function AlgoliaProductsSearch() {
  const user = useSelector(selectUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [index, setIndex] = useState<AlgoliaIndex | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHit, setSelectedHit] = useState<AlgoliaHit | null>(null);
  const [firestoreDoc, setFirestoreDoc] = useState<Record<string, unknown> | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [firestoreLoading, setFirestoreLoading] = useState(false);

  const isConfigured =
    Boolean(ALGOLIA_APP_ID) &&
    Boolean(ALGOLIA_SEARCH_KEY) &&
    Boolean(ALGOLIA_INDEX_NAME);

  const connectToAlgolia = useCallback(() => {
    if (!isConfigured) {
      setConnectionError(
        'Faltan credenciales o el nombre del índice. Define VITE_ALGOLIA_APP_ID, VITE_ALGOLIA_SEARCH_KEY y VITE_ALGOLIA_PRODUCTS_INDEX.',
      );
      setIndex(null);
      return;
    }

    setIsInitializing(true);
    setConnectionError(null);
    try {
      const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
      const nextIndex = client.initIndex(ALGOLIA_INDEX_NAME);
      setIndex(nextIndex);
    } catch (error) {
      console.error('Algolia init error', error);
      setConnectionError(
        error instanceof Error
          ? error.message
          : 'No fue posible inicializar Algolia.',
      );
      setIndex(null);
    } finally {
      setIsInitializing(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    connectToAlgolia();
  }, [connectToAlgolia]);

  const performSearch = useCallback(
    async (queryValue: string = '') => {
      if (!index) return;
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await index.search(queryValue, {
          attributesToRetrieve: [
            'objectID',
            'name',
            'path',
            'pricing.price',
            'businessID',
            'category',
            'stock',
          ],
          attributesToHighlight: ['name'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
          hitsPerPage: 30,
        });

        setHits((response.hits ?? []) as AlgoliaHit[]);
      } catch (error) {
        console.error('Algolia search error', error);
        setSearchError(
          error instanceof Error
            ? error.message
            : 'Error durante la búsqueda en Algolia.',
        );
        setHits([]);
      } finally {
        setIsSearching(false);
      }
    },
    [index],
  );

  const debouncedSearch = useMemo<DebouncedSearch>(
    () =>
      debounce((value) => {
        performSearch(value);
      }, 300),
    [performSearch],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (index) {
      performSearch('');
    }
  }, [index, performSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      debouncedSearch.cancel();
      performSearch('');
      return;
    }

    debouncedSearch(value);
  };

  const handleManualSearch = () => {
    debouncedSearch.cancel();
    performSearch(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    debouncedSearch.cancel();
    performSearch('');
  };

  const openFirestorePreview = useCallback(async (record: AlgoliaHit) => {
    setSelectedHit(record);
    setFirestoreDoc(null);
    setFirestoreError(null);
    setFirestoreLoading(false);
    setDrawerOpen(true);

    if (!record?.path) {
      setFirestoreError('El resultado no incluye la propiedad `path`.');
      return;
    }

    const normalizedPath = record.path.replace(/^\/+/, '');

    setFirestoreLoading(true);
    try {
      const snapshot = await getDoc(doc(db, normalizedPath));

      if (!snapshot.exists()) {
        setFirestoreError('Documento no encontrado en Firestore.');
        return;
      }

      setFirestoreDoc(snapshot.data() as Record<string, unknown>);
    } catch (error) {
      console.error('Firestore fetch error', error);
      setFirestoreError(
        error instanceof Error ? error.message : 'Error consultando Firestore.',
      );
    } finally {
      setFirestoreLoading(false);
    }
  }, []);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedHit(null);
    setFirestoreDoc(null);
    setFirestoreError(null);
  };

  const columns: ColumnsType<AlgoliaHit> = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text: string | undefined, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{text || 'Sin nombre'}</Text>
          {record?._highlightResult?.name?.value && (
            <Text
              style={{ fontSize: 12, color: '#666' }}
              dangerouslySetInnerHTML={{
                __html: record._highlightResult.name.value,
              }}
            />
          )}
          {record.objectID && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              ID: {record.objectID}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Precio',
      dataIndex: ['pricing', 'price'],
      key: 'pricing.price',
      render: (value) => <Tag color="purple">{formatCurrency(value)}</Tag>,
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (value: AlgoliaHit['category']) => {
        if (!value) return <Tag color="default">Sin categoría</Tag>;
        if (Array.isArray(value)) {
          return (
            <Space size={[4, 4]} wrap>
              {value.map((item) => (
                <Tag color="blue" key={item}>
                  {item}
                </Tag>
              ))}
            </Space>
          );
        }
        return <Tag color="blue">{value}</Tag>;
      },
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: AlgoliaHit['stock']) => (
        <Tag color={Number(stock) > 0 ? 'green' : 'red'}>
          {Number.isFinite(Number(stock)) ? Number(stock) : 0}
        </Tag>
      ),
    },
    {
      title: 'Business ID',
      dataIndex: 'businessID',
      key: 'businessID',
      render: (businessID: AlgoliaHit['businessID']) => {
        if (!businessID) {
          return <Tag color="red">Sin businessID</Tag>;
        }

        const isCurrentBusiness = businessID === user?.businessID;

        return (
          <Space direction="vertical" size={0}>
            <Tag color={isCurrentBusiness ? 'green' : 'orange'}>
              {businessID}
            </Tag>
            {isCurrentBusiness && (
              <Text type="success" style={{ fontSize: 11 }}>
                Tu negocio activo
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          icon={<DatabaseOutlined />}
          size="small"
          onClick={() => openFirestorePreview(record)}
        >
          Ver en Firebase
        </Button>
      ),
    },
  ];

  const statusTag = (() => {
    if (!isConfigured) {
      return <Tag color="red">Configuración incompleta</Tag>;
    }
    if (isInitializing) {
      return (
        <Tag color="blue">
          <Spin size="small" style={{ marginRight: 6 }} /> Conectando…
        </Tag>
      );
    }
    if (index) {
      return <Tag color="green">Conectado</Tag>;
    }
    return <Tag color="volcano">Desconectado</Tag>;
  })();

  return (
    <>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Búsqueda de productos con Algolia
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Ejecuta búsquedas en tiempo real sobre el índice{' '}
              <Text code>{ALGOLIA_INDEX_NAME}</Text> y valida contra los datos
              en Firestore.
            </Paragraph>
          </div>

          <Alert
            type={connectionError ? 'error' : 'info'}
            showIcon
            message="Estado de la integración"
            description={
              <Space direction="vertical">
                <Space>
                  <Text strong>Algolia:</Text> {statusTag}
                  <Button size="small" onClick={connectToAlgolia}>
                    Volver a conectar
                  </Button>
                </Space>
                <div>
                  <Text strong>App ID:</Text>{' '}
                  <Tag color={ALGOLIA_APP_ID ? 'blue' : 'default'}>
                    {ALGOLIA_APP_ID || 'No definido'}
                  </Tag>
                </div>
                <div>
                  <Text strong>Índice:</Text>{' '}
                  <Tag color={ALGOLIA_INDEX_NAME ? 'blue' : 'default'}>
                    {ALGOLIA_INDEX_NAME || 'No definido'}
                  </Tag>
                </div>
                <div>
                  <Text strong>Business activo:</Text>{' '}
                  <Tag color={user?.businessID ? 'green' : 'default'}>
                    {user?.businessID || 'Sin negocio activo'}
                  </Tag>
                </div>
                {connectionError && (
                  <Text type="danger">{connectionError}</Text>
                )}
              </Space>
            }
          />

          <Card title="Buscar" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Input
                size="large"
                prefix={<SearchOutlined />}
                placeholder="Nombre, código, SKU…"
                value={searchQuery}
                onChange={handleInputChange}
                onPressEnter={handleManualSearch}
                allowClear
              />
              <Space>
                <Button onClick={handleReset}>Limpiar</Button>
                <Button
                  type="primary"
                  onClick={handleManualSearch}
                  loading={isSearching}
                >
                  Buscar
                </Button>
              </Space>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                Resultados <Tag color="blue">{hits.length}</Tag>
                {(isSearching || isInitializing) && <Spin size="small" />}
              </Space>
            }
            size="small"
          >
            <Table
              rowKey="objectID"
              dataSource={hits}
              columns={columns}
              loading={isSearching || isInitializing}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              locale={{
                emptyText: searchError ? (
                  <Alert type="error" message={searchError} showIcon />
                ) : (
                  'Sin resultados'
                ),
              }}
              scroll={{ x: 900 }}
            />
          </Card>

          {searchError && (
            <Alert
              type="warning"
              showIcon
              message="Búsqueda fallida"
              description={searchError}
            />
          )}
        </Space>
      </Card>

      <Drawer
        title={
          <Space direction="vertical" size={0}>
            <Text strong>Detalle en Firebase</Text>
            {selectedHit?.path && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedHit.path}
              </Text>
            )}
          </Space>
        }
        width={520}
        onClose={closeDrawer}
        open={drawerOpen}
      >
        {firestoreLoading && (
          <Space>
            <Spin />
            <Text>Cargando documento…</Text>
          </Space>
        )}

        {!firestoreLoading && firestoreError && (
          <Alert
            type="error"
            showIcon
            message="Error"
            description={firestoreError}
          />
        )}

        {!firestoreLoading && !firestoreError && firestoreDoc && (
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: 16,
              borderRadius: 6,
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(firestoreDoc, null, 2)}
          </pre>
        )}

        {!firestoreLoading && !firestoreError && !firestoreDoc && (
          <Alert
            type="info"
            showIcon
            message="Selecciona un registro"
            description="Elige un resultado con la acción “Ver en Firebase” para inspeccionar los datos en Firestore."
          />
        )}
      </Drawer>
    </>
  );
}



