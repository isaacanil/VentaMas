// @ts-nocheck
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { db } from '@/firebase/firebaseconfig';

/**
 * Auditoría de negocios sin campo createdAt.
 * Permite:
 *  - Listar todos los negocios que NO tienen createdAt (o es falsy).
 *  - Fijar createdAt = serverTimestamp() de forma individual o masiva.
 *  - Exportar a CSV (descarga en el navegador) la lista filtrada.
 */
export default function BusinessMissingCreatedAt() {
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState([]); // solo los que no tienen createdAt
  const [progress, setProgress] = useState({ scanned: 0, total: 0 });
  const [fixing, setFixing] = useState(false);
  const [useFixedDate, setUseFixedDate] = useState(false);
  // Fecha fija solicitada: 1 de enero 2024 00:00:00 UTC
  const FIXED_ISO = '2024-01-01T00:00:00.000Z';
  const abortRef = useRef({ aborted: false });

  const totalMissing = missing.length;

  const scan = useCallback(async () => {
    setLoading(true);
    abortRef.current.aborted = false;
    setMissing([]);
    setProgress({ scanned: 0, total: 0 });
    try {
      const colRef = collection(db, 'businesses');
      const snap = await getDocs(colRef);
      const total = snap.size;
      setProgress((p) => ({ ...p, total }));
      const all = [];
      const miss = [];
      let scanned = 0;
      snap.forEach((d) => {
        if (abortRef.current.aborted) return;
        const data = d.data() || {};
        console.log('Escaneando negocio:', d.id, data.business);
        // NUEVO: el esquema real usa objeto anidado 'business'
        const businessObj = data.business || {};
        // createdAt puede estar (incorrectamente) en root por algún hotfix anterior; damos fallback pero criterio de ausencia es el anidado
        const createdAtNested = businessObj.createdAt || null;
        const createdAtRoot = data.createdAt || null;
        const effectiveCreatedAt = createdAtNested || createdAtRoot; // para mostrar
        const hasCreated = !!createdAtNested; // Solo consideramos válido si está en la ruta correcta business.createdAt
        const name = businessObj.name || '(sin nombre)';
        const item = {
          id: d.id,
          name,
          createdAt: effectiveCreatedAt,
          raw: data,
          hasCreatedAtNested: !!createdAtNested,
          hasCreatedAtRoot: !!createdAtRoot,
        };
        all.push(item);
        if (!hasCreated) miss.push(item);
        scanned++;
        if (scanned % 50 === 0) {
          setProgress({ scanned, total });
        }
      });
      setMissing(miss);
      setProgress({ scanned: total, total });
    } catch (err) {
      console.error('Error escaneando negocios:', err);
      alert('Error escaneando negocios: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelScan = () => {
    abortRef.current.aborted = true;
  };

  const getCreatedAtValue = (biz) => {
    // Si el documento tiene un createdAt legacy en la raíz, conservarlo.
    if (biz?.hasCreatedAtRoot && biz?.raw?.createdAt) {
      return biz.raw.createdAt; // Puede ser Timestamp Firestore o string ISO; se persiste tal cual.
    }
    // Si se activó la fecha fija, usar esa.
    if (useFixedDate) {
      return new Date(FIXED_ISO); // Firestore lo convertirá a Timestamp
    }
    // Caso default: serverTimestamp() actual.
    return serverTimestamp();
  };

  const fixOne = async (biz) => {
    if (fixing) return;
    try {
      setFixing(true);
      await updateDoc(doc(db, 'businesses', biz.id), {
        'business.createdAt': getCreatedAtValue(biz),
      });
      setMissing((prev) => prev.filter((b) => b.id !== biz.id));
    } catch (err) {
      console.error('Error fijando createdAt:', err);
      alert('Error fijando createdAt: ' + (err.message || err));
    } finally {
      setFixing(false);
    }
  };

  const fixAll = async () => {
    if (fixing || missing.length === 0) return;
    if (!window.confirm(`Fijar createdAt en ${missing.length} negocio(s)?`))
      return;
    try {
      setFixing(true);
      const batchSize = 400; // margen bajo el límite de 500
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
      setMissing([]);
      alert(
        'CreatedAt fijado para todos los negocios faltantes. Vuelve a escanear para verificar.',
      );
    } catch (err) {
      console.error('Error en fixAll:', err);
      alert('Error en fixAll: ' + (err.message || err));
    } finally {
      setFixing(false);
    }
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
    // Escaneo manual; no automático para evitar carga involuntaria.
  }, []);

  const pctMissing = useMemo(() => {
    if (!progress.total) return 0;
    return (missing.length / progress.total) * 100;
  }, [missing.length, progress.total]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Negocios sin createdAt</h2>
      <p style={{ color: '#555', marginTop: 4 }}>
        Escanea todos los documentos de <code>businesses</code> y muestra los
        que no tienen el campo <code>createdAt</code>.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={scan} disabled={loading || fixing}>
          {loading ? 'Escaneando…' : 'Escanear'}
        </button>
        <button onClick={cancelScan} disabled={!loading}>
          Cancelar
        </button>
        <button
          onClick={fixAll}
          disabled={fixing || loading || missing.length === 0}
        >
          {fixing ? 'Aplicando…' : `Fijar todos (${missing.length})`}
        </button>
        <button onClick={exportCsv} disabled={missing.length === 0 || loading}>
          Exportar CSV ({missing.length})
        </button>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            background: '#f6f6f6',
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          <input
            type="checkbox"
            checked={useFixedDate}
            onChange={(e) => setUseFixedDate(e.target.checked)}
            style={{ margin: 0 }}
          />
          <span>Usar fecha fija 1 Ene 2024 00:00 UTC</span>
        </label>
        <span style={{ alignSelf: 'center', fontSize: 13, color: '#555' }}>
          Escaneado: {progress.scanned} / {progress.total} · Faltantes:{' '}
          {totalMissing} ({pctMissing.toFixed(2)}%)
        </span>
      </div>
      {loading && (
        <div style={{ marginTop: 12 }}>
          <ProgressBar progress={progress} />
        </div>
      )}
      {missing.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              overflow: 'auto',
              maxHeight: '60vh',
              border: '1px solid #eee',
              borderRadius: 6,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 600,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Nombre</th>
                  <th style={th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {missing.map((b) => (
                  <tr key={b.id} style={{ background: '#fff8e1' }}>
                    <td style={td}>{b.id}</td>
                    <td style={td}>
                      {b.name ? (
                        b.name
                      ) : (
                        <em style={{ color: '#999' }}>(sin nombre)</em>
                      )}
                    </td>
                    <td style={{ ...td }}>
                      <button onClick={() => fixOne(b)} disabled={fixing}>
                        Fijar createdAt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && progress.total > 0 && missing.length === 0 && (
        <div
          style={{
            marginTop: 16,
            color: '#0f7a3e',
            background: '#eafaf1',
            padding: '8px 12px',
            borderRadius: 6,
          }}
        >
          Todos los negocios tienen createdAt ✔
        </div>
      )}
    </div>
  );
}

function ProgressBar({ progress }) {
  const pct = progress.total
    ? Math.min(100, Math.floor((progress.scanned / progress.total) * 100))
    : 0;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#555',
        }}
      >
        <span>Escaneando negocios…</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: 8,
          background: '#eee',
          borderRadius: 6,
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: pct + '%',
            background: '#1677ff',
            height: '100%',
            transition: 'width 200ms linear',
          }}
        />
      </div>
    </div>
  );
}

const th = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  background: 'white',
  zIndex: 1,
};

const td = {
  padding: '6px 10px',
  borderBottom: '1px solid #f2f2f2',
  fontSize: 13,
};

function sanitizeCsv(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\n\r]+/g, ' ')
    .trim();
}

function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
