import {
  Card,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Alert,
  message,
  Popconfirm,
} from 'antd';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { syncProductsStockFromProductsStock } from '@/firebase/warehouse/stockSyncService';

// Developer Sync Diagnostics
// Compares totals and referential integrity across:
// - products (products.stock)
// - batches (batches.quantity & productId)
// - productsStock (per product and per batch)

const number = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0);

async function getAllProducts(businessID) {
  const ref = collection(db, 'businesses', businessID, 'products');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getAllBatches(businessID) {
  const ref = collection(db, 'businesses', businessID, 'batches');
  const qref = query(ref, where('isDeleted', '==', false));
  const snap = await getDocs(qref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function includeActiveStock(s) {
  const notDeleted = s?.isDeleted !== true; // missing counts as not deleted
  const isActive = s?.status === 'active' || s?.status == null; // missing counts as active
  return notDeleted && isActive;
}

async function getAllProductsStock(businessID) {
  const ref = collection(db, 'businesses', businessID, 'productsStock');
  const snap = await getDocs(ref);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(includeActiveStock);
}

export default function SyncDiagnostics() {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [productMismatches, setProductMismatches] = useState([]);
  const [batchMismatches, setBatchMismatches] = useState([]);
  const [orphanStocks, setOrphanStocks] = useState([]);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const businessID = user?.businessID;

  const runDiagnostics = useCallback(async () => {
    if (!businessID) return;
    setLoading(true);
    setError(null);
    try {
      const [products, batches, stocks] = await Promise.all([
        getAllProducts(businessID),
        getAllBatches(businessID),
        getAllProductsStock(businessID),
      ]);

      // Index helpers
      const productById = new Map(products.map((p) => [String(p.id), p]));
      const batchById = new Map(batches.map((b) => [String(b.id), b]));

      // 1) Product vs productsStock sum
      const stockByProduct = new Map();
      for (const s of stocks) {
        const pid = String(s.productId || '');
        if (!stockByProduct.has(pid)) stockByProduct.set(pid, 0);
        stockByProduct.set(pid, stockByProduct.get(pid) + number(s.quantity));
      }

      const productDiffs = [];
      for (const p of products) {
        const sum = stockByProduct.get(String(p.id)) || 0;
        const declared = number(p.stock);
        if (declared !== sum) {
          productDiffs.push({
            productId: p.id,
            name: p.name || '',
            declaredStock: declared,
            stockFromProductsStock: sum,
            delta: sum - declared,
          });
        }
      }

      // 2) Batch vs productsStock sum and referential checks
      const stockByBatch = new Map();
      for (const s of stocks) {
        const bid = s.batchId ? String(s.batchId) : null;
        if (!bid) continue; // some stocks might be non-batch
        if (!stockByBatch.has(bid)) stockByBatch.set(bid, 0);
        stockByBatch.set(bid, stockByBatch.get(bid) + number(s.quantity));
      }

      const batchDiffs = [];
      for (const b of batches) {
        const sum = stockByBatch.get(String(b.id)) || 0;
        const declared = number(b.quantity);
        const prodExists = b.productId
          ? productById.has(String(b.productId))
          : false;
        const prodMismatch = !prodExists;
        if (declared !== sum || prodMismatch) {
          batchDiffs.push({
            batchId: b.id,
            productId: b.productId || null,
            numberId: b.numberId || null,
            declaredQuantity: declared,
            stockFromProductsStock: sum,
            delta: sum - declared,
            productMissing: prodMismatch,
          });
        }
      }

      // 3) Orphan productsStock: missing product or batch
      const orphans = [];
      for (const s of stocks) {
        const pid = String(s.productId || '');
        const bid = s.batchId ? String(s.batchId) : null;
        const productExists = productById.has(pid);
        const batchExists = bid ? batchById.has(bid) : true; // allow null batch
        if (!productExists || !batchExists) {
          orphans.push({
            stockId: s.id,
            productId: s.productId,
            batchId: s.batchId || null,
            quantity: number(s.quantity),
            reason:
              `${!productExists ? 'ProductNotFound ' : ''}${!batchExists ? 'BatchNotFound' : ''}`.trim(),
          });
        }
      }

      setProductMismatches(productDiffs);
      setBatchMismatches(batchDiffs);
      setOrphanStocks(orphans);

      setSummary({
        products: products.length,
        batches: batches.length,
        stocks: stocks.length,
        productMismatches: productDiffs.length,
        batchMismatches: batchDiffs.length,
        orphans: orphans.length,
      });
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Error al ejecutar diagnósticos');
    } finally {
      setLoading(false);
    }
  }, [businessID]);

  const columnsProducts = [
    { title: 'Producto', dataIndex: 'name', key: 'name' },
    { title: 'Producto ID', dataIndex: 'productId', key: 'productId' },
    {
      title: 'Declarado (product.stock)',
      dataIndex: 'declaredStock',
      key: 'declaredStock',
    },
    {
      title: 'Suma productsStock',
      dataIndex: 'stockFromProductsStock',
      key: 'stockFromProductsStock',
    },
    {
      title: 'Delta',
      dataIndex: 'delta',
      key: 'delta',
      render: (v) => (
        <Tag color={v === 0 ? 'green' : v > 0 ? 'blue' : 'red'}>{v}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Popconfirm
            title="Sincronizar este producto"
            description="Actualizar product.stock con la suma de productsStock"
            okText="Sí, sincronizar"
            cancelText="Cancelar"
            onConfirm={async () => {
              if (!businessID) return;
              try {
                setSyncing(true);
                await syncProductsStockFromProductsStock(businessID, {
                  productIds: [row.productId],
                  dryRun: false,
                });
                message.success(`Producto ${row.productId} sincronizado`);
                await runDiagnostics();
              } catch (e) {
                console.error(e);
                message.error(e?.message || 'Error al sincronizar el producto');
              } finally {
                setSyncing(false);
              }
            }}
          >
            <Button size="small" loading={syncing} disabled={!businessID}>
              Sincronizar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const columnsBatches = [
    { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId' },
    { title: 'Producto ID', dataIndex: 'productId', key: 'productId' },
    { title: 'BatchNumber', dataIndex: 'numberId', key: 'numberId' },
    {
      title: 'Declarado (batch.quantity)',
      dataIndex: 'declaredQuantity',
      key: 'declaredQuantity',
    },
    {
      title: 'Suma productsStock',
      dataIndex: 'stockFromProductsStock',
      key: 'stockFromProductsStock',
    },
    {
      title: 'Delta',
      dataIndex: 'delta',
      key: 'delta',
      render: (v) => (
        <Tag color={v === 0 ? 'green' : v > 0 ? 'blue' : 'red'}>{v}</Tag>
      ),
    },
    {
      title: 'Producto existe',
      dataIndex: 'productMissing',
      key: 'productMissing',
      render: (m) =>
        m ? <Tag color="red">Missing</Tag> : <Tag color="green">OK</Tag>,
    },
  ];

  const columnsOrphans = [
    { title: 'Stock ID', dataIndex: 'stockId', key: 'stockId' },
    { title: 'Producto ID', dataIndex: 'productId', key: 'productId' },
    { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Razón',
      dataIndex: 'reason',
      key: 'reason',
      render: (r) => <Tag color="red">{r}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3}>
        Diagnóstico de sincronización: Productos vs Batches vs ProductsStock
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Herramienta de desarrollo. Compara totales declarados con agregados
        reales y verifica integridad referencial.
      </Typography.Paragraph>

      {!businessID && (
        <Alert type="warning" message="No hay businessID en sesión" showIcon />
      )}

      <Card>
        <Space wrap>
          <Button
            type="primary"
            loading={loading}
            onClick={runDiagnostics}
            disabled={!businessID}
          >
            Ejecutar diagnóstico
          </Button>
          <Button
            onClick={async () => {
              if (!businessID) return;
              setSyncResult(null);
              setError(null);
              try {
                setSyncing(true);
                const res = await syncProductsStockFromProductsStock(
                  businessID,
                  { dryRun: true },
                );
                setSyncResult({ mode: 'dry-run', ...res });
                message.info(
                  `Dry-run: ${res.updates.length} productos quedarían actualizados`,
                );
              } catch (e) {
                console.error(e);
                setError(e?.message || 'Error en dry-run');
              } finally {
                setSyncing(false);
              }
            }}
            loading={syncing}
            disabled={!businessID}
          >
            Dry-run sincronización (productsStock → product.stock)
          </Button>
          <Popconfirm
            title="Aplicar sincronización"
            description="Actualizar product.stock con la suma de productsStock para todos los productos"
            okText="Sí, aplicar"
            cancelText="Cancelar"
            onConfirm={async () => {
              if (!businessID) return;
              setSyncResult(null);
              setError(null);
              try {
                setSyncing(true);
                const res = await syncProductsStockFromProductsStock(
                  businessID,
                  { dryRun: false },
                );
                setSyncResult({ mode: 'apply', ...res });
                message.success(
                  `Sincronizados ${res.updates.length} productos`,
                );
                await runDiagnostics();
              } catch (e) {
                console.error(e);
                setError(e?.message || 'Error al aplicar sincronización');
              } finally {
                setSyncing(false);
              }
            }}
          >
            <Button
              type="primary"
              danger
              loading={syncing}
              disabled={!businessID}
            >
              Aplicar sincronización global
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {summary && (
        <Card>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="Productos" value={summary.products} />
            </Col>
            <Col span={4}>
              <Statistic title="Batches" value={summary.batches} />
            </Col>
            <Col span={4}>
              <Statistic title="Stocks" value={summary.stocks} />
            </Col>
            <Col span={4}>
              <Statistic
                title="Prod con mismatch"
                value={summary.productMismatches}
                valueStyle={{
                  color: summary.productMismatches ? '#cf1322' : '#3f8600',
                }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Batches con mismatch"
                value={summary.batchMismatches}
                valueStyle={{
                  color: summary.batchMismatches ? '#cf1322' : '#3f8600',
                }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Orphans"
                value={summary.orphans}
                valueStyle={{ color: summary.orphans ? '#cf1322' : '#3f8600' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card title={`Productos con diferencias (${productMismatches.length})`}>
        <Table
          size="small"
          rowKey={(r) => `${r.productId}`}
          dataSource={productMismatches}
          columns={columnsProducts}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card
        title={`Batches con diferencias o referencias inválidas (${batchMismatches.length})`}
      >
        <Table
          size="small"
          rowKey={(r) => `${r.batchId}`}
          dataSource={batchMismatches}
          columns={columnsBatches}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title={`ProductsStock huérfanos (${orphanStocks.length})`}>
        <Table
          size="small"
          rowKey={(r) => `${r.stockId}`}
          dataSource={orphanStocks}
          columns={columnsOrphans}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {error && <Alert type="error" message={error} showIcon />}
      {syncResult && (
        <Alert
          type={syncResult.mode === 'apply' ? 'success' : 'info'}
          showIcon
          message={
            syncResult.mode === 'apply'
              ? 'Sincronización aplicada'
              : 'Resultado dry-run'
          }
          description={`${syncResult.updates.length} productos ${syncResult.mode === 'apply' ? 'actualizados' : 'a actualizar'} de ${syncResult.totalProducts}`}
        />
      )}
    </Space>
  );
}
