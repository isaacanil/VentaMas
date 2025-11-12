import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../features/auth/userSlice';
import { fbEqualizeProductPrice, fbEqualizeProductsPrice, fbEqualizeAllProductsPrice } from '../../../../../firebase/products/fbEqualizeProductPrice';
import { useGetProducts } from '../../../../../firebase/products/fbGetProducts.js';

function toNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export default function CheckProductPriceAudit() {
  const { products } = useGetProducts();
  const user = useSelector(selectUser);
  // Filtro de vista: 'equal' | 'mismatch' | 'all'
  const [viewFilter, setViewFilter] = useState('equal');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const rows = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.map((p) => {
      const id = p.id || p._id || p.code || p.sku || 'sin-id';
      const name = p.name || p.title || 'sin-nombre';
  const listPrice = toNumber(p?.pricing?.listPrice);
  const price = toNumber(p?.pricing?.price);

      const record = {
        id,
        name,
    listPrice,
    price,
    eqLPPrice: price === listPrice,
      };
      record.diffLP = round2(price - listPrice);
      return record;
    });
  }, [products]);

  const equalCount = rows.filter((r) => r.eqLPPrice).length;
  const mismatchCount = rows.length - equalCount;

  let visible = rows;
  if (viewFilter === 'equal') {
    visible = rows.filter((r) => r.eqLPPrice);
  } else if (viewFilter === 'mismatch') {
    visible = rows.filter((r) => !r.eqLPPrice);
  }

  const handleFixOne = async (row) => {
    if (!row?.id) return;
    await fbEqualizeProductPrice(user, row.id, row.listPrice);
  };

  const handleFixAllMismatch = async () => {
    const mismatches = rows.filter((r) => !r.eqLPPrice).map((r) => ({ id: r.id, listPrice: r.listPrice }));
    if (mismatches.length === 0) return;
    const confirm = window.confirm(`Se igualarán ${mismatches.length} productos (price = listPrice). ¿Deseas continuar?`);
    if (!confirm) return;
    setBusy(true);
    try {
      const updated = await fbEqualizeProductsPrice(user, mismatches);
      setStatusMsg(`Igualados ${updated} productos (vista actual).`);
    } finally {
      setBusy(false);
    }
  };

  const handleFixAllBusiness = async () => {
    const confirm = window.confirm('Esto igualará price = listPrice en TODOS los productos del negocio que no coinciden. ¿Deseas continuar?');
    if (!confirm) return;
    setBusy(true);
    try {
      const updated = await fbEqualizeAllProductsPrice(user, { onlyMismatch: true });
      setStatusMsg(`Igualados ${updated} productos en todo el negocio.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Auditoría: price vs listPrice (sin impuesto)</h2>
      <p style={{ color: '#555', maxWidth: 800 }}>
        Compara directamente <strong>pricing.price</strong> y <strong>pricing.listPrice</strong> sin calcular impuestos. 
        Usa los controles para ver solo iguales, solo no coinciden, o todos.
      </p>
      <div style={{ margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#eafaf1', color: '#0f7a3e', padding: '4px 8px', borderRadius: 6 }}>
            Iguales: <strong>{equalCount}</strong>
          </span>
          <span style={{ background: '#fdecea', color: '#b71c1c', padding: '4px 8px', borderRadius: 6 }}>
            No coinciden: <strong>{mismatchCount}</strong>
          </span>
          <span style={{ marginLeft: 8, color: '#555' }}>Total: {rows.length}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewFilter('equal')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: viewFilter === 'equal' ? '#f0fdf4' : 'white',
            }}
            disabled={busy}
          >
            Solo iguales
          </button>
          <button
            onClick={() => setViewFilter('mismatch')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: viewFilter === 'mismatch' ? '#fef2f2' : 'white',
            }}
            disabled={busy}
          >
            Solo no coinciden
          </button>
          <button
            onClick={() => setViewFilter('all')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: viewFilter === 'all' ? '#f8fafc' : 'white',
            }}
            disabled={busy}
          >
            Todos
          </button>
          <button
            onClick={handleFixAllMismatch}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#111827',
              color: 'white'
            }}
            title="Igualar price=listPrice para todos los que no coinciden"
            disabled={busy || mismatchCount === 0}
          >
            Igualar todos (no coinciden)
          </button>
          <button
            onClick={handleFixAllBusiness}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#0b5cff',
              color: 'white'
            }}
            title="Igualar price=listPrice en todo el negocio (solo no coinciden)"
            disabled={busy}
          >
            Igualar todo el negocio
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ margin: '8px 0 0', color: '#111', background: '#f3f4f6', padding: '8px 12px', borderRadius: 6 }}>
          {statusMsg}
        </div>
      )}

      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Nombre</th>
              <th style={th}>List Price</th>
              <th style={th}>Price (actual)</th>
              <th style={th}>Diff (LP-Price)</th>
              <th style={th}>LP == Price</th>
              <th style={th}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} style={{ background: r.eqLPPrice ? '#f7fff7' : '#fff4f2' }}>
                <td style={td}>{r.id}</td>
                <td style={td}>{r.name}</td>
                <td style={{ ...td, textAlign: 'right' }}>{r.listPrice}</td>
                <td style={{ ...td, textAlign: 'right' }}>{r.price}</td>
                <td style={{ ...td, textAlign: 'right' }}>{r.diffLP}</td>
                <td style={td}>{r.eqLPPrice ? 'Sí' : 'No'}</td>
                <td style={td}>
                  {!r.eqLPPrice && (
                    <button
                      onClick={() => handleFixOne(r)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd' }}
                      title="Igualar price=listPrice"
                    >
                      Igualar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary>Notas</summary>
        <ul>
          <li>Solo se listan productos donde price y listPrice son iguales (sin considerar impuestos).</li>
          <li>Útil para verificar datos ya normalizados o identificar consistencias tras migraciones.</li>
        </ul>
      </details>
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
  padding: '8px 10px',
  borderBottom: '1px solid #f0f0f0',
};
