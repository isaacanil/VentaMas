import { useEffect } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { selectUser } from '../../features/auth/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setBillingSettings } from '../../features/cart/cartSlice';

const useInitializeBillingSettings = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user?.businessID) return;

        const userDocRef = doc(db, 'businesses', user.businessID, "settings", "billing");

        // Inicializar el documento si no existe
    
        const initializeSettings = async () => {
            try {
                const docSnapshot = await getDoc(userDocRef);
                if (!docSnapshot.exists()) {
                    // El documento no existe, crearlo con la configuración predeterminada
                    await setDoc(userDocRef, { billingMode: 'direct' });
                    // console.log('Configuración de facturación creada con éxito.');
                } else {
                    // console.log('El documento de configuración de facturación ya existe.');
                }
            } catch (error) {
                console.error('Error al inicializar la configuración de facturación:', error);
            }
        };

        initializeSettings();


        // Suscribirse a cambios en tiempo real
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            const data = docSnapshot.data() || { billingMode: 'direct', invoiceType: 'template1' };

            // Actualizar el cache de React Query
            queryClient.setQueryData(['billingSettings', user.businessID], data)

            // Despachar la acción para actualizar el estado global
            dispatch(setBillingSettings({
                ...data,
                isLoading: false,
                isError: false
            }));
        }, (error) => {
            console.error('Error al escuchar cambios en la configuración de facturación:', error);
            dispatch(setBillingSettings({
                billingMode: null,
                isLoading: false,
                isError: true
            }));
        });

        return () => unsubscribe();
    }, [user?.businessID, dispatch, queryClient]);
};

export default useInitializeBillingSettings;
