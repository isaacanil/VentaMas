import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { fbBackfillListPriceFromPrice } from '@/firebase/products/fbBackfillListPriceFromPrice';
import {
  fbEqualizeAllProductsPrice,
  fbEqualizeProductPrice,
  fbEqualizeProductsPrice,
} from '@/firebase/products/fbEqualizeProductPrice';
import { useGetProducts } from '@/firebase/products/fbGetProducts.js';

import { PriceAuditTable } from './components/PriceAuditTable';
import { PriceAuditToolbar } from './components/PriceAuditToolbar';

interface ProductPricing {
  listPrice?: unknown;
  price?: unknown;
}

interface ProductLike {
  id?: string;
  _id?: string;
  code?: string;
  sku?: string;
  name?: string;
  title?: string;
  pricing?: ProductPricing;
}

interface PriceRow {
  id: string;
  name: string;
  listPrice: number;
  price: number;
  eqLPPrice: boolean;
  diffLP: number;
}

type ViewFilter = 'equal' | 'mismatch' | 'all';

const toNumber = (n: unknown, fallback = 0) => {
  const value = Number(n);
  return Number.isFinite(value) ? value : fallback;
};

const round2 = (n: unknown) => Math.round(Number(n) * 100) / 100;

export default function CheckProductPriceAudit() {
  const { products } = useGetProducts() as { products?: ProductLike[] };
  const user = useSelector(selectUser);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('equal');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const rows = useMemo<PriceRow[]>(() => {
    if (!Array.isArray(products)) return [];

    return products.map((product) => {
      const listPrice = toNumber(product?.pricing?.listPrice);
      const price = toNumber(product?.pricing?.price);
      return {
        id: product.id || product._id || product.code || product.sku || 'sin-id',
        name: product.name || product.title || 'sin-nombre',
        listPrice,
        price,
        eqLPPrice: price === listPrice,
        diffLP: round2(price - listPrice),
      };
    });
  }, [products]);

  const equalCount = rows.filter((row) => row.eqLPPrice).length;
  const mismatchCount = rows.length - equalCount;
  const missingListPriceCount = rows.filter(
    (row) => row.listPrice <= 0 && row.price > 0,
  ).length;

  const visible = useMemo(() => {
    if (viewFilter === 'equal') {
      return rows.filter((row) => row.eqLPPrice);
    }
    if (viewFilter === 'mismatch') {
      return rows.filter((row) => !row.eqLPPrice);
    }
    return rows;
  }, [rows, viewFilter]);

  const handleFixOne = async (row: PriceRow) => {
    if (!row.id) return;
    await fbEqualizeProductPrice(user, row.id, row.listPrice);
  };

  const handleFixAllMismatch = async () => {
    const mismatches = rows
      .filter((row) => !row.eqLPPrice)
      .map((row) => ({ id: row.id, listPrice: row.listPrice }));
    if (mismatches.length === 0) return;
    const confirm = window.confirm(
      `Se igualaran ${mismatches.length} productos (price = listPrice). ¿Deseas continuar?`,
    );
    if (!confirm) return;
    setBusy(true);
    fbEqualizeProductsPrice(user, mismatches)
      .then((updated) => {
        setStatusMsg(`Igualados ${updated} productos (vista actual).`);
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const handleBackfillListPrice = async () => {
    const confirm = window.confirm(
      'Copiara pricing.price -> pricing.listPrice cuando listPrice este vacio/0. ¿Deseas continuar?',
    );
    if (!confirm) return;
    setBusy(true);
    fbBackfillListPriceFromPrice(user, {
      allowZeroPrice: false,
    })
      .then((result) => {
        setStatusMsg(
          `ListPrice copiado en ${result.updated}/${result.candidates} productos (escaneados ${result.scanned}).`,
        );
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const handleFixAllBusiness = async () => {
    const confirm = window.confirm(
      'Esto igualara price = listPrice en TODOS los productos del negocio que no coinciden. ¿Deseas continuar?',
    );
    if (!confirm) return;
    setBusy(true);
    fbEqualizeAllProductsPrice(user, {
      onlyMismatch: true,
    })
      .then((updated) => {
        setStatusMsg(`Igualados ${updated} productos en todo el negocio.`);
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Auditoria: price vs listPrice (sin impuesto)</h2>
      <p style={{ color: '#555', maxWidth: 800 }}>
        Compara directamente <strong>pricing.price</strong> y{' '}
        <strong>pricing.listPrice</strong> sin calcular impuestos. Usa los
        controles para ver solo iguales, solo no coinciden, o todos.
      </p>

      <PriceAuditToolbar
        busy={busy}
        equalCount={equalCount}
        mismatchCount={mismatchCount}
        missingListPriceCount={missingListPriceCount}
        total={rows.length}
        viewFilter={viewFilter}
        onSetViewFilter={setViewFilter}
        onFixAllMismatch={handleFixAllMismatch}
        onBackfillListPrice={handleBackfillListPrice}
        onFixAllBusiness={handleFixAllBusiness}
      />

      {statusMsg && (
        <div
          style={{
            margin: '8px 0 0',
            color: '#111',
            background: '#f3f4f6',
            padding: '8px 12px',
            borderRadius: 6,
          }}
        >
          {statusMsg}
        </div>
      )}

      <PriceAuditTable rows={visible} onFixOne={handleFixOne} />

      <details style={{ marginTop: 16 }}>
        <summary>Notas</summary>
        <ul>
          <li>
            Solo se listan productos donde price y listPrice son iguales (sin
            considerar impuestos).
          </li>
          <li>
            Util para verificar datos ya normalizados o identificar
            consistencias tras migraciones.
          </li>
        </ul>
      </details>
    </div>
  );
}
