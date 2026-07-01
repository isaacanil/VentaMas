import { useEffect, useMemo, useState } from 'react';

import { listenActiveProductStocks } from '@/firebase/warehouse/productStockService';
import {
  buildSellableStockAvailabilityIndex,
  type SellableStockAvailabilityIndex,
} from '../utils/sellableStockAvailability';
import type { InventoryStockItem } from '@/utils/inventory/types';
import type { UserIdentity } from '@/types/users';

type SellableStockAvailabilityState = {
  businessId: string | null;
  canFilter: boolean;
  ready: boolean;
  stocks: InventoryStockItem[];
};

type UseSellableStockAvailabilityOptions = {
  locationScopes?: Array<string | null | undefined>;
};

const EMPTY_STOCKS: InventoryStockItem[] = [];
const EMPTY_INDEX: SellableStockAvailabilityIndex = {};
const STOCK_AVAILABILITY_FALLBACK_DELAY_MS = 3500;

export const useSellableStockAvailability = (
  user: UserIdentity | null | undefined,
  options: UseSellableStockAvailabilityOptions = {},
) => {
  const businessId = user?.businessID ? String(user.businessID) : null;
  const [state, setState] = useState<SellableStockAvailabilityState>({
    businessId: null,
    canFilter: false,
    ready: false,
    stocks: EMPTY_STOCKS,
  });

  useEffect(() => {
    if (!businessId) return undefined;

    let isMounted = true;
    const fallbackTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      setState((current) => {
        if (current.businessId === businessId && current.ready) {
          return current;
        }
        return {
          businessId,
          canFilter: false,
          ready: true,
          stocks: EMPTY_STOCKS,
        };
      });
    }, STOCK_AVAILABILITY_FALLBACK_DELAY_MS);

    const unsubscribe = listenActiveProductStocks(
      businessId,
      (stocks) => {
        if (!isMounted) return;
        window.clearTimeout(fallbackTimeout);
        setState({
          businessId,
          canFilter: true,
          ready: true,
          stocks: Array.isArray(stocks)
            ? (stocks as InventoryStockItem[])
            : EMPTY_STOCKS,
        });
      },
      () => {
        if (!isMounted) return;
        window.clearTimeout(fallbackTimeout);
        setState({
          businessId,
          canFilter: false,
          ready: true,
          stocks: EMPTY_STOCKS,
        });
      },
    );

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, [businessId]);

  const hasCurrentBusiness = state.businessId === businessId;
  const canFilter = hasCurrentBusiness && state.canFilter;
  const ready = businessId ? hasCurrentBusiness && state.ready : true;
  const stocks = hasCurrentBusiness ? state.stocks : EMPTY_STOCKS;

  const index = useMemo(
    () =>
      ready && canFilter
        ? buildSellableStockAvailabilityIndex(stocks, {
            locationScopes: options.locationScopes,
          })
        : EMPTY_INDEX,
    [canFilter, options.locationScopes, ready, stocks],
  );

  return useMemo(
    () => ({
      index,
      canFilter,
      ready,
    }),
    [canFilter, index, ready],
  );
};
