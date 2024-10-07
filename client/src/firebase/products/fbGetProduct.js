import React, { useEffect, useState } from 'react';
import { selectUser } from '../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { db } from '../firebaseconfig';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

// Función para obtener un producto una sola vez
export const fbGetProduct = async (user, productId) => {
    const productRef = doc(db, 'businesses', user.businessID, 'products', productId);
    const productSnapshot = await getDoc(productRef);
    if (productSnapshot.exists()) {
        return { id: productSnapshot.id, ...productSnapshot.data() };
    } else {
        return null; // Producto no encontrado
    }
}

// Función para escuchar cambios en tiempo real de un producto
export const fbListenProduct = (user, productId, setProduct, setError, setLoading) => {
    const productRef = doc(db, "businesses", user.businessID, 'products', productId);

    const unsubscribe = onSnapshot(productRef, (doc) => {
        if (doc.exists()) {
            setProduct({ id: doc.id, ...doc.data() });
            setError(null);
        } else {
            setProduct(null); // Producto no encontrado
            setError('Producto no encontrado');
        }
        setLoading(false);
    }, (error) => {
        console.error('Error al obtener el producto:', error);
        setError('Error al obtener el producto');
        setLoading(false);
    });

    return unsubscribe;
}

// Hook para escuchar el producto
export const useListenProduct = (productId) => {
    const user = useSelector(selectUser);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (productId && user?.businessID) {
            setLoading(true); // Iniciar el estado de carga
            const unsubscribe = fbListenProduct(user, productId, setData, setError, setLoading);
            return () => unsubscribe(); // Cleanup al desmontar
        }
    }, [productId, user]);

    return { data, loading, error };
}
