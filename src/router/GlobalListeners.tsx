import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useBusinessDataConfig } from '@/features/auth/useBusinessDataConfig';
import { ReloadImageHiddenSetting } from '@/features/setting/settingSlice';
import { useHydrateTaxReceiptSettings } from '@/features/taxReceipt/useHydrateTaxReceiptSettings';
import { useUserDocListener } from '@/firebase/Auth/fbAuthV2/fbSignIn/updateUserData';
import { useInitializeBillingSettings } from '@/firebase/billing/useInitializeBillingSettings';
import { useCurrentCashDrawer } from '@/firebase/cashCount/useCurrentCashDrawer';
import { useRealtimePresence } from '@/firebase/presence/useRealtimePresence';
import { useFbTaxReceiptToggleStatus } from '@/firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus';
import { useAutoCreateDefaultTaxReceipt } from '@/firebase/taxReceipt/fbAutoCreateDefaultReceipt';
import { useLoadUserAbilities, useAbilities } from '@/hooks/abilities/useAbilities';
import { useNavigationTracker } from '@/hooks/routes/useNavigationTracker';
import { useCheckForInternetConnection } from '@/hooks/useCheckForInternetConnection';
import { useDeveloperCommands } from '@/hooks/useDeveloperCommands';
import { usePersistentDeveloperBusiness } from '@/hooks/usePersistentDeveloperBusiness';
import { useTaxReceiptsFix } from '@/hooks/useTaxReceiptsFix';

interface User {
  uid?: string;
  role?: string;
  businessID?: string;
  [key: string]: unknown;
}

type UserState = User | null | false;

const NavigationTracker = () => {
  useNavigationTracker();
  return null;
};

export const GlobalListeners = ({ user }: { user: UserState }) => {
  const dispatch = useDispatch();

  // Permitir selección de texto solo para desarrolladores
  useEffect(() => {
    const isDev = user && typeof user === 'object' && user.role === 'dev';
    document.body.style.userSelect = isDev ? 'auto' : 'none';
    return () => {
      document.body.style.userSelect = '';
    };
  }, [user]);

  useTaxReceiptsFix();
  useDeveloperCommands();
  usePersistentDeveloperBusiness();

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting());
  }, [dispatch]);

  useInitializeBillingSettings();

  useLoadUserAbilities();
  useUserDocListener(user && typeof user === 'object' ? user.uid : undefined);
  useRealtimePresence(user);
  useCurrentCashDrawer();
  useAbilities();
  useAutoCreateDefaultTaxReceipt();
  useHydrateTaxReceiptSettings();
  useFbTaxReceiptToggleStatus();
  useBusinessDataConfig();
  useCheckForInternetConnection();

  return <NavigationTracker />;
};

export default GlobalListeners;
