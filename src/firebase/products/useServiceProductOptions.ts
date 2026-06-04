import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import {
  cleanCommissionString as toCleanString,
  isServiceCommissionEligible,
} from '@/utils/commissions/serviceCommissions';

export interface ServiceProductOption {
  label: string;
  serviceId: string;
  serviceName: string;
  value: string;
}

interface ServiceProductOptionsState {
  businessId: string | null;
  error: Error | null;
  loading: boolean;
  options: ServiceProductOption[];
}

const EMPTY_STATE: ServiceProductOptionsState = {
  businessId: null,
  error: null,
  loading: false,
  options: [],
};

const buildServiceProductOption = (
  id: string,
  product: ProductRecord,
): ServiceProductOption | null => {
  if (!isServiceCommissionEligible(product)) return null;
  const serviceId =
    toCleanString(product.id) ??
    toCleanString((product as Record<string, unknown>).productId) ??
    toCleanString(id);
  if (!serviceId) return null;

  const serviceName =
    toCleanString(product.name) ??
    toCleanString(product.productName) ??
    serviceId;

  return {
    label: serviceName,
    serviceId,
    serviceName,
    value: serviceId,
  };
};

export const useServiceProductOptions = (businessId?: string | null) => {
  const [state, setState] = useState<ServiceProductOptionsState>(EMPTY_STATE);

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
            buildServiceProductOption(
              docSnapshot.id,
              docSnapshot.data() as ProductRecord,
            ),
          )
          .filter((option): option is ServiceProductOption => option !== null)
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
  }, [businessId, productsQuery]);

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

export default useServiceProductOptions;
