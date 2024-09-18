// rowShelfRepository.js
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

// Obtener referencia de la colección de filas de un estante
const getRowShelfCollectionRef = (businessId, warehouseId, shelfId) => {
    if (typeof businessId !== 'string' || !businessId || typeof warehouseId !== 'string' || !warehouseId || typeof shelfId !== 'string' || !shelfId) {
        console.error("Invalid parameter passed to getRowShelfCollectionRef", businessId, warehouseId, shelfId);
        return;
    }
    return collection(db, 'businesses', businessId, 'warehouses', warehouseId, 'shelves', shelfId, 'rows');
};

// Crear una nueva fila de estante
const create = async (user, warehouseId, shelfId, rowShelfData) => {
    const id = nanoid();
    try {
        const rowShelfCollectionRef = getRowShelfCollectionRef(user.businessID, warehouseId, shelfId);
        const rowShelfDocRef = doc(rowShelfCollectionRef, id);

        await setDoc(rowShelfDocRef, {
            ...rowShelfData,
            id,
            shelfId,
            warehouseId,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        });

        return { ...rowShelfData, id };
    } catch (error) {
        console.error('Error al añadir el documento: ', error);
        throw error;
    }
};

// Leer todas las filas de un estante específico
const readAll = async (user, warehouseId, shelfId) => {
    try {
        const rowShelfCollectionRef = getRowShelfCollectionRef(user.businessID, warehouseId, shelfId);
        const querySnapshot = await getDocs(rowShelfCollectionRef);
        const rows = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return rows;
    } catch (error) {
        console.error('Error al leer los documentos: ', error);
        throw error;
    }
};

// Escuchar en tiempo real todas las filas de un estante específico
const listenAll = (user, warehouseId, shelfId, callback) => {
    try {
        const rowShelfCollectionRef = getRowShelfCollectionRef(user.businessID, warehouseId, shelfId);
        return onSnapshot(rowShelfCollectionRef, (querySnapshot) => {
            const rows = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(rows);
        });
    } catch (error) {
        console.error('Error al escuchar documentos en tiempo real: ', error);
        throw error;
    }
};

// Actualizar una fila de estante
const update = async (user, warehouseId, shelfId, id, updatedData) => {
    try {
        const rowShelfDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', shelfId, 'rows', id);
        await updateDoc(rowShelfDocRef, {
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

// Marcar una fila de estante como eliminada
const remove = async (user, warehouseId, shelfId, id) => {
    try {
        const rowShelfDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', shelfId, 'rows', id);
        await updateDoc(rowShelfDocRef, {
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

export const rowShelfRepository = {
    create,
    readAll,
    listenAll,
    update,
    remove,
};
