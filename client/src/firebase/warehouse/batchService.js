import { useEffect, useState } from 'react';
import { selectUser } from '../../features/auth/userSlice';
import { batchRepository } from './batchRepository';
import { useSelector } from 'react-redux';

// Servicio para crear un nuevo batch
export const createBatch = async (user, batchData) => {
  try {
    return await batchRepository.create(user, batchData);
  } catch (error) {
    console.error('Error al crear el batch:', error);
    throw error;
  }
};

// Servicio para obtener todos los batches de un negocio, opcionalmente filtrados por productId
export const getAllBatches = async (user, productID = null) => {
  try {
    return await batchRepository.readAll(user, productID);
  } catch (error) {
    console.error('Error al obtener los batches:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los batches de un negocio específico, opcionalmente filtrados por productId
export const listenAllBatches = (user, productID = null, callback) => {
  try {
    // Retorna la función de desuscripción para permitir cancelar la escucha
    return  batchRepository.listenAll(user, productID, callback);
  } catch (error) {
    console.error('Error al escuchar batches en tiempo real:', error);
    throw error;
  }
};


// Servicio para actualizar un batch existente
export const updateBatch = async (user, updatedData) => {
  try {
    return await batchRepository.update(user, updatedData);
  } catch (error) {
    console.error('Error al actualizar el batch:', error);
    throw error;
  }
};

// Servicio para borrar (marcar como eliminado) un batch
export const deleteBatch = async (user, batchID) => {
  try {
    return await batchRepository.remove(user, batchID);
  } catch (error) {
    console.error('Error al borrar el batch:', error);
    throw error;
  }
};

export const useListenBatchesByIds = (batchIDs = []) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if batchIDs array is empty or no user is provided
      // Try-catch para manejar posibles errores en la lógica de suscripción
      try {
       
        // Validaciones iniciales
        if (!Array.isArray(batchIDs) || batchIDs.length === 0 || !user.businessID) {
          setData([]);
          setLoading(false);
          return;
        }
  
        setLoading(true);
        setError(null);
  
        // Escuchar en tiempo real los IDs de batches
        const unsubscribe = batchRepository.listenAllBatchesByIds(user, batchIDs, (updatedBatches) => {
          try {
            setData(updatedBatches);
            setLoading(false);
          } catch (callbackError) {
            console.error('Error en el callback de onSnapshot:', callbackError);
            setError(callbackError);
          }
        });
  
        // Cleanup
        return () => unsubscribe();
      } catch (error) {
        console.error('Error en useListenBatchesByIds:', error);
        setError(error);
        setLoading(false);
      }

  }, [user, batchIDs]);

  return { data, loading, error };
};

export default useListenBatchesByIds;
