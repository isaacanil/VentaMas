import { Input, Select, Button } from 'antd';
import { useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { ProductRecord } from '@/types/products';
// No usamos useInventoryStocksProducts, tomamos products directamente

// Export helper (exceljs + file-saver), same pattern used elsewhere in the app
import {
  exportInventorySummaryToExcel,
  type InventorySummaryRow,
} from './utils/exportInventorySummaryToExcel';

// ---------------------- Utils ----------------------
const formatCurrency = (value: number, currency = 'DOP') =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
const formatInteger = (value: number) =>
  new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  );

function getNumber(n: unknown, def = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}
function getName(p: ProductRecord | null | undefined) {
  return p?.name || p?.productName || 'Producto';
}
function getCategory(p: ProductRecord | null | undefined) {
  const group = typeof p?.group === 'string' ? p.group : undefined;
  return p?.category || group || 'Sin categoría';
}
// En la tabla de productos (ProductsTable) los totales usan el listPrice.
// Para alinear InventorySummary con ese comportamiento, preferimos listPrice
// de forma explícita para los totales (si no existe, 0).
function getListPriceUnit(p: ProductRecord | null | undefined) {
  if (typeof p?.pricing?.listPrice === 'number')
    return getNumber(p.pricing.listPrice);
  return 0;
}

type InventorySummaryItem = {
  id: string | number | null;
  name: string;
  category: string;
  sku: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
};

type CategorySummary = {
  category: string;
  qty: number;
  valueCost: number;
  valuePrice: number;
  avgCost: number;
  share: number;
};

type TopProductRow = {
  id: string | number | null;
  name: string;
  category: string;
  qty: number;
  unitCost: number;
  value: number;
  sku: string;
};

// ---------------------- Styled ----------------------
const Page = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
`;
const Content = styled.div`
  max-width: 1440px;
  padding: 16px;
  margin: 0 auto;
  overflow-y: auto;
`;
const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;
const LeftFilters = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;

  & > * {
    flex: 0 0 auto;
  }

  /* Si en pantallas muy pequeñas se requiere que bajen, quitar el media query siguiente */
  @media (width <= 420px) {
    flex-wrap: wrap;
  }
`;
const RightActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
`;
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;
const Card = styled.div`
  padding: 16px;
  background: #fff;
  border: 1px solid rgb(0 0 0 / 6%);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
`;
const KpiTitle = styled.div`
  font-size: 12px;
  color: #6b7280;
`;
const KpiValue = styled.div`
  margin-top: 4px;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
`;
const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;

  @media (width >= 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
const SectionCard = styled(Card)``;
const SectionCardWide = styled(SectionCard)`
  @media (width >= 1280px) {
    grid-column: span 1;
  }
`;
const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
`;
const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;

  thead tr {
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }

  th,
  td {
    padding: 8px 12px;
    text-align: left;
  }

  tbody tr {
    border-bottom: 1px solid #f3f4f6;
  }

  td.num {
    text-align: right;
    white-space: nowrap;
  }

  th.num {
    text-align: right;
  }
`;
const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #6b7280;
`;

