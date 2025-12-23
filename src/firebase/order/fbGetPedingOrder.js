import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { createReference, getDocFromRef } from '@/utils/refereceUtils';
import { db } from '@/firebase/firebaseconfig';

const convertTimestamps = (dates, fields) => {
  fields.forEach((field) => {
    const timestamp = dates[field]?.seconds;
    if (timestamp) dates[field] = timestamp * 1000;
  });
};

export const subscribeToOrders = (businessID, callback) => {
  const ordersRef = collection(db, 'businesses', businessID, 'orders');
  const q = query(
    ordersRef,
    where('data.state', '==', 'state_2'),
    orderBy('data.numberId', 'desc'),
  );
  return onSnapshot(q, callback);
};

export const getProvider = async (businessID, providerId) => {
  if (!providerId) return {};
  const providerRef = createReference(
    ['businesses', businessID, 'providers'],
    providerId,
  );
  const providerDoc = await getDocFromRef(providerRef);
  return providerDoc?.provider || {};
};

export const processOrder = async (data, businessID) => {
  const provider = await getProvider(businessID, data?.provider);
  return { data: { ...data, provider } };
};

export const useFbGetPendingOrders = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.businessID) return;

    const unsubscribe = subscribeToOrders(user.businessID, async (snapshot) => {
      try {
        const orders = await Promise.all(
          snapshot.docs.map((doc) =>
            processOrder(doc.data()?.data, user.businessID),
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
