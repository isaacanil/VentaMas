import {
  collection,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import type { DocumentData, DocumentReference } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { convertFirestoreTimestamps } from '@/firebase/purchase/fbGetPurchases';

type UserWithBusiness = {
  businessID: string;
};

type OrderDocument = Record<string, unknown> & {
  data?: Record<string, unknown> & {
    provider?: DocumentReference<DocumentData> | Record<string, unknown> | null;
  };
};

type OrderItem = OrderDocument | Promise<OrderDocument>;

export const useFbGetOrders = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const user = useSelector(selectUser) as UserWithBusiness | null;
  useEffect(() => {
    if (!user || !user.businessID) return;
    const orderRef = collection(db, 'businesses', user.businessID, 'orders');
    // const q = query(orderRef, where("data.state.name", "==", "Solicitado"))
    const unsubscribe = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.empty) {
        setOrders([]);
        return;
      }
      const orderArray = snapshot.docs.map(async (item) => {
        const orderData = item.data() as OrderDocument;
        const providerRef = orderData.data?.provider as DocumentReference<DocumentData>;
        const providerDoc = (await getDoc(providerRef)).data() as Record<string, unknown> | undefined;
        if (orderData.data) {
          orderData.data.provider = providerDoc?.provider ?? null;
        }
        return orderData;
      });
      Promise.all(orderArray)
        .then((result) => {
          setOrders(result);
        })
        .catch((error) => {
          console.log(error);
        });
      setOrders(orderArray);
    });
    return unsubscribe;
  }, [user?.businessID, user]);

  return { orders };
};

const _transformOrderData = (item: { data: () => OrderDocument }) => {
  const data = item.data();
  return {
    // data: {
    //     ...data,
    //     provider: data.provider || null,
    // },
    data,
  };
};

export const useFbGetPendingOrdersByProvider = (providerId?: string | null) => {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const user = useSelector(selectUser) as UserWithBusiness | null;

  const businessID = user?.businessID;
  const [prevBusinessID, setPrevBusinessID] = useState(businessID);
  const [prevProviderId, setPrevProviderId] = useState(providerId);

  if (businessID !== prevBusinessID || providerId !== prevProviderId) {
    setPrevBusinessID(businessID);
    setPrevProviderId(providerId);
    setData([]);
    setError(null);
    if (businessID && providerId) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!businessID || !providerId) {
      return undefined;
    }

    const orderRef = collection(db, 'businesses', businessID, 'orders');
    const q = query(
      orderRef,
      where('provider', '==', providerId),
      where('status', '==', 'pending'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderArray = snapshot.docs.map((doc) => doc.data() as Record<string, unknown>);
        const orderUpdated = orderArray.map((order) => {
          convertFirestoreTimestamps(order, [
            'createdAt',
            'completedAt',
            'deliveryDate',
            'paymentDate',
            'deletedAt',
          ]);
          return order;
        });
        console.log('orderUpdated', orderUpdated);
        setData(orderUpdated);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setData([]);
        setError(error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [businessID, providerId]);
  console.log(
    ' -------------------------- data',
    data,
    'id proveedor',
    providerId,
  );
  return { data, loading, error };
};