export const InventorySummary = () => {
  const { products = [], loading } = useGetProducts();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const currency = 'DOP';

  // Agregado por producto (base para UI)
  const itemsBase = useMemo<InventorySummaryItem[]>(() => {
    const arr: InventorySummaryItem[] = [];
    for (const p of products || []) {
      const primaryId =
        typeof p?.id === 'string' || typeof p?.id === 'number' ? p.id : null;
      const fallbackId =
        typeof p?.cid === 'string' || typeof p?.cid === 'number' ? p.cid : null;
      const pid = primaryId ?? fallbackId ?? null;
      const name = getName(p);
      const cat = getCategory(p);
      const sku =
        typeof p?.sku === 'string'
          ? p.sku
          : typeof p?.barcode === 'string'
            ? p.barcode
            : '';
      const qty = getNumber(p?.stock ?? 0);
      const unitCost =
        typeof p?.pricing?.cost === 'number' ? getNumber(p.pricing.cost) : 0;
      const unitPrice = getListPriceUnit(p);
      arr.push({
        id: pid,
        name,
        category: cat,
        sku,
        unitCost,
        unitPrice,
        quantity: qty,
      });
    }
    return arr;
  }, [products]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const it of itemsBase) if (it.category) set.add(it.category);
    return ['all', ...Array.from(set.values()).sort()];
  }, [itemsBase]);

  // Helper to lowercase only plain strings / numbers; anything else => ''
  const safeLower = (val: unknown) => {
    if (typeof val === 'string') return val.toLowerCase();
    if (typeof val === 'number') return String(val).toLowerCase();
    return '';
  };

  const filtered = useMemo<InventorySummaryItem[]>(() => {
    const q = safeLower(query.trim());
    return itemsBase.filter((it) => {
      const name = safeLower(it.name);
      const sku = safeLower(it.sku);
      const cat = safeLower(it.category);
      const matchQ =
        !q || name.includes(q) || sku.includes(q) || cat.includes(q);
      const matchCat = category === 'all' || it.category === category;
      return matchQ && matchCat;
    });
  }, [itemsBase, query, category]);

  // Filtrado de productos (como ProductsTable) para alinear totales
  const productsFiltered = useMemo<ProductRecord[]>(() => {
    const q = safeLower(query.trim());
    return (products || []).filter((p) => {
      const name = safeLower(p?.name ?? p?.productName);
      const sku = safeLower(p?.sku ?? p?.barcode);
      const categoryValue =
        typeof p?.category === 'string'
          ? p.category
          : typeof p?.group === 'string'
            ? p.group
            : '';
      const cat = safeLower(categoryValue);
      const matchQ =
        !q || name.includes(q) || sku.includes(q) || cat.includes(q);
      const matchCat = category === 'all' || categoryValue === category;
      return matchQ && matchCat;
    });
  }, [products, query, category]);

  // Totales iguales a ProductsTable: stock, costo y precio lista
  const ptTotals = useMemo(() => {
    let stock = 0;
    let cost = 0;
    let listPrice = 0;
    for (const p of productsFiltered) {
      const qty = Number(p?.stock) || 0;
      const unitCost = Number(p?.pricing?.cost) || 0;
      const unitListPrice = Number(p?.pricing?.listPrice) || 0;
      stock += qty;
      cost += qty * unitCost;
      listPrice += qty * unitListPrice;
    }
    return { stock, cost, listPrice };
  }, [productsFiltered]);

  // Conteo de productos (independiente del stock), respetando filtros de búsqueda/categoría
  const productsCount = useMemo(
    () => productsFiltered.length,
    [productsFiltered],
  );

  // Resumen por categoría unificado (qty, valueCost, valuePrice, avgCost, share)
  const categoriesSummary = useMemo<CategorySummary[]>(() => {
    const map = new Map<string, CategorySummary>();
    for (const it of filtered) {
      const key = it.category || 'Sin categoría';
      const qty = getNumber(it.quantity);
      const unitCost = getNumber(it.unitCost);
      const unitPrice = getNumber(it.unitPrice);
      const row = map.get(key) || {
        category: key,
        qty: 0,
        valueCost: 0,
        valuePrice: 0,
        avgCost: 0,
        share: 0,
      };
      row.qty += qty;
      row.valueCost += qty * unitCost;
      row.valuePrice += qty * unitPrice;
      map.set(key, row);
    }
    const arr = Array.from(map.values());
    const totalCost = arr.reduce((acc, r) => acc + r.valueCost, 0) || 1;
    for (const r of arr) {
      r.avgCost = r.qty !== 0 ? r.valueCost / r.qty : 0;
      r.share = r.valueCost / totalCost;
    }
    return arr.sort((a, b) => b.valueCost - a.valueCost);
  }, [filtered]);

  const topProducts = useMemo<TopProductRow[]>(() => {
    return filtered
      .map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category || 'Sin categoría',
        qty: getNumber(it.quantity),
        unitCost: getNumber(it.unitCost),
        value: getNumber(it.quantity) * getNumber(it.unitCost), // sin clamp
        sku: it.sku || '',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const exportExcel = useCallback(async () => {
    const rows: InventorySummaryRow[] = filtered.map((it) => ({
      name: it.name,
      sku: it.sku,
      category: it.category,
      quantity: getNumber(it.quantity),
      unitCost: getNumber(it.unitCost),
      unitListPrice: getNumber(it.unitPrice),
    }));
    try {
      await exportInventorySummaryToExcel(rows, {
        filenamePrefix: 'inventario_resumen',
      });
    } catch {
      // opcional: mostrar notificación si existe sistema de notificaciones
      // console.error(e)
    }
  }, [filtered]);

  return (
    <Page>
      <MenuApp sectionName={'Resumen de Inventario'} />
      <Content>
        {loading ? (
          <Center>Cargando inventarioâ€¦</Center>
        ) : (
          <>
            <Header>
              <LeftFilters>
                <Input
                  placeholder="Buscar por nombre, SKU o categoría"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  allowClear
                />
                <Select
                  value={category}
                  onChange={setCategory}
                  style={{ minWidth: 200 }}
                  options={categories.map((c) => ({
                    label: c === 'all' ? 'Todas las categorías' : c,
                    value: c,
                  }))}
                />
              </LeftFilters>
              <RightActions>
                <Button type="primary" onClick={exportExcel}>
                  Exportar Excel
                </Button>
              </RightActions>
            </Header>

            {/* KPIs (alineados con ProductsTable) */}
            <KpiGrid>
              <Card>
                <KpiTitle>Total (Precio lista)</KpiTitle>
                <KpiValue>
                  {formatCurrency(ptTotals.listPrice, currency)}
                </KpiValue>
              </Card>
              <Card>
                <KpiTitle>Total (Costo)</KpiTitle>
                <KpiValue>{formatCurrency(ptTotals.cost, currency)}</KpiValue>
              </Card>
              <Card>
                <KpiTitle>Unidades en stock</KpiTitle>
                <KpiValue>{formatInteger(ptTotals.stock)}</KpiValue>
              </Card>
              <Card>
                <KpiTitle>Productos</KpiTitle>
                <KpiValue>{formatInteger(productsCount)}</KpiValue>
              </Card>
            </KpiGrid>
            {/* Resumen por categoría + Top 10 */}
            <SectionGrid>
              <SectionCardWide>
                <SectionTitle>Resumen por categoría</SectionTitle>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th className="num">Unidades</th>
                        <th className="num">Valor (Costo)</th>
                        <th className="num">% del costo total</th>
                        <th className="num">Costo prom. unit.</th>
                        {/* opcional: <th className="num">Valor (Precio lista)</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesSummary.map((r, i) => (
                        <tr key={r.category + i}>
                          <td>{r.category}</td>
                          <td className="num">{formatInteger(r.qty)}</td>
                          <td className="num">
                            {formatCurrency(r.valueCost, currency)}
                          </td>
                          <td className="num">{(r.share * 100).toFixed(1)}%</td>
                          <td className="num">
                            {formatCurrency(r.avgCost, currency)}
                          </td>
                          {/* opcional: <td className="num">{formatCurrency(r.valuePrice, currency)}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </SectionCardWide>

              <SectionCard>
                <SectionTitle>Top 10 productos por valor</SectionTitle>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th className="num">Unidades</th>
                        <th className="num">Costo unitario</th>
                        <th className="num">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((r) => (
                        <tr key={`${r.id ?? r.name}-${r.sku}`}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{r.name}</div>
                            {r.sku ? (
                              <div style={{ fontSize: 11, color: '#6b7280' }}>
                                {r.sku}
                              </div>
                            ) : null}
                          </td>
                          <td>{r.category}</td>
                          <td className="num">{formatInteger(r.qty)}</td>
                          <td className="num">
                            {formatCurrency(r.unitCost, currency)}
                          </td>
                          <td className="num">
                            {formatCurrency(r.value, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </SectionCard>
            </SectionGrid>
          </>
        )}
      </Content>
    </Page>
  );
};

export default InventorySummary;

