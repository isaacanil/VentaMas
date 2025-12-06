import { useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { setBillingSettings } from '../../features/cart/cartSlice';
import { db } from '../firebaseconfig';

export const useInitializeBillingSettings = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.businessID) return;

    const userDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'billing',
    );
    const defaultSettings = {
      billingMode: 'direct',
      invoiceType: 'template1',
      authorizationFlowEnabled: false,
      enabledAuthorizationModules: {
        invoices: true,
        accountsReceivable: true,
        cashRegister: true,
      },
      stockAlertsEnabled: false,
      stockLowThreshold: 20,
      stockCriticalThreshold: 10,
      stockAlertEmail: '',
    };

    const initializeSettings = async () => {
      try {
        const docSnapshot = await getDoc(userDocRef);
        if (!docSnapshot.exists()) {
          await setDoc(userDocRef, defaultSettings);
        }
      } catch (error) {
        console.error(
          'Error al inicializar la configuración de facturación:',
          error,
        );
      }
    };

    initializeSettings();

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        const data = {
          ...defaultSettings,
          ...(docSnapshot.data() || {}),
        };

        queryClient.setQueryData(['billingSettings', user.businessID], data);

        dispatch(
          setBillingSettings({
            ...data,
            isLoading: false,
            isError: false,
          }),
        );
      },
      (_error) => {
        dispatch(
          setBillingSettings({
            billingMode: null,
            isLoading: false,
            isError: true,
          }),
        );
      },
    );

    return () => unsubscribe();
  }, [user?.businessID, dispatch, queryClient]);
};
