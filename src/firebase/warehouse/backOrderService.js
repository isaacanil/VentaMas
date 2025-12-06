import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const convertTimestampToDate = (timestamp) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

export const useListenBackOrders = (user) => {
  const [backOrders, setBackOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const listenToBackOrders = async () => {
      if (!user?.businessID) {
        setBackOrders([]);
        setLoading(false);
        return;
      }

      try {
        const backOrdersRef = collection(
          db,
          `businesses/${user.businessID}/backOrders`,
        );
        const q = query(backOrdersRef);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const backOrdersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: convertTimestampToDate(doc.data().createdAt),
              updatedAt: convertTimestampToDate(doc.data().updatedAt),
            }));
            setBackOrders(backOrdersData);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          },
        );
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    listenToBackOrders();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.businessID]);

  return { data: backOrders, loading, error };
};

export const useEnrichedBackOrders = () => {
  const [backOrders, setBackOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = useSelector(selectUser);

  useEffect(() => {
    let unsubscribe;

    const listenToBackOrders = async () => {
      if (!user?.businessID) {
        setBackOrders([]);
        setLoading(false);
        return;
      }

      try {
        const backOrdersRef = collection(
          db,
          `businesses/${user.businessID}/backOrders`,
        );
        const q = query(
          backOrdersRef,
          where('status', 'in', ['pending', 'reserved']),
        );

        unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            const enrichedBackOrders = await Promise.all(
              snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                let productName = data?.productName;

                // Si no hay productName, intentamos obtenerlo
                if (!productName && data?.productId) {
                  try {
                    const productRef = doc(
                      db,
                      `businesses/${user.businessID}/products/${data.productId}`,
                    );
                    const productSnap = await getDoc(productRef);
                    if (productSnap.exists()) {
                      productName = productSnap.data().name;
                      // Actualizamos el backorder con el nombre del producto
                      await updateDoc(docSnap.ref, {
                        productName,
                        updatedAt: Timestamp.now(),
                      });
                    }
                  } catch (err) {
                    console.error('Error fetching product:', err);
                  }
                }

                return {
                  id: docSnap.id,
                  ...data,
                  productName: productName || 'Producto no encontrado',
                  createdAt: convertTimestampToDate(data.createdAt),
                  updatedAt: convertTimestampToDate(data.updatedAt),
                };
              }),
            );

            setBackOrders(enrichedBackOrders);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          },
        );
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    listenToBackOrders();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.businessID]);

  return { data: backOrders, loading, error };
};

export const createBackOrder = async (businessId, backOrderData) => {
  try {
    const backOrdersRef = collection(db, `businesses/${businessId}/backOrders`);
    const newBackOrder = {
      ...backOrderData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'pending',
    };

    await addDoc(backOrdersRef, newBackOrder);
    return true;
  } catch (error) {
    console.error('Error creating backorder:', error);
    throw error;
  }
};

export const updateBackOrder = async (businessId, backOrderId, updateData) => {
  try {
    const backOrderRef = doc(
      db,
      `businesses/${businessId}/backOrders/${backOrderId}`,
    );
    await updateDoc(backOrderRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating backorder:', error);
    throw error;
  }
};

export const getBackOrdersByProduct = async (businessId, productId) => {
  try {
    const backOrdersRef = collection(db, `businesses/${businessId}/backOrders`);
    const q = query(
      backOrdersRef,
      where('productId', '==', productId),
      where('status', 'in', ['pending', 'reserved']),
    );

    const result = await getDocs(q);
    return result.docs.map((doc) => ({
      ...doc.data(),
      createdAt: convertTimestampToDate(doc.data().createdAt),
      updatedAt: convertTimestampToDate(doc.data().updatedAt),
    }));
  } catch (error) {
    console.error('Error getting backorders:', error);
    throw error;
  }
};

export const useBackOrdersByProduct = (productId) => {
  const user = useSelector(selectUser);
  const [backOrders, setBackOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    if (!user?.businessID || !productId) {
      setBackOrders([]);
      setLoading(false);
      return;
    }
    try {
      const backOrdersRef = collection(
        db,
        `businesses/${user.businessID}/backOrders`,
      );
      const q = query(
        backOrdersRef,
        where('productId', '==', productId),
        where('status', 'in', ['pending', 'reserved']),
      );
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: convertTimestampToDate(doc.data().createdAt),
            updatedAt: convertTimestampToDate(doc.data().updatedAt),
          }));
          setBackOrders(data);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        },
      );
    } catch (err) {
      setError(err);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.businessID, productId]);

  return { backOrders, loading, error };
};
