import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../firebaseconfig";
import { login, logout } from "../../../../features/auth/userSlice";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

export function useAutomaticLogin() {
    const dispatch = useDispatch();

    useEffect(() => {
        // Obtener el token de sesión del almacenamiento local
        const sessionToken = localStorage.getItem('sessionToken');

        if (sessionToken) {
            (async () => {
                try {
                    // Obtener el id del usuario asociado con el token de sesión
                    const sessionSnapshot = await getDoc(doc(db, 'sessionTokens', sessionToken));
                    const userId = sessionSnapshot.data().userId;
                    
                    // Obtener los detalles del usuario de Firestore
                    const userSnapshot = await getDoc(doc(db, 'users', userId));
                    const userData = userSnapshot.data().user;

                    // Actualizar el estado de la aplicación con los detalles del usuario
                    dispatch(login({
                        uid: userSnapshot.id,
                        displayName: userData.name
                    }));
     
                    console.log('User logged in successfully');
                } catch (error) {
                    console.error('An error occurred during automatic sign in'); 
                }
            })();
        }else{
            dispatch(logout())
        }
    }, []);
}
