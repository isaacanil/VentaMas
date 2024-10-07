// segmentService.js
import { useEffect, useState } from 'react';
import { segmentRepository } from './segmentRepository';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';

// Crear un nuevo segmento
export const createSegment = async (user, warehouseId, shelfId, rowShelfId, segmentData) => {
    try {
        if (!segmentData.name || typeof segmentData.capacity !== 'number') {
            throw new Error('Datos inválidos para crear un segmento');
        }

        const newSegment = await segmentRepository.create(user, warehouseId, shelfId, rowShelfId, segmentData);
        console.log('Segmento creado con éxito:', newSegment);
        return newSegment;
    } catch (error) {
        console.error('Error al crear el segmento:', error);
        throw error;
    }
};

// Obtener todos los segmentos de una fila de estante específica
export const getAllSegments = async (user, warehouseId, shelfId, rowShelfId) => {
    try {
        const segments = await segmentRepository.readAll(user, warehouseId, shelfId, rowShelfId);
        console.log('Segmentos obtenidos:', segments);
        return segments;
    } catch (error) {
        console.error('Error al obtener los segmentos:', error);
        throw error;
    }
};

// Escuchar en tiempo real todos los segmentos de una fila de estante específica
export const listenAllSegments = (user, warehouseId, shelfId, rowShelfId, callback) => {
    try {
        return segmentRepository.listenAll(user, warehouseId, shelfId, rowShelfId, callback);
    } catch (error) {
        console.error('Error al escuchar segmentos en tiempo real:', error);
        throw error;
    }
};

// Actualizar un segmento específico
export const updateSegment = async (user, warehouseId, shelfId, rowShelfId, data) => {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Datos inválidos para actualizar el segmento');
        }
        const updatedSegment = await segmentRepository.update(user, warehouseId, shelfId, rowShelfId, data);
        return updatedSegment;
    } catch (error) {
        console.error('Error al actualizar el segmento:', error);
        throw error;
    }
};

// Marcar un segmento como eliminado
export const deleteSegment = async (user, warehouseId, shelfId, rowShelfId, segmentId) => {
    try {
        const removedSegmentId = await segmentRepository.remove(user, warehouseId, shelfId, rowShelfId, segmentId);
        console.log('Segmento marcado como eliminado:', removedSegmentId);
        return removedSegmentId;
    } catch (error) {
        console.error('Error al eliminar el segmento:', error);
        throw error;
    }
};

export const useListenAllSegments = (warehouseId, shelfId, rowShelfId) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();
    const user = useSelector(selectUser);
    useEffect(() => {
        if (!user || !warehouseId || !shelfId || !rowShelfId) {
            setData([]);
            setLoading(false);
        }
        const unsubscribe = listenAllSegments(user, warehouseId, shelfId, rowShelfId, (data) => {
            setData(data);
            setLoading(false);
        });
        return () => unsubscribe();

    }, [user, warehouseId, shelfId, rowShelfId]);
    return { data, loading, error };
}
