import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { createReference, getDocFromRef } from '@/utils/refereceUtils';

type TimestampLike =
  | {
      seconds?: number;
    }
  | number;

type OrderData = Record<string, unknown> & {
  dates: Record<string, TimestampLike | undefined>;
  provider?: string;
};

type PendingOrder = {
  data: OrderData;
};

const convertTimestamps = (
  dates: Record<string, TimestampLike | undefined>,
  fields: string[],
): void => {
  fields.forEach((field) => {
    const timestamp = dates[field]?.seconds;
    if (timestamp) dates[field] = timestamp * 1000;
  });
};

export const subscribeToOrders = (
  businessID: string,
  callback: (snapshot: QuerySnapshot<DocumentData>) => void,
): Unsubscribe => {
  const ordersRef = collection(db, 'businesses', businessID, 'orders');
  const q = query(
    ordersRef,
    where('data.state', '==', 'state_2'),
    orderBy('data.numberId', 'desc'),
  );
  return onSnapshot(q, callback);
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
): Promise<PendingOrder> => {
  const providerId = typeof data?.provider === 'string' ? data.provider : '';
  const provider = await getProvider(businessID, providerId);
  return { data: { ...(data || { dates: {} }), provider } };
};

export const useFbGetPendingOrders = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const user = useSelector(selectUser) as { businessID?: string } | null;

  useEffect(() => {
    if (!user?.businessID) return;

    const unsubscribe = subscribeToOrders(user.businessID, async (snapshot) => {
      try {
        const orders = await Promise.all(
          snapshot.docs.map((doc) =>
            processOrder(doc.data()?.data as OrderData | undefined, user.businessID),
          ),
        );

        const updatedOrders = orders.map((order) => {
          convertTimestamps(order.data.dates, [
            'deliveryDate',
            'createdAt',
            'updatedAt',
          ]);
          return order;
        });

        setPendingOrders(updatedOrders);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    });

    return unsubscribe;
  }, [user?.businessID]);

  return { pendingOrders };
};
