import { db } from "../firebaseconfig";
import { selectUser } from "../../features/auth/userSlice";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * Establece un listener para las categorías favoritas de un usuario.
 * 
 * @param {Object} user Objeto del usuario que contiene businessID y uid.
 * @param {Function} callback Función que se llama con las categorías favoritas cada vez que hay un cambio.
 * @returns {Function|null} La función unsubscribe para detener el listener o null si no se estableció.
 */
export const fbGetFavoriteProductCategories = (user, callback) => {
    const { businessID, uid } = user;
    if (!businessID || !uid) {
        console.error('No se han proporcionado los datos necesarios para establecer el listener');
        return null; // Retorna null para indicar que no se estableció el listener
    }

    const favoriteCategoriesRef = doc(db, "businesses", businessID, 'users', uid, 'productCategories', 'favorite');

    // Establece el listener y llama al callback con los datos cada vez que haya un cambio
    const unsubscribe = onSnapshot(favoriteCategoriesRef, (doc) => {
        if (doc.exists()) {
            const favoriteCategories = doc.data().favoriteCategories;
            callback(favoriteCategories); // Llama al callback con las categorías favoritas
        } else {
            callback([]); // Llama al callback con un arreglo vacío si el documento no existe
        }
    }, (error) => {
        console.error("Error al escuchar las categorías favoritas: ", error);
    });

    // Retorna la función unsubscribe para que pueda ser llamada para detener el listener cuando ya no sea necesario
    return unsubscribe;
};

export const useGetFavoriteProductCategories = () => {
    const user = useSelector(selectUser);
    const [favoriteCategories, setFavoriteCategories] = useState([]);
    useEffect(() => {
        let unsubscribe = null;
        if (user && user.businessID && user.uid) {
            unsubscribe = fbGetFavoriteProductCategories(user, setFavoriteCategories);
        }
        return () => {
            // Asegúrate de que unsubscribe sea una función antes de llamarla
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [user]);

    return { favoriteCategories };
};
