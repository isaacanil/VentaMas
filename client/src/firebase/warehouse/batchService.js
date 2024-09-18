import { batchRepository } from './batchRepository';

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
export const listenAllBatches = async (user, productID = null, callback) => {
  try {
    // Retorna la función de desuscripción para permitir cancelar la escucha
    return await batchRepository.listenAll(user, productID, callback);
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
