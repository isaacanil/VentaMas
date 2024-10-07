
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseconfig';
import { selectUser } from '../../features/auth/userSlice';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * Configura una suscripción a Firestore para obtener productos con fecha de expiración.
 * @param {string} businessID - El ID del negocio del usuario.
 * @param {Function} onData - Callback que se ejecuta con los datos de productos obtenidos.
 * @param {Function} onError - Callback que se ejecuta en caso de error.
 * @returns {Function} - Función para cancelar la suscripción.
 */

export const getProductsWithBatchListener = (businessID, onData, onError) => {
    if (!businessID) {
        const error = new Error('businessID no proporcionado');
        onError(error);
        return () => { }; // Retorna una función vacía si no hay businessID
    }

    // Referencia a la colección de productos dentro del negocio específico
    const productsRef = collection(db, 'businesses', businessID, 'products');

    // Crear una consulta para productos que tienen una fecha de expiración
    const q = query(productsRef, where('hasExpirationDate', '==', true));

    // Configurar la suscripción a la consulta
    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const productsArray = snapshot.docs.map((doc) => ({
                id: doc.id, // Incluir el ID del documento si es necesario
                ...doc.data(),
            }));
            onData(productsArray);
        },
        (error) => {
            console.error('Error en la suscripción de productos:', error);
            onError(error);
        }
    );

    // Retornar la función de cancelación de la suscripción
    return unsubscribe;
};

export const useGetProductsWithBatch = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); // Estado de carga
    const [error, setError] = useState(null); // Estado de error

    const user = useSelector(selectUser);

    useEffect(() => {
        if (!user || !user.businessID) {
            const errMsg = 'Usuario o businessID no válido';
            console.error(errMsg);
            setError(errMsg);
            setLoading(false);
            return;
        }

        // Configurar la suscripción utilizando la función de servicio
        const unsubscribe = getProductsWithBatchListener(
            user.businessID,
            (productsArray) => {
                setProducts(productsArray);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user]);

    return { products, loading, error };
}
