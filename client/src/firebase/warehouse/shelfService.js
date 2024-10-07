import { useSelector } from 'react-redux';
import { shelfRepository } from './shelfRepository';
import { selectUser } from '../../features/auth/userSlice';
import { useEffect, useState } from 'react';

// Servicio para crear un nuevo estante
export const createShelf = async (user, warehouseId, shelfData) => {
  try {
    return await shelfRepository.create(user, warehouseId, shelfData);
  } catch (error) {
    console.error('Error al crear el estante: ', error);
    throw error;
  }
};

// Servicio para obtener todos los estantes de un almacén específico
export const getShelves = async (user, warehouseId) => {
  try {
    return await shelfRepository.readAll(user, warehouseId);
  } catch (error) {
    console.error('Error al obtener estantes: ', error);
    throw error;
  }
};

// Servicio para obtener todos los estantes de un almacén específico en tiempo real
export const listenAllShelves = (user, warehouseId, callback, onError) => {
    return shelfRepository.listenAll(user, warehouseId, callback, onError);
};

// Servicio para actualizar un estante
export const updateShelf = async (user, warehouseId, updatedData) => {
  try {
    return await shelfRepository.update(user, warehouseId, updatedData);
  } catch (error) {
    console.error('Error al actualizar el estante: ', error);
    throw error;
  }
};

// Servicio para borrar (marcar como eliminado) un estante
export const deleteShelf = async (user, warehouseId, id) => {
  try {
    return await shelfRepository.remove(user, warehouseId, id);
  } catch (error) {
    console.error('Error al borrar el estante: ', error);
    throw error;
  }
};

export const useListenShelves = (warehouseId) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (warehouseId && user?.businessID) {
      setLoading(true); // Iniciar el estado de carga
      const unsubscribe = listenAllShelves(
        user,
        warehouseId,
        (data) => {
          setData(data);
          setLoading(false);
        },
        (error) => {
          setError(error);
          setLoading(false);
        });
      return () => unsubscribe(); // Cleanup al desmontar
    }
  }, [warehouseId, user]);

  return { data, loading, error };
}