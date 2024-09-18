// warehouseService.js
import { warehouseRepository } from './warehouseRepository';

// Servicio para crear un nuevo almacén
export const createWarehouse = async (user, warehouseData) => {
  try {
    // Aquí podrías añadir lógica de negocio adicional si es necesario
    return await warehouseRepository.create(user, warehouseData);
  } catch (error) {
    console.error('Error al crear el almacén: ', error);w
 
    throw error;
  }
};

// Servicio para obtener todos los almacenes de un negocio específico
export const getWarehouses = async (user) => {
  try {
    return await warehouseRepository.readAll(user);
  } catch (error) {
    console.error('Error al obtener almacenes: ', error);
    throw error;
  }
};

// Servicio para actualizar un almacén
export const updateWarehouse = async (user, id, updatedData) => {
  try {
    return await warehouseRepository.update(user, id, updatedData);
  } catch (error) {
    console.error('Error al actualizar el almacén: ', error);
    throw error;
  }
};

// Servicio para borrar (marcar como eliminado) un almacén
export const deleteWarehouse = async (user, id) => {
  try {
    return await warehouseRepository.remove(user, id);
  } catch (error) {
    console.error('Error al borrar el almacén: ', error);
    throw error;
  }
};
