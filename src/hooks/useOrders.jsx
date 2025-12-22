import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../features/auth/userSlice';
import { subscribeSingleOrder } from '../firebase/order/fbGetOrder';
import { subscribeToOrder, processOrder } from '../firebase/order/fbGetOrders';
import { sortOrders } from '../utils/filterUtils';

// Función auxiliar para convertir timestamps
const convertTimestamps = (data) => {
  const timestampFields = [
    'createdAt',
    'updatedAt',
    'deliveryAt',
    'paymentAt',
    'completedAt',
  ];

  timestampFields.forEach((field) => {
    if (data[field]) {
      if (typeof data[field].toMillis === 'function') {
        data[field] = data[field].toMillis();
      }
    }
  });

  return data;
};

export const useListenOrders = (filterState) => {
  const user = useSelector(selectUser);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return filterState?.isAscending !== undefined
      ? sortOrders(orders, filterState.isAscending)
      : orders;
  }, [orders, filterState?.isAscending]);

  useEffect(() => {
    if (!user?.businessID) return;

    setIsLoading(true);

    const unsubscribe = subscribeToOrder(
      user.businessID,
      filterState?.filters,
      async (snapshot) => {
        try {
          const orders = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const orderData = doc.data();
              const processedData = convertTimestamps(orderData);
              return processOrder(processedData, user.businessID);
            }),
          );

          setOrders(orders);
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setIsLoading(false);
        }
      },
    );

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [user, filterState?.filters]);

  return {
    orders: sortedOrders,
    isLoading,
  };
};

export const useListenOrder = (orderId) => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.businessID || !orderId) return;

    setIsLoading(true);

    const unsubscribe = subscribeSingleOrder(
      user.businessID,
      orderId,
      async (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setOrder(null);
            return;
          }

          const orderData = snapshot.data();
          const processedData = convertTimestamps(orderData);

          setOrder(processedData);
        } catch (error) {
          console.error('Error fetching single order:', error);
          setOrder(null);
        } finally {
          setIsLoading(false);
        }
      },
    );

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [user, orderId]);

  return {
    order,
    isLoading,
  };
};
