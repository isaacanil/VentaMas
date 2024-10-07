// rowShelfService.js
import { useSelector } from 'react-redux';
import { rowShelfRepository } from './RowShelfRepository';
import { selectUser } from '../../features/auth/userSlice';
import { useEffect, useState } from 'react';

// Crear una nueva fila de estante
export const createRowShelf = async (user, warehouseId, shelfId, rowShelfData) => {
    try {
        // Validación de datos, si es necesario
        if (!rowShelfData.name || typeof rowShelfData.capacity !== 'number') {
            throw new Error('Datos inválidos para crear una fila de estante');
        }

        const newRowShelf = await rowShelfRepository.create(user, warehouseId, shelfId, rowShelfData);
        console.log('Fila de estante creada con éxito:', newRowShelf);
        return newRowShelf;
    } catch (error) {
        console.error('Error al crear la fila de estante:', error);
        throw error;
    }
};

// Obtener todas las filas de un estante específico
export const getAllRowShelves = async (user, warehouseId, shelfId) => {
    try {
        const rows = await rowShelfRepository.readAll(user, warehouseId, shelfId);
        console.log('Filas de estante obtenidas:', rows);
        return rows;
    } catch (error) {
        console.error('Error al obtener las filas de estante:', error);
        throw error;
    }
};

// Escuchar en tiempo real todas las filas de un estante específico
export const listenAllRowShelves = (user, warehouseId, shelfId, callback, onError) => {
    try {
    
        return rowShelfRepository.listenAll(user, warehouseId, shelfId, callback, onError);
    } catch (error) {
        console.error('Error al escuchar filas de estante en tiempo real:', error);
        throw error;
    }
};

// Actualizar una fila de estante específica
export const updateRowShelf = async (user, warehouseId, shelfId, rowId, updatedData) => {
    try {
        // Validación de datos actualizados, si es necesario
        if (!updatedData || typeof updatedData !== 'object') {
            throw new Error('Datos inválidos para actualizar la fila de estante');
        }

        const updatedRowShelf = await rowShelfRepository.update(user, warehouseId, shelfId, rowId, updatedData);
        console.log('Fila de estante actualizada con éxito:', updatedRowShelf);
        return updatedRowShelf;
    } catch (error) {
        console.error('Error al actualizar la fila de estante:', error);
        throw error;
    }
};

// Marcar una fila de estante como eliminada
export const deleteRowShelf = async (user, warehouseId, shelfId, rowId) => {
    try {
        const removedRowId = await rowShelfRepository.remove(user, warehouseId, shelfId, rowId);
        console.log('Fila de estante marcada como eliminada:', removedRowId);
        return removedRowId;
    } catch (error) {
        console.error('Error al eliminar la fila de estante:', error);
        throw error;
    }
};

export const useListenRowShelves = (warehouseId, shelfId) => {
    const user = useSelector(selectUser);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (warehouseId && shelfId && user?.businessID) {
            setLoading(true); // Iniciar el estado de carga
            const unsubscribe = listenAllRowShelves(
                user,
                warehouseId,
                shelfId,
                (data) => {
                    setData(data);
                    setLoading(false);
                },
                (error) => {
                    setError(error);
                    setLoading(false);
                }
            );
            return () => unsubscribe();
        }
    }, [warehouseId, shelfId, user]);
    return { data, loading, error };
};