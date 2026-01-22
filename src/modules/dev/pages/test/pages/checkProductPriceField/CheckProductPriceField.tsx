import React, { useMemo, useState } from 'react';

// Simple utility to coerce input value to a safe number
const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Demo initial product to play with on this test screen
interface ProductPricing {
  currency: string;
  listPrice: number;
  tax: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  pricing: ProductPricing;
}

const initialProduct: Product = {
  id: 'demo-1',
  name: 'Producto Demo',
  pricing: {
    currency: 'USD',
    listPrice: 100,
    tax: 19,
    // IMPORTANT: In this test, price should be a copy of listPrice (not listPrice + tax)
    price: 100,
  },
};

export default function CheckProductPriceField() {
  const [product, setProduct] = useState<Product>(initialProduct);

  const { listPrice, tax, price, currency } = product.pricing;

  // For visualization only; NOT assigned to pricing.price on purpose.
  const priceWithTax = useMemo(
    () => toNumber(listPrice) + toNumber(tax),
    [listPrice, tax],
  );

  const setPricing = (
    updater: (prev: ProductPricing) => Partial<ProductPricing>,
  ) => {
    setProduct((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        ...updater(prev.pricing),
      },
    }));
  };

  const handleListPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextListPrice = toNumber(e.target.value);
    // BUSINESS RULE: pricing.price debe ser una COPIA de pricing.listPrice
    setPricing(() => ({ listPrice: nextListPrice, price: nextListPrice }));
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTax = toNumber(e.target.value);
    // Impuesto no afecta pricing.price en este flujo de datos
    setPricing(() => ({ tax: nextTax }));
  };

  const handleFixPrice = () => {
    setPricing((p) => ({ price: toNumber(p.listPrice) }));
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  const handlePasteProductJson = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    try {
      const parsed = JSON.parse(value) as unknown;
      if (isRecord(parsed) && isRecord(parsed.pricing)) {
        const parsedPricing = parsed.pricing;
        const nextListPrice = toNumber(parsedPricing.listPrice);
        const nextTax = toNumber(parsedPricing.tax);
        const nextCurrency =
          typeof parsedPricing.currency === 'string'
            ? parsedPricing.currency
            : initialProduct.pricing.currency;
        // Aseguramos la regla al cargar: price = listPrice
        const next: Product = {
          id: typeof parsed.id === 'string' ? parsed.id : initialProduct.id,
          name:
            typeof parsed.name === 'string' ? parsed.name : initialProduct.name,
          pricing: {
            currency: nextCurrency,
            listPrice: nextListPrice,
            tax: nextTax,
            price: nextListPrice,
          },
        };
        setProduct(next);
      }
    } catch {
      // ignore parse errors; this is just a helper text area
    }
  };

  const priceIsValid = toNumber(price) === toNumber(listPrice);

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h2>Test: pricing.price debe ser una copia de pricing.listPrice</h2>
      <p style={{ color: '#555' }}>
        En este entorno de prueba, <strong>pricing.price</strong> no debe
        incluir impuestos. Debe ser exactamente igual a{' '}
        <strong>pricing.listPrice</strong>.
      </p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Moneda</span>
          <input
            type="text"
            value={currency ?? ''}
            onChange={(e) => setPricing(() => ({ currency: e.target.value }))}
            placeholder="USD, PEN, etc"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span>List Price</span>
          <input
            type="number"
            value={listPrice}
            onChange={handleListPriceChange}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Tax (monto)</span>
          <input type="number" value={tax} onChange={handleTaxChange} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Price (debe ser COPIA de List Price)</span>
          <input type="number" value={price} readOnly />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleFixPrice}>Forzar price = listPrice</button>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: '1px solid #eee',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: priceIsValid ? '#2ecc71' : '#e74c3c',
            }}
          />
          <strong>{priceIsValid ? 'OK' : 'Inconsistencia detectada'}</strong>
        </div>
        <ul style={{ marginTop: 8 }}>
          <li>
            price (actual): <strong>{price}</strong>
          </li>
          <li>
            listPrice: <strong>{listPrice}</strong>
          </li>
          <li>
            tax: <strong>{tax}</strong>
          </li>
          <li>
            listPrice + tax (solo referencia visual):{' '}
            <strong>{priceWithTax}</strong>
          </li>
        </ul>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary>Pegar JSON de producto (opcional)</summary>
        <p style={{ color: '#555' }}>
          Si pegas un objeto con estructura{' '}
          <code>{'{ pricing: { listPrice, tax, price } }'}</code>, esta pantalla
          ajustará <code>pricing.price = pricing.listPrice</code>{' '}
          automáticamente al cargarlo.
        </p>
        <textarea
          onChange={handlePasteProductJson}
          rows={8}
          style={{ width: '100%', fontFamily: 'monospace' }}
          placeholder='{"pricing":{"listPrice":200,"tax":36,"price":200}}'
        />
      </details>
    </div>
  );
}
