// segmentRepository.js
import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    setDoc,
} from 'firebase/firestore';

// Obtener referencia de la colección de segmentos de una fila de estante
const getSegmentCollectionRef = (businessId, warehouseId, shelfId, rowShelfId) => {
    if (
        typeof businessId !== 'string' || !businessId ||
        typeof warehouseId !== 'string' || !warehouseId ||
        typeof shelfId !== 'string' || !shelfId ||
        typeof rowShelfId !== 'string' || !rowShelfId
    ) {
        console.error("Invalid parameter passed to getSegmentCollectionRef", businessId, warehouseId, shelfId, rowShelfId);
        return;
    }
    return collection(db, 'businesses', businessId, 'warehouses', warehouseId, 'shelves', shelfId, 'rows', rowShelfId, 'segments');
};

// Crear un nuevo segmento
const create = async (user, warehouseId, shelfId, rowShelfId, segmentData) => {
    const id = nanoid();
    try {
        const segmentCollectionRef = getSegmentCollectionRef(user.businessID, warehouseId, shelfId, rowShelfId);
        const segmentDocRef = doc(segmentCollectionRef, id);

        await setDoc(segmentDocRef, {
            ...segmentData,
            id,
            rowShelfId,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        });

        return { ...segmentData, id };
    } catch (error) {
        console.error('Error al añadir el documento: ', error);
        throw error;
    }
};

// Leer todos los segmentos de una fila de estante específica
const readAll = async (user, warehouseId, shelfId, rowShelfId) => {
    try {
        const segmentCollectionRef = getSegmentCollectionRef(user.businessID, warehouseId, shelfId, rowShelfId);
        const querySnapshot = await getDocs(segmentCollectionRef);
        const segments = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return segments;
    } catch (error) {
        console.error('Error al leer los documentos: ', error);
        throw error;
    }
};

// Escuchar en tiempo real todos los segmentos de una fila de estante específica
const listenAll = (user, warehouseId, shelfId, rowShelfId, callback) => {
    try {
        const segmentCollectionRef = getSegmentCollectionRef(user.businessID, warehouseId, shelfId, rowShelfId);
        return onSnapshot(segmentCollectionRef, (querySnapshot) => {
            const segments = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(segments);
        });
    } catch (error) {
        console.error('Error al escuchar documentos en tiempo real: ', error);
        throw error;
    }
};

// Actualizar un segmento
const update = async (user, warehouseId, shelfId, rowShelfId, id, updatedData) => {
    try {
        const segmentDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', shelfId, 'rows', rowShelfId, 'segments', id);
        await updateDoc(segmentDocRef, {
            ...updatedData,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        });
        return { id, ...updatedData };
    } catch (error) {
        console.error('Error al actualizar el documento: ', error);
        throw error;
    }
};

// Marcar un segmento como eliminado
const remove = async (user, warehouseId, shelfId, rowShelfId, id) => {
    try {
        const segmentDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', shelfId, 'rows', rowShelfId, 'segments', id);
        await updateDoc(segmentDocRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: user.uid,
        });
        return id;
    } catch (error) {
        console.error('Error al marcar el documento como eliminado: ', error);
        throw error;
    }
};

export const segmentRepository = {
    create,
    readAll,
    listenAll,
    update,
    remove,
};
