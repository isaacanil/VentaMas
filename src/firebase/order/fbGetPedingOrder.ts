import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import type {
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { normalizeOrderRecord, resolveOrderStatus } from '@/utils/order/status';
import { createReference, getDocFromRef } from '@/utils/refereceUtils';

type TimestampLike =
  | {
      seconds?: number;
    }
  | number;

type OrderData = Record<string, unknown> & {
  dates: Record<string, TimestampLike | undefined>;
  provider?: string | Record<string, unknown>;
};

type PendingOrder = {
  data: OrderData;
};

type UserWithBusiness = {
  businessID: string;
};

const convertTimestamps = (
  dates: Record<string, TimestampLike | undefined>,
  fields: string[],
): void => {
  fields.forEach((field) => {
    const value = dates[field];
    const timestamp =
      typeof value === 'object' && value !== null && 'seconds' in value
        ? (value as { seconds?: number }).seconds
        : undefined;
    if (typeof timestamp === 'number') {
      dates[field] = timestamp * 1000;
    }
  });
};

export const subscribeToOrders = (
  businessID: string,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
): Unsubscribe => {
  const ordersRef = collection(db, 'businesses', businessID, 'orders');
  return onSnapshot(ordersRef, callback);
};

export const getProvider = async (
  businessID: string,
  providerId: string,
): Promise<Record<string, unknown>> => {
  if (!providerId) return {};
  const providerRef = createReference(
    ['businesses', businessID, 'providers'],
    providerId,
  );
  const providerDoc = await getDocFromRef(providerRef);
  return (providerDoc?.provider || {}) as Record<string, unknown>;
};

export const processOrder = async (
  data: OrderData | undefined,
  businessID: string,
  orderId?: string,
): Promise<PendingOrder> => {
  const normalizedOrder = normalizeOrderRecord(
    data as Record<string, unknown> | undefined,
    orderId,
  ) as OrderData;
  const providerId =
    typeof normalizedOrder?.provider === 'string' ? normalizedOrder.provider : '';
  const provider = await getProvider(businessID, providerId);
  return { data: { ...(normalizedOrder || { dates: {} }), provider } };
};

export const useFbGetPendingOrders = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const user = useSelector(selectUser) as UserWithBusiness | null;

  useEffect(() => {
    if (!user?.businessID) return;

    const businessID = user.businessID;
    const unsubscribe = subscribeToOrders(businessID, async (snapshot) => {
      try {
        const orders = await Promise.all(
          snapshot.docs.map((doc) =>
            processOrder(doc.data() as OrderData | undefined, businessID, doc.id),
          ),
        );

        const updatedOrders = orders
          .map((order) => {
            convertTimestamps(order.data.dates || {}, [
              'deliveryDate',
              'createdAt',
              'updatedAt',
            ]);
            return order;
          })
          .filter((order) => resolveOrderStatus(order.data) === 'pending')
          .sort(
            (left, right) =>
              Number(right.data?.numberId ?? 0) - Number(left.data?.numberId ?? 0),
          );

        setPendingOrders(updatedOrders);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    });

    return unsubscribe;
  }, [user?.businessID]);

  return { pendingOrders };
};
