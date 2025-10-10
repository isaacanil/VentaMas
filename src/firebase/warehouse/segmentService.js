import { nanoid } from '@reduxjs/toolkit';
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    setDoc,
    query,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';


// Obtener referencia de la colección de segmentos de una fila de estante
const getSegmentCollectionRef = (businessId) => {
    return collection(db, 'businesses', businessId, 'segments');
};

// Crear un nuevo segmento
const createSegment = async ({ user, segmentData }) => {
    const id = nanoid();
    try {
        // Segment data processed
        if (!segmentData.name || typeof segmentData.capacity !== 'number') {
            throw new Error('Datos inválidos para crear un segmento');
        }
        const segmentCollectionRef = getSegmentCollectionRef(user.businessID);
        const segmentDocRef = doc(segmentCollectionRef, id);

        await setDoc(segmentDocRef, {
            ...segmentData,
            id,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
        });

        return { ...segmentData, id };
    } catch (error) {
        console.error('Error al añadir el documento: ', error);
        throw error;
    }
};

// Obtener todos los segmentos de una fila de estante específica
const getAllSegments = async (user, warehouseId, shelfId, rowShelfId) => {
    try {
        const segmentCollectionRef = getSegmentCollectionRef(user.businessID);
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
const listenAllSegments = (user, warehouseId, shelfId, rowShelfId, callback) => {
    if(user.businessID === undefined || warehouseId === undefined || shelfId === undefined || rowShelfId === undefined) {
        console.error('Invalid parameter passed to listenAll', user.businessID, warehouseId, shelfId, rowShelfId);
        return () => {};
    }
    const segmentCollectionRef = getSegmentCollectionRef(user.businessID);
    const q = query(segmentCollectionRef,
        where('warehouseId', '==', warehouseId),
        where('shelfId', '==', shelfId),
        where('rowShelfId', '==', rowShelfId),
        where('isDeleted', '==', false));
    return onSnapshot(
        q,
        (querySnapshot) => {
            const segments = querySnapshot.docs.map((doc) => (doc.data()));
            callback(segments);
        },
        (error) => {
            console.error('Error al escuchar documentos en tiempo real: ', error);
        }
    );
};

// Actualizar un segmento específico
const updateSegment = async (user, data) => {
    try {
        const segmentDocRef = doc(db, 'businesses', user.businessID, 'segments', data.id);
        await updateDoc(segmentDocRef, {
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

// Marcar un segmento como eliminado
const deleteSegment = async (user, warehouseId, shelfId, rowShelfId, segmentId) => {
    try {
        const segmentDocRef = doc(db, 'businesses', user.businessID, 'segments', segmentId);
        await updateDoc(segmentDocRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: user.uid,
        });
        return segmentId;
    } catch (error) {
        console.error('Error al marcar el documento como eliminado: ', error);
        throw error;
    }
};

const useListenAllSegments = (warehouseId, shelfId, rowShelfId) => {
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
};

export {
    createSegment,
    getAllSegments,
    listenAllSegments,
    updateSegment,
    deleteSegment,
    useListenAllSegments
};
