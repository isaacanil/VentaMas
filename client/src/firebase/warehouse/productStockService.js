// productStockService.js
import { productStockRepository } from './productStockRepository';

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
export const updateProductStock = async (user, id, updatedData) => {
  try {
    return await productStockRepository.update(user, id, updatedData);
  } catch (error) {
    console.error('Error al actualizar el producto en stock: ', error);
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
