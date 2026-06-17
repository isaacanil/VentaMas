import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useBusinessFiscalSync } from '@/features/fiscal/useBusinessFiscalSync';
import { ReloadImageHiddenSetting } from '@/features/setting/settingSlice';
import { useHydrateTaxReceiptSettings } from '@/features/taxReceipt/useHydrateTaxReceiptSettings';
import {
  getOrCreatePresenceConnectionId,
  getStoredSession,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { useInitializeBillingSettings } from '@/firebase/billing/useInitializeBillingSettings';
import { useCurrentCashDrawer } from '@/firebase/cashCount/useCurrentCashDrawer';
import { useRealtimePresence } from '@/firebase/presence/useRealtimePresence';
import { useFbTaxReceiptToggleStatus } from '@/firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus';
import { useAutoCreateDefaultTaxReceipt } from '@/firebase/taxReceipt/fbAutoCreateDefaultReceipt';
import { useLoadUserAbilities } from '@/hooks/abilities/useAbilities';
import { useTaxReceiptsFix } from '@/hooks/useTaxReceiptsFix';
import { useBusinessDataConfig, useUserDocListener } from '@/modules/auth/public';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

import { useDeveloperCommands } from './hooks/useDeveloperCommands';
import { useNavigationTracker } from './hooks/useNavigationTracker';
import { usePersistentDeveloperBusiness } from './hooks/usePersistentDeveloperBusiness';

interface User {
  uid?: string;
  role?: string;
  activeRole?: string | null;
  businessID?: string;
  businessId?: string | null;
  activeBusinessId?: string | null;
  [key: string]: unknown;
}

type UserState = User | null | false;

const NavigationTracker = () => {
  useNavigationTracker();
  return null;
};

export const GlobalListeners = ({ user }: { user: UserState }) => {
  const dispatch = useDispatch();
  const resolvedUser = user && typeof user === 'object' ? user : null;
  const customSessionId = getStoredSession().sessionId;

  const presenceBusinessId =
    resolvedUser?.activeBusinessId || resolvedUser?.businessID || resolvedUser?.businessId || null;
  const presenceRole = resolvedUser?.activeRole || resolvedUser?.role || null;
  const presenceConnectionId = useMemo(
    () => getOrCreatePresenceConnectionId(resolvedUser?.uid, customSessionId),
    [customSessionId, resolvedUser?.uid],
  );

  // Permitir selección de texto solo para desarrolladores
  useEffect(() => {
    const isDev = hasDeveloperAccess(resolvedUser);
    document.body.style.userSelect = isDev ? 'auto' : 'none';
    return () => {
      document.body.style.userSelect = '';
    };
  }, [resolvedUser]);

  useTaxReceiptsFix();
  useDeveloperCommands();
  usePersistentDeveloperBusiness();

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting());
  }, [dispatch]);

  useInitializeBillingSettings();

  useLoadUserAbilities();
  useUserDocListener(resolvedUser?.uid);
  useRealtimePresence({
    uid: resolvedUser?.uid,
    connectionId: presenceConnectionId,
    businessId: presenceBusinessId,
    role: presenceRole,
    customSessionId,
  });
  useCurrentCashDrawer();
  useAutoCreateDefaultTaxReceipt();
  useHydrateTaxReceiptSettings();
  useFbTaxReceiptToggleStatus();
  useBusinessDataConfig();
  useBusinessFiscalSync();

  return <NavigationTracker />;
};

export default GlobalListeners;
