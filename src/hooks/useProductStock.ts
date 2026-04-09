import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  listenActiveProductStocks,
  listenAllProductStock,
  listenAllProductStockByLocation,
  listenBusinessProducts,
} from '@/firebase/warehouse/productStockService';
import { buildLocationPath } from '@/utils/inventory/locations';
import type {
  AggregatedProductStock,
  InventoryStockItem,
  InventoryUser,
  ProductStockRecord,
} from '@/utils/inventory/types';
import {
  aggregateActiveProductStocksByProduct,
  extractInventoriedProductIds,
} from '@/domain/inventory/stockLogic';

const EMPTY_ARRAY: ProductStockRecord[] = [];
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

export const useListenProductsStockByLocation = (
  location: InventoryStockItem['location'] | null = null,
) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessID = user?.businessID ?? null;
  const repoUser = useMemo(
    () => (businessID ? ({ businessID } satisfies InventoryUser) : null),
    [businessID],
  );

  const locationPath = useMemo(() => buildLocationPath(location), [location]);
  const canListen = !!(repoUser?.businessID && locationPath);
  const listenerKey = canListen ? `${repoUser?.businessID}|${locationPath}` : null;
  const [state, setState] = useState<{
    key: string | null;
    data: ProductStockRecord[];
  }>({ key: null, data: EMPTY_ARRAY });

  useEffect(() => {
    return listenAllProductStockByLocation(repoUser, locationPath, (updated) => {
      setState({ key: listenerKey, data: updated });
    });
  }, [repoUser, locationPath, listenerKey, canListen]);

  const data = state.key === listenerKey ? state.data : EMPTY_ARRAY;
  const loading = !!listenerKey && state.key !== listenerKey;

  return { data, loading };
};

export const useListenProductsStock = (
  productId: string | number | null = null,
) => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessID = user?.businessID ?? null;
  const repoUser = useMemo(
    () => (businessID ? ({ businessID } satisfies InventoryUser) : null),
    [businessID],
  );

  const canListen = !!(repoUser?.businessID && productId);
  const listenerKey = canListen ? `${repoUser?.businessID}|${String(productId)}` : null;
  const [state, setState] = useState<{
    key: string | null;
    data: ProductStockRecord[];
  }>({ key: null, data: EMPTY_ARRAY });

  useEffect(() => {
    if (!canListen || productId === null || productId === undefined) return;

    return listenAllProductStock(repoUser, productId, (newData) => {
      setState({ key: listenerKey, data: newData });
    });
  }, [repoUser, productId, listenerKey, canListen]);

  const data = state.key === listenerKey ? state.data : EMPTY_ARRAY;
  const loading = !!listenerKey && state.key !== listenerKey;

  return { data, loading };
};

export const useListenAllActiveProductsStock = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessID = user?.businessID ?? null;

  const listenerKey = businessID ?? null;
  const [state, setState] = useState<{
    key: string | null;
    data: AggregatedProductStock[];
  }>({ key: null, data: [] });

  useEffect(() => {
    if (!businessID) return;

    return listenActiveProductStocks(
      businessID,
      (items) => {
        setState({
          key: listenerKey,
          data: aggregateActiveProductStocksByProduct(items),
        });
      },
    );
  }, [businessID, listenerKey]);

  const data = state.key === listenerKey ? state.data : [];
  const loading = !!listenerKey && state.key !== listenerKey;

  return { data, loading };
};

export const useInventoryProductIds = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessID = user?.businessID ?? null;

  const listenerKey = businessID ?? null;
  const [state, setState] = useState<{
    key: string | null;
    data: ReadonlySet<string>;
  }>({ key: null, data: EMPTY_SET });

  useEffect(() => {
    if (!businessID) return;

    return listenBusinessProducts(
      businessID,
      (products) => {
        setState({ key: listenerKey, data: extractInventoriedProductIds(products) });
      },
    );
  }, [businessID, listenerKey]);

  const data = state.key === listenerKey ? state.data : EMPTY_SET;
  const loading = !!listenerKey && state.key !== listenerKey;

  return { data, loading };
};
