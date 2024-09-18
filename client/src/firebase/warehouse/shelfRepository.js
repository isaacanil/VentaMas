// shelfRepository.js
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

// Obtener referencia de la colección de estantes de un almacén
const getShelfCollectionRef = (businessId, warehouseId) => {
    if (typeof businessId !== 'string' || !businessId || typeof warehouseId !== 'string' || !warehouseId) {
        console.error("Invalid parameter passed to getShelfCollectionRef", businessId, warehouseId);
        return;
    }
    return collection(db, 'businesses', businessId, 'warehouses', warehouseId, 'shelves');
};

// Crear un nuevo estante
const create = async (user, warehouseId, shelfData) => {
    const id = nanoid();
    try {
        const shelfCollectionRef = getShelfCollectionRef(user.businessID, warehouseId);
        const shelfDocRef = doc(shelfCollectionRef, id);

        await setDoc(shelfDocRef, {
            ...shelfData,
            id,
            warehouseId,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        });

        return { ...shelfData, id };
    } catch (error) {
        console.error('Error al añadir el documento: ', error);
        throw error;
    }
};

// Leer todos los estantes de un almacén específico
const readAll = async (user, warehouseId) => {
    try {
        const shelfCollectionRef = getShelfCollectionRef(user.businessID, warehouseId);
        return onSnapshot(shelfCollectionRef, (querySnapshot) => {
            const shelves = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(shelves);
        });
    } catch (error) {
        console.error('Error al escuchar documentos en tiempo real: ', error);
        throw error;
    }
};

// Escuchar en tiempo real todos los estantes de un almacén específico
const listenAll = (user, warehouseId, callback) => {
    try {
        const shelfCollectionRef = getShelfCollectionRef(user.businessID, warehouseId);
        return onSnapshot(shelfCollectionRef, (querySnapshot) => {
            const shelves = querySnapshot.docs.map((doc) => doc.data());
            callback(shelves);
        });
    } catch (error) {
        console.error('Error al escuchar documentos en tiempo real: ', error);
        throw error;
    }
};

// Actualizar un estante
const update = async (user, warehouseId, id, updatedData) => {
    try {
        const shelfDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', id);
        await updateDoc(shelfDocRef, {
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

// Marcar un estante como eliminado
const remove = async (user, warehouseId, id) => {
    try {
        const shelfDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', id);
        await updateDoc(shelfDocRef, {
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

export const shelfRepository = {
    create,
    readAll,
    listenAll,
    update,
    remove,
};
