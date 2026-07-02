import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { normalizeProductForRead } from '@/domain/products/normalization';
import { resolveProductInventoryItemType } from '@/domain/products/productInventoryLogic';
import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';

export interface ComboComponentProductOption {
  label: string;
  product: ProductRecord;
  productId: string;
  productName: string;
  stock: number;
  unitCost: number;
  value: string;
}

interface ComboComponentOptionsState {
  businessId: string | null;
  error: Error | null;
  loading: boolean;
  options: ComboComponentProductOption[];
}

const EMPTY_STATE: ComboComponentOptionsState = {
  businessId: null,
  error: null,
  loading: false,
  options: [],
};

const cleanString = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildComboComponentOption = (
  docId: string,
  rawProduct: ProductRecord,
  currentProductId?: string | null,
): ComboComponentProductOption | null => {
  const product = normalizeProductForRead({
    ...rawProduct,
    id: rawProduct.id || docId,
  });
  const productId = cleanString(product.id || docId);
  if (!productId || productId === currentProductId) return null;
  if (product.isDeleted === true) return null;
  if (product.isVisible === false) return null;
  if (resolveProductInventoryItemType(product) !== 'product') return null;

  const productName =
    cleanString(product.name) || cleanString(product.productName) || productId;

  return {
    label: productName,
    product,
    productId,
    productName,
    stock: toFiniteNumber(product.stock, 0),
    unitCost: toFiniteNumber(product.pricing?.cost, 0),
    value: productId,
  };
};

export const useComboComponentOptions = (
  businessId?: string | null,
  currentProductId?: string | null,
): ComboComponentOptionsState => {
  const [state, setState] =
    useState<ComboComponentOptionsState>(EMPTY_STATE);

  const productsQuery = useMemo(() => {
    if (!businessId) return null;
    return query(collection(db, 'businesses', businessId, 'products'));
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !productsQuery) return undefined;

    return onSnapshot(
      productsQuery,
      (snapshot) => {
        const options = snapshot.docs
          .map((docSnapshot) =>
            buildComboComponentOption(
              docSnapshot.id,
              docSnapshot.data() as ProductRecord,
              currentProductId,
            ),
          )
          .filter(
            (option): option is ComboComponentProductOption => option !== null,
          )
          .sort((left, right) => left.label.localeCompare(right.label));

        setState({
          businessId,
          error: null,
          loading: false,
          options,
        });
      },
      (error) => {
        setState({
          businessId,
          error,
          loading: false,
          options: [],
        });
      },
    );
  }, [businessId, currentProductId, productsQuery]);

  if (!businessId) return EMPTY_STATE;
  if (state.businessId !== businessId) {
    return {
      businessId,
      error: null,
      loading: true,
      options: [],
    };
  }

  return state;
};

export default useComboComponentOptions;
