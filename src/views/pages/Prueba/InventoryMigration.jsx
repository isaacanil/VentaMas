import { Alert, Button, Card, Checkbox, Input, Typography } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

import { syncAllBusinessesProductsStock } from '../../../firebase/warehouse/stockSyncService';

// Panel para alinear product.stock con la suma de productsStock por negocio.
// Props:
// - db: Firestore instance (no se utiliza directamente, pero mantiene compatibilidad con el wrapper)
// - defaultBusinessIds?: string[] (opcional)
export default function InventoryMigration({ defaultBusinessIds = [] }) {
  const [dryRun, setDryRun] = useState(true);
  const [running, setRunning] = useState(false);
  const [businessIdsInput, setBusinessIdsInput] = useState(
    defaultBusinessIds.join(','),
  );
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const parsedBusinessIds = useMemo(() => {
    const raw = String(businessIdsInput || '').trim();
    if (!raw) return []; // vacío => todos los negocios
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [businessIdsInput]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await syncAllBusinessesProductsStock({
        businessIds: parsedBusinessIds,
        dryRun,
        filterActive: true,
      });
      setResults(res);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  }, [parsedBusinessIds, dryRun]);

  const summary = useMemo(() => {
    if (!Array.isArray(results)) return null;
    const totals = results.reduce(
      (acc, item) => {
        if (item?.error) {
          acc.errors += 1;
          return acc;
        }
        const updates = Array.isArray(item?.updates) ? item.updates.length : 0;
        const invalid = Array.isArray(item?.invalidProductIds)
          ? item.invalidProductIds.length
          : 0;
        acc.businesses += 1;
        acc.updatedProducts += updates;
        acc.totalProducts +=
          typeof item?.totalProducts === 'number' ? item.totalProducts : 0;
        acc.invalidProducts += invalid;
        if (invalid > 0) acc.errors += 1;
        return acc;
      },
      {
        businesses: 0,
        updatedProducts: 0,
        totalProducts: 0,
        invalidProducts: 0,
        errors: 0,
      },
    );
    totals.requested =
      Array.isArray(parsedBusinessIds) && parsedBusinessIds.length > 0
        ? parsedBusinessIds.length
        : results.length;
    return totals;
  }, [results, parsedBusinessIds]);

  return (
    <Card
      title="Sincronizar stock declarado"
      bordered
      style={{ maxWidth: 900, margin: '16px auto' }}
    >
      <Typography.Paragraph type="secondary">
        Ajusta el campo <code>products.stock</code> sumando las cantidades
        activas en <code>productsStock</code>. Puedes simular primero (Dry Run)
        o aplicar los cambios directamente.
        <br />
        <strong>
          Si dejas la lista vacía se procesarán TODOS los negocios.
        </strong>
      </Typography.Paragraph>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <Typography.Text strong>
            Business IDs (opcional, separados por coma)
          </Typography.Text>
          <Input
            placeholder="Dejar vacío para migrar TODOS los negocios"
            value={businessIdsInput}
            onChange={(e) => setBusinessIdsInput(e.target.value)}
            disabled={running}
          />
          {!businessIdsInput.trim() && (
            <Typography.Text
              type="warning"
              style={{ fontSize: 12, display: 'block', marginTop: 4 }}
            >
              ⚠️ Se migrarán TODOS los negocios
            </Typography.Text>
          )}
        </div>
        <div>
          <Checkbox
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            disabled={running}
          >
            Dry Run (solo simula)
          </Checkbox>
        </div>
        <div>
          <Button type="primary" onClick={handleRun} loading={running}>
            {dryRun ? 'Simular migración' : 'Ejecutar migración'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          message="Error"
          description={error}
          showIcon
        />
      )}

      {summary && (
        <Card size="small" style={{ marginTop: 16 }} title="Resumen">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            <Stat label="Negocios solicitados" value={summary.requested} />
            <Stat label="Negocios sincronizados" value={summary.businesses} />
            <Stat
              label="Productos actualizados"
              value={summary.updatedProducts}
            />
            <Stat label="Productos revisados" value={summary.totalProducts} />
            <Stat label="IDs inválidos" value={summary.invalidProducts} />
            <Stat label="Errores" value={summary.errors} />
          </div>
        </Card>
      )}

      {Array.isArray(results) && results.length > 0 && (
        <Card
          size="small"
          style={{ marginTop: 16 }}
          title="Detalle por negocio"
        >
          <pre
            style={{
              maxHeight: 320,
              overflow: 'auto',
              background: '#0b1021',
              color: '#d6deeb',
              padding: 12,
              borderRadius: 6,
            }}
          >
            {results
              .map((item) => {
                if (item?.error) {
                  return `[${item.businessId}] ❌ ${item.error.message || item.error}`;
                }
                const updatedCount = Array.isArray(item?.updates)
                  ? item.updates.length
                  : 0;
                const invalidIds = Array.isArray(item?.invalidProductIds)
                  ? item.invalidProductIds
                  : [];
                const invalidLabel = invalidIds.length
                  ? ` | IDs omitidos: ${invalidIds
                      .map((inv) => {
                        if (typeof inv === 'string') return inv || '(vacío)';
                        if (inv && typeof inv === 'object')
                          return inv.productId || inv.name || '(sin id)';
                        return String(inv);
                      })
                      .join(', ')}`
                  : '';
                return `[${item.businessId}] ${
                  dryRun ? 'Simulación' : 'Aplicado'
                } → ${updatedCount} productos (${item.totalProducts ?? 'n/a'} revisados)${invalidLabel}`;
              })
              .join('\n')}
          </pre>
        </Card>
      )}
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
      <div
        style={{
          fontSize: 11,
          opacity: 0.65,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
