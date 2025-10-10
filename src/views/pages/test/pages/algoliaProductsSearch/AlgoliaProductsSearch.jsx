import { SearchOutlined, DatabaseOutlined } from '@ant-design/icons';
import { algoliasearch } from "algoliasearch";
import {
  Button,
  Card,
  Typography,
  Space,
  Input,
  Table,
  Tag,
  Alert,
  Spin,
} from 'antd';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
} from 'firebase/firestore';
import _ from 'lodash';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../features/auth/userSlice';

const { Title, Text } = Typography;
const ALGOLIA_APP_ID = '2GBM9XH33Y';
const ALGOLIA_SEARCH_KEY = 'eb98e5ddbe22530b98832c64a6c006cb';
const ALGOLIA_INDEX = 'products_index';

// src/utils/backfillAllBusinessesPaged.js

import { db } from '../../../../firebase/firebaseconfig';

const PAGE_SIZE = 300;   // nº docs que leerás por bloque (ajusta a tu gusto)

/**
 * Recalcula pendingBalance de todos los negocios
 * leyendo accountsReceivable en páginas.
 *
 * @returns {Promise<{totalNegocios:number,totalClientes:number}>}
 */
export async function backfillAllBusinessesPaged() {
  const bizSnap = await getDocs(collection(db, 'businesses'));

  let totalNegocios = 0;
  let totalClientes = 0;

  for (const biz of bizSnap.docs) {
    const bid   = biz.id;
    const totals = {};        // clientId -> suma

    // --- paginación sobre accountsReceivable ---
    let last = null;
      // procesamos secuencialmente
    while (true) {
      const arQuery = query(
        collection(db, `businesses/${bid}/accountsReceivable`),
        where('isActive', '==', true),
        orderBy('__name__'),          // clave simple: id del doc
        limit(PAGE_SIZE),
        ...(last ? [startAfter(last)] : [])
      );

      const pageSnap = await getDocs(arQuery);
      if (pageSnap.empty) break;

      pageSnap.forEach((docSnap) => {
        const { clientId, arBalance } = docSnap.data();
        if (!clientId) return;
        totals[clientId] ??= 0;
        totals[clientId] += Number(arBalance) || 0;
      });

      last = pageSnap.docs[pageSnap.docs.length - 1];
      if (pageSnap.size < PAGE_SIZE) break;   // última página leída
    }

    // --- escribir los totales por cliente (batch 500) ---
    const entries = Object.entries(totals);
    for (let i = 0; i < entries.length; i += 500) {
      const batch = writeBatch(db);
      entries.slice(i, i + 500).forEach(([clientId, total]) => {
        batch.set(
          doc(db, `businesses/${bid}/clients/${clientId}`),
          { pendingBalance: total },
          { merge: true }
        );
      });
      await batch.commit();
    }

    totalNegocios += 1;
    totalClientes += entries.length;
    console.log(`✔ ${bid}: ${entries.length} clientes recalculados`);
  }

  return { totalNegocios, totalClientes };
}


export const Prueba = () => {
  const user = useSelector(selectUser);

  /* ── State ─────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);   // hits crudos de Algolia
  const [algoliaClient, setAlgoliaClient] = useState(null);

  /* ── Algolia init ───────────────────────────────────── */
  useEffect(() => {
    if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
      console.error('❌ Faltan credenciales de Algolia');
      return;
    }
    try {
      const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
      setAlgoliaClient(client);
      console.info('✅ Algolia conectado');
    } catch (err) {
      console.error('❌ Algolia error:', err);
    }
  }, []);

  /* ── Búsqueda Algolia ───────────────────────────────── */
  const searchHybrid = useCallback(
    async (q) => {
      if (!algoliaClient) return;
      setLoading(true);

      try {
        // Usar la API v5 con requests array
        const { results } = await algoliaClient.search({
          requests: [
            {
              indexName: ALGOLIA_INDEX,
              query: q || '',
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
            },
          ],
        });
        
        // results es un array, tomamos el primer resultado
        const hits = results[0]?.hits || [];
        setResults(hits);
      } catch (err) {
        console.error('❌ Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [algoliaClient]
  );

  /* ── Debounce ───────────────────────────────────────── */
  const debouncedSearch = useRef(_.debounce(searchHybrid, 300)).current;

  /* ── Handlers UI ───────────────────────────────────── */
  const onSearchInput = (value) => {
    setSearchQuery(value);
    value.trim() ? debouncedSearch(value) : searchHybrid('');
  };

  /* ── Init ───────────────────────────────────────────── */
  useEffect(() => {
    if (algoliaClient) searchHybrid('');
  }, [algoliaClient, searchHybrid]);

  /* ── Columnas de la tabla ──────────────────────────── */
  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      render: (text, r) => (
        <div>
          <Text strong>{text}</Text>
          {r._highlightResult?.name?.value && (
            <div
              style={{ fontSize: 12, color: '#666' }}
              dangerouslySetInnerHTML={{ __html: r._highlightResult.name.value }}
            />
          )}
          <div style={{ fontSize: 10, color: '#999' }}>ID: {r.objectID}</div>
        </div>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      render: (c) => (c ? <Tag color="blue">{c}</Tag> : <Tag>Sin categoría</Tag>),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      render: (s) => <Tag color={s > 0 ? 'green' : 'red'}>{s ?? 0}</Tag>,
    },
    {
      title: 'BusinessID',
      dataIndex: 'businessID',
      width: 150,
      render: (businessID, record) => {
        if (!businessID) {
          return <Tag color="red">Sin businessID</Tag>;
        }
        
        // Comparar con el businessID del usuario actual
        const isMyBusiness = businessID === user?.businessID;
        
        return (
          <div>
            <Tag color={isMyBusiness ? 'green' : 'orange'}>
              {businessID}
            </Tag>
            {isMyBusiness && (
              <div style={{ fontSize: 10, color: '#52c41a' }}>
                Mi Business
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={3}>
              <SearchOutlined style={{ color: '#1890ff' }} /> Búsqueda rápida
            </Title>
          </div>

          {/* Controles */}
          <Card title="🔍 Buscar" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Buscar productos…"
                value={searchQuery}
                onChange={(e) => onSearchInput(e.target.value)}
                onPressEnter={() => searchHybrid(searchQuery)}
              />

              <Space>
                <Button onClick={() => setSearchQuery('')}>Limpiar</Button>
                <Button type="primary" onClick={() => searchHybrid(searchQuery)}>
                  Buscar
                </Button>
              </Space>
            </Space>
          </Card>

          {/* Resultados */}
          <Card
            title={
              <Space>
                <DatabaseOutlined /> Resultados <Tag color="blue">{results.length}</Tag>{' '}
                {loading && <Spin size="small" />}
              </Space>
            }
            size="small"
          >
            <Table
              rowKey="objectID"
              dataSource={results}
              columns={columns}
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
                showQuickJumper: true,
              }}
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Estado del sistema */}
          <Alert
            type="info"
            showIcon
            message="Estado del Sistema"
            description={
              <div>
                <div>
                  <Text strong>Algolia:</Text>{' '}
                  <Tag color={algoliaClient ? 'green' : 'red'}>
                    {algoliaClient ? 'Conectado' : 'Desconectado'}
                  </Tag>
                </div>
                <div>
                  <Text strong>Query:</Text>{' '}
                  <Tag color={searchQuery ? 'blue' : 'default'}>
                    {searchQuery || '—'}
                  </Tag>
                </div>
              </div>
            }
          />
        </Space>
      </Card>
      <Button onClick={backfillAllBusinessesPaged}>Backfill</Button>
    </div>
  );
};
