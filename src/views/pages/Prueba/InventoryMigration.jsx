import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Button, Card, Checkbox, Input, Typography, Alert } from 'antd'
import { migrateAllBusinessesInventoryCounts } from '../InventoryControl/tools/migrateInventoryCounts'

// Simple UI to trigger migration from the app (non Cloud Function)
// Props:
// - db: Firestore instance (required)
// - defaultBusinessIds?: string[] (optional)
export default function InventoryMigration({ db, defaultBusinessIds = [] }) {
  const [dryRun, setDryRun] = useState(true)
  const [running, setRunning] = useState(false)
  const [businessIdsInput, setBusinessIdsInput] = useState(defaultBusinessIds.join(','))
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const logsRef = useRef([])
  const [tick, setTick] = useState(0)

  const parsedBusinessIds = useMemo(() => {
    const raw = String(businessIdsInput || '').trim()
    if (!raw) return [] // Empty array means "all businesses"
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }, [businessIdsInput])

  const handleRun = useCallback(async () => {
    if (!db) { setError('Firestore db no disponible. Pasa la instancia como prop.'); return }
    setRunning(true)
    setError(null)
    setSummary(null)
    logsRef.current = []
    try {
      const res = await migrateAllBusinessesInventoryCounts(db, {
        businessIds: parsedBusinessIds,
        dryRun,
        onProgress: (info) => {
          if (info?.type === 'log' && info.msg) {
            logsRef.current.push(info.msg)
            if (logsRef.current.length > 1000) logsRef.current.shift()
            setTick(t => t + 1)
          }
        }
      })
      setSummary(res)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setRunning(false)
    }
  }, [db, parsedBusinessIds, dryRun])

  return (
    <Card title="Inventory Counts Migration" bordered style={{ maxWidth: 900, margin: '16px auto' }}>
      <Typography.Paragraph type="secondary">
        Actualiza documentos de conteo en sesiones de inventario:
        copia campos antiguos (conteoReal, stockSistema, diferencia) a los nuevos (realCount, systemStock, difference) y elimina los antiguos.
        <br />
        <strong>Si no especificas Business IDs, se migrarán TODOS los negocios en la base de datos.</strong>
      </Typography.Paragraph>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Typography.Text strong>Business IDs (opcional, separados por coma)</Typography.Text>
          <Input
            placeholder="Dejar vacío para migrar TODOS los negocios"
            value={businessIdsInput}
            onChange={e => setBusinessIdsInput(e.target.value)}
            disabled={running}
          />
          {!businessIdsInput.trim() && (
            <Typography.Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              ⚠️ Se migrarán TODOS los negocios
            </Typography.Text>
          )}
        </div>
        <div>
          <Checkbox checked={dryRun} onChange={e => setDryRun(e.target.checked)} disabled={running}>
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
        <Alert style={{ marginTop: 16 }} type="error" message="Error" description={error} showIcon />
      )}

      {summary && (
        <Card size="small" style={{ marginTop: 16 }} title="Resumen">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Stat label="Negocios" value={summary.businesses} />
            <Stat label="Sesiones" value={summary.sessions} />
            <Stat label="Docs Escaneados" value={summary.docsScanned} />
            <Stat label="Docs Actualizados" value={summary.docsUpdated} />
            <Stat label="Campos Migrados" value={summary.fieldsMigrated} />
            <Stat label="Errores" value={summary.errors} />
          </div>
        </Card>
      )}

      <Card size="small" style={{ marginTop: 16 }} title="Logs">
        <pre style={{ maxHeight: 300, overflow: 'auto', background: '#0b1021', color: '#d6deeb', padding: 12, borderRadius: 6 }}>
          {logsRef.current.join('\n')}
        </pre>
      </Card>
    </Card>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
      <div style={{ fontSize: 11, opacity: .65, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

