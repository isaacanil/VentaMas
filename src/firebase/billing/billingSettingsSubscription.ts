import type { QueryClient } from '@tanstack/react-query';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

import { setBillingSettings } from '@/features/cart/cartSlice';
import type { CartSettings } from '@/features/cart/types';
import { db } from '@/firebase/firebaseconfig';

type BillingSettingsListenerArgs = {
  businessId: string;
  dispatch: (action: ReturnType<typeof setBillingSettings>) => void;
  queryClient: QueryClient;
};

export const DEFAULT_BILLING_SETTINGS: CartSettings['billing'] = {
  billingMode: 'direct',
  invoiceGenerationTiming: 'first-payment',
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
  subscriptionEmailNotifications: true,
  subscriptionPaymentReminder: true,
  isLoading: false,
  isError: null,
};

export const initializeAndSubscribeBillingSettings = ({
  businessId,
  dispatch,
  queryClient,
}: BillingSettingsListenerArgs) => {
  const userDocRef = doc(db, 'businesses', businessId, 'settings', 'billing');

  const initializeSettings = async () => {
    try {
      const docSnapshot = await getDoc(userDocRef);
      if (!docSnapshot.exists()) {
        await setDoc(userDocRef, DEFAULT_BILLING_SETTINGS);
      }
    } catch (error) {
      console.error(
        'Error al inicializar la configuración de facturación:',
        error,
      );
    }
  };

  void initializeSettings();

  return onSnapshot(
    userDocRef,
    (docSnapshot) => {
      const data = {
        ...DEFAULT_BILLING_SETTINGS,
        ...(docSnapshot.data() || {}),
      } as CartSettings['billing'];

      queryClient.setQueryData(['billingSettings', businessId], data);
      dispatch(
        setBillingSettings({
          ...data,
          isError: false,
          isLoading: false,
        }),
      );
    },
    () => {
      const fallbackData: CartSettings['billing'] = {
        ...DEFAULT_BILLING_SETTINGS,
        isError: true,
        isLoading: false,
      };

      queryClient.setQueryData(['billingSettings', businessId], fallbackData);
      dispatch(setBillingSettings(fallbackData));
    },
  );
};
