// productStockService.js
import { productStockRepository } from './productStockRepository';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';

// Servicio para crear un nuevo producto en stock
export const createProductStock = async (user, productStockData) => {
  try {
    return await productStockRepository.create(user, productStockData);
  } catch (error) {
    console.error('Error al crear el producto en stock: ', error);
    throw error;
  }
};

// Servicio para obtener todos los productos en stock
export const getProductsStock = async (user) => {
  try {
    return await productStockRepository.readAll(user);
  } catch (error) {
    console.error('Error al obtener productos en stock: ', error);
    throw error;
  }
};

// Servicio para actualizar un producto en stock
export const updateProductStock = async (user, updatedData) => {
  try {
    return await productStockRepository.update(user, updatedData);
  } catch (error) {
    console.error('Error al actualizar el producto en stock: ', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los batches de un negocio específico, opcionalmente filtrados por productId
export const listenAllProductStock = (user, productId, callback) => {
  try {
    // Retorna la función de desuscripción para permitir cancelar la escucha
    return productStockRepository.listenAll(user, productId, callback);
  } catch (error) {
    console.error('Error al escuchar batches en tiempo real:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los batches de un negocio específico, opcionalmente filtrados por productId
export const listenAllProductStockByLocation = (user, location = null, callback) => {
  try {
    // Retorna la función de desuscripción para permitir cancelar la escucha
    return productStockRepository.listenAllByLocation(user, location, callback);
  } catch (error) {
    console.error('Error al escuchar batches en tiempo real:', error);
    throw error;
  }
};


// Servicio para borrar (marcar como eliminado) un producto en stock
export const deleteProductStock = async (user, id) => {
  try {
    return await productStockRepository.remove(user, id);
  } catch (error) {
    console.error('Error al borrar el producto en stock: ', error);
    throw error;
  }
};


export const useListenProductsStockByLocation = (location = null) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stableUser = useMemo(() => user, [user]); // Memorizar `user` para evitar cambios innecesarios
  const stableLocation = useMemo(() => location, [location]); // Memorizar `location` para evitar cambios innecesarios

  useEffect(() => {
    if (!location?.id) {
      setData([]);
      setLoading(false);
      return;
    }
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Iniciar la escucha en tiempo real
    const unsubscribe = listenAllProductStockByLocation(user, location, (updatedProducts) => {
      setData(updatedProducts);
      setLoading(false);
    });

    // Manejo de errores en la escucha
    const handleError = (err) => {
      console.error('Error en la escucha de batches:', err);
      setError(err);
      setLoading(false);
    };

    // Puedes modificar el servicio listenAllBatches para manejar errores
    // o agregar un listener adicional aquí si es necesario.

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
    ;
  }, [stableUser, stableLocation]);

  return { data, loading, error };
};

export const useListenProductsStock = (productId = null) => {
  const user = useSelector(selectUser);
  const stableUser = useMemo(() => user, [user]); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setData([]);
      setLoading(false);
      return;
    }
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Iniciar la escucha en tiempo real
    const unsubscribe = listenAllProductStock(stableUser, productId, (newData) => {
      // Solo actualiza si `newData` es diferente al estado actual
      setData((prevData) => {
        if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
          return newData;
        }
        return prevData;
      });
      setLoading(false);
    });

    // Manejo de errores en la escucha
    const handleError = (err) => {
      console.error('Error en la escucha de batches:', err);
      setError(err);
      setLoading(false);
    };
    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
    ;
  }, [stableUser, productId]);

  return { data, loading, error };
};

