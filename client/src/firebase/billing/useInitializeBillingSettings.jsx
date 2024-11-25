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
    
        const initializeSettings = async () => {
            try {
                const docSnapshot = await getDoc(userDocRef);
                if (!docSnapshot.exists()) {
                    await setDoc(userDocRef, { billingMode: 'direct' });
                }
            } catch (error) {
                console.error('Error al inicializar la configuración de facturación:', error);
            }
        };

        initializeSettings();

        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            const data = docSnapshot.data() || { billingMode: 'direct', invoiceType: 'template1' };

            queryClient.setQueryData(['billingSettings', user.businessID], data)

            dispatch(setBillingSettings({
                ...data,
                isLoading: false,
                isError: false
            }));
        }, (error) => {
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
