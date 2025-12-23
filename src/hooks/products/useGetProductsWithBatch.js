import { collection, query, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

/**
 * Configura una suscripción a Firestore para obtener productos con fecha de expiración.
 * @param {string} businessID - El ID del negocio del usuario.
 * @param {Function} onData - Callback que se ejecuta con los datos de productos obtenidos.
 * @param {Function} onError - Callback que se ejecuta en caso de error.
 * @returns {Function} - Función para cancelar la suscripción.
 */

export const getProductsWithBatchListener = (businessID, onData, onError) => {
  if (!businessID) {
    onError(new Error('businessID no proporcionado'));
    return undefined;
  }

  // Referencia a la colección de productos dentro del negocio específico
  const productsRef = collection(db, 'businesses', businessID, 'products');

  // Crear una consulta para productos que tienen una fecha de expiración
  const q = query(productsRef);

  // Configurar la suscripción a la consulta
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const productsArray = snapshot.docs.map((doc) => ({
        id: doc.id, // Incluir el ID del documento si es necesario
        ...doc.data(),
      }));
      onData(productsArray);
    },
    (error) => {
      console.error('Error en la suscripción de productos:', error);
      onError(error);
    },
  );

  // Retornar la función de cancelación de la suscripción
  return unsubscribe;
};

export const useGetProductsWithBatch = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user || !user.businessID) {
      return;
    }

    // Configurar la suscripción utilizando la función de servicio
    const unsubscribe = getProductsWithBatchListener(
      user.businessID,
      (productsArray) => {
        setProducts(productsArray);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user]);

  return { products, loading, error };
};
