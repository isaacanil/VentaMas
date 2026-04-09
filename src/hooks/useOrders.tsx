import { useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { subscribeSingleOrder } from '@/firebase/order/fbGetOrder';
import { subscribeToOrder, processOrder } from '@/firebase/order/fbGetOrders';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type { Order } from '@/utils/order/types';
import { normalizeOrderRecord } from '@/utils/order/status';
import { sortOrders } from '@/utils/filterUtils';
import type { FilterState } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/FilterBar/types';

const convertTimestamps = (data: Order): Order => {
  const timestampFields: Array<keyof Order> = [
    'createdAt',
    'updatedAt',
    'deliveryAt',
    'paymentAt',
    'completedAt',
  ];

  const next = { ...data } as Record<string, unknown>;
  timestampFields.forEach((field) => {
    const value = data?.[field];
    const millis = toMillis(value as unknown);
    if (typeof millis === 'number' && Number.isFinite(millis)) {
      next[field] = millis;
    }
  });

  return next as Order;
};

interface OrdersListState {
  orders: Order[];
  resolvedQueryKey: string | null;
}

type OrdersListAction =
  | { type: 'resolveQuery'; orders: Order[]; queryKey: string | null }
  | { type: 'reset' };

const initialOrdersListState: OrdersListState = {
  orders: [],
  resolvedQueryKey: null,
};

const ordersListReducer = (
  state: OrdersListState,
  action: OrdersListAction,
): OrdersListState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        orders: action.orders,
        resolvedQueryKey: action.queryKey,
      };
    case 'reset':
      return initialOrdersListState;
    default:
      return state;
  }
};

interface OrderDetailState {
  order: Order | null;
  resolvedOrderKey: string | null;
}

type OrderDetailAction =
  | { type: 'resolveOrder'; order: Order | null; orderKey: string | null }
  | { type: 'reset' };

const initialOrderDetailState: OrderDetailState = {
  order: null,
  resolvedOrderKey: null,
};

const orderDetailReducer = (
  state: OrderDetailState,
  action: OrderDetailAction,
): OrderDetailState => {
  switch (action.type) {
    case 'resolveOrder':
      return {
        order: action.order,
        resolvedOrderKey: action.orderKey,
      };
    case 'reset':
      return initialOrderDetailState;
    default:
      return state;
  }
};

export const useListenOrders = (filterState?: FilterState) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [state, dispatchState] = useReducer(
    ordersListReducer,
    initialOrdersListState,
  );
  const { orders, resolvedQueryKey } = state;
  const isAscending = filterState?.isAscending;
  const filtersKey = JSON.stringify(filterState?.filters ?? null);
  const currentQueryKey = user?.businessID
    ? `${user.businessID}:${filtersKey}`
    : null;

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return isAscending !== undefined
      ? (sortOrders(orders, isAscending) as Order[])
      : orders;
  }, [orders, isAscending]);

  const isLoading =
    currentQueryKey !== null && resolvedQueryKey !== currentQueryKey;

  useEffect(() => {
    if (!user?.businessID) {
      dispatchState({ type: 'reset' });
      return;
    }

    const unsubscribe = subscribeToOrder(
      user.businessID,
      filterState?.filters,
      async (snapshot) => {
        try {
          const nextOrders = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const orderData = doc.data() as Order;
              const processedData = convertTimestamps(
                normalizeOrderRecord(orderData, doc.id),
              );
              return processOrder(
                processedData,
                user.businessID,
                doc.id,
              ) as Order;
            }),
          );

          dispatchState({
            type: 'resolveQuery',
            orders: nextOrders,
            queryKey: currentQueryKey,
          });
        } catch (error) {
          console.error('Error fetching orders:', error);
          dispatchState({
            type: 'resolveQuery',
            orders: [],
            queryKey: currentQueryKey,
          });
        }
      },
    );

    return unsubscribe;
  }, [currentQueryKey, filterState?.filters, user?.businessID]);

  return {
    orders: sortedOrders,
    isLoading,
  };
};

export const useListenOrder = (orderId?: string | null) => {
  const [state, dispatchState] = useReducer(
    orderDetailReducer,
    initialOrderDetailState,
  );
  const { order, resolvedOrderKey } = state;
  const user = useSelector(selectUser) as UserIdentity | null;
  const currentOrderKey =
    user?.businessID && orderId ? `${user.businessID}:${orderId}` : null;
  const isLoading =
    currentOrderKey !== null && resolvedOrderKey !== currentOrderKey;

  useEffect(() => {
    if (!user?.businessID || !orderId) {
      dispatchState({ type: 'reset' });
      return;
    }

    const unsubscribe = subscribeSingleOrder(
      user.businessID,
      orderId,
      async (snapshot) => {
        try {
          if (!snapshot.exists()) {
            dispatchState({
              type: 'resolveOrder',
              order: null,
              orderKey: currentOrderKey,
            });
            return;
          }

          const orderData = snapshot.data() as Order;
          const processedData = convertTimestamps(
            normalizeOrderRecord(orderData, snapshot.id),
          );

          dispatchState({
            type: 'resolveOrder',
            order: processedData,
            orderKey: currentOrderKey,
          });
        } catch (error) {
          console.error('Error fetching single order:', error);
          dispatchState({
            type: 'resolveOrder',
            order: null,
            orderKey: currentOrderKey,
          });
        }
      },
    );

    return unsubscribe;
  }, [currentOrderKey, orderId, user?.businessID]);

  return {
    order,
    isLoading,
  };
};
