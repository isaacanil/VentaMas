import {
  getBarcodeLookupCandidates,
  normalizeBarcodeValue,
} from '@/utils/barcode';

import type { ProductSaleUnit } from '@/types/products';

export type BarcodeIndexedProduct = {
  barcode?: unknown;
  saleUnits?: ProductSaleUnit[];
};

export type BarcodeProductMatch<TProduct extends BarcodeIndexedProduct> = {
  product: TProduct;
  saleUnit?: ProductSaleUnit | null;
};

const registerBarcodeMatch = <TProduct extends BarcodeIndexedProduct>(
  map: Map<string, BarcodeProductMatch<TProduct>>,
  barcode: unknown,
  match: BarcodeProductMatch<TProduct>,
) => {
  const normalizedBarcode = normalizeBarcodeValue(barcode);
  if (!normalizedBarcode) return;

  const barcodeCandidates = getBarcodeLookupCandidates(normalizedBarcode);
  for (const candidate of barcodeCandidates) {
    if (!map.has(candidate)) {
      map.set(candidate, match);
    }
  }
};

export const buildSaleBarcodeIndex = <TProduct extends BarcodeIndexedProduct>(
  products: TProduct[],
): Map<string, BarcodeProductMatch<TProduct>> => {
  const map = new Map<string, BarcodeProductMatch<TProduct>>();

  for (const product of products) {
    registerBarcodeMatch(map, product?.barcode, { product });
    if (!Array.isArray(product.saleUnits)) continue;

    for (const saleUnit of product.saleUnits) {
      if (!saleUnit || saleUnit.active === false) continue;
      registerBarcodeMatch(map, saleUnit.barcode, { product, saleUnit });
      registerBarcodeMatch(map, saleUnit.qrcode, { product, saleUnit });
      registerBarcodeMatch(map, saleUnit.qrCode, { product, saleUnit });
      registerBarcodeMatch(map, saleUnit.sku, { product, saleUnit });
    }
  }

  return map;
};

export const findSaleBarcodeMatch = <TProduct extends BarcodeIndexedProduct>(
  index: Map<string, BarcodeProductMatch<TProduct>>,
  barcode: unknown,
): BarcodeProductMatch<TProduct> | undefined => {
  const normalizedBarcode = normalizeBarcodeValue(barcode);
  if (!normalizedBarcode) return undefined;

  const barcodeCandidates = getBarcodeLookupCandidates(normalizedBarcode);
  for (const candidate of barcodeCandidates) {
    const match = index.get(candidate);
    if (match) return match;
  }

  return undefined;
};
