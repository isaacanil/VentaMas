import {
  collection,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';
import { convertFirestoreTimestamps } from '../purchase/fbGetPurchases';

export const useFbGetOrders = () => {
  const [orders, setOrders] = useState([]);
  const user = useSelector(selectUser);
  useEffect(() => {
    if (!user || !user.businessID) return;
    const orderRef = collection(db, 'businesses', user.businessID, 'orders');
    // const q = query(orderRef, where("data.state.name", "==", "Solicitado"))
    const unsubscribe = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.empty) {
        setOrders([]);
        return;
      }
      let orderArray = snapshot.docs.map(async (item) => {
        let orderData = item.data();
        let providerRef = orderData.data.provider;
        let providerDoc = (await getDoc(providerRef)).data();
        orderData.data.provider = providerDoc.provider;
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

const _transformOrderData = (item) => {
  const data = item.data();
  return {
    // data: {
    //     ...data,
    //     provider: data.provider || null,
    // },
    data,
  };
};

export const useFbGetPendingOrdersByProvider = (providerId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(selectUser);

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
        let orderArray = snapshot.docs.map((doc) => doc.data());
        let orderUpdated = orderArray.map((order) => {
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
