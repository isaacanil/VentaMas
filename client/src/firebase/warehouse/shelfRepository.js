// shelfRepository.js
import { nanoid } from '@reduxjs/toolkit';
import { db } from '../firebaseconfig';
import {
    collection,
    updateDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    setDoc,
    query,
    where,
    orderBy,
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
const create = async (user, warehouseId, data) => {
    const id = nanoid();
    try {
        const shelfCollectionRef = getShelfCollectionRef(user.businessID, warehouseId);
        const shelfDocRef = doc(shelfCollectionRef, id);

        await setDoc(shelfDocRef, {
            ...data,
            id,
            warehouseId,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
        });

        return data;
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
            const shelves = querySnapshot.docs.map((doc) => (doc.data()));
            callback(shelves);
        });
    } catch (error) {
        console.error('Error al escuchar documentos en tiempo real: ', error);
        throw error;
    }
};

// Escuchar en tiempo real todos los estantes de un almacén específico
const listenAll = (user, warehouseId, callback, onError) => {

    const shelfCollectionRef = getShelfCollectionRef(user.businessID, warehouseId);

    const q = query(shelfCollectionRef, where('isDeleted', "==", false), where('warehouseId', "==", warehouseId));

    return onSnapshot(
        q,
        (snapshot) => {
            const shelves = snapshot.docs.map((doc) => doc.data());
            const order = shelves.sort((a, b) => a.createdAt - b.createdAt);
            callback(order);
        },
        (error) => {
            if (onError) {
                onError(error);
            }
        }
    );
};

// Actualizar un estante
const update = async (user, warehouseId, data) => {
    try {
        const shelfDocRef = doc(db, 'businesses', user.businessID, 'warehouses', warehouseId, 'shelves', data.id);
        await updateDoc(shelfDocRef, {
            ...data,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        });
        return data;
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
