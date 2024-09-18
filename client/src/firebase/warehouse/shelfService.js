import { shelfRepository } from './shelfRepository';

// Servicio para crear un nuevo estante
export const createShelf = async (warehouseId, shelfData) => {
  try {
    return await shelfRepository.create(warehouseId, shelfData);
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
export const listenAllShelves = (user, warehouseId, callback) => {
    try {
      // Usar listenAll en lugar de readAll
      return shelfRepository.listenAll(user, warehouseId, callback);
    } catch (error) {
      console.error('Error al escuchar los estantes: ', error);
      throw error;
    }
  };

// Servicio para actualizar un estante
export const updateShelf = async (user, warehouseId, id, updatedData) => {
  try {
    return await shelfRepository.update(user, warehouseId, id, updatedData);
  } catch (error) {
    console.error('Error al actualizar el estante: ', error);
    throw error;
  }
};

// Servicio para borrar (marcar como eliminado) un estante
export const deleteShelf = async (warehouseId, id) => {
  try {
    return await shelfRepository.remove(warehouseId, id);
  } catch (error) {
    console.error('Error al borrar el estante: ', error);
    throw error;
  }
};
