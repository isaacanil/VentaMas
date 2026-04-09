import {
  faChartPie,
  faCreditCard,
  faFileInvoiceDollar,
  faGear,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { notification } from 'antd';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { SelectSettingCart } from '@/features/cart/cartSlice';
import { selectUser } from '@/features/auth/userSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import type { CartSettings } from '@/features/cart/types';
import { fbBillingSettings } from '@/firebase/billing/billingSetting';
import { withBusinessManagerQuery } from '@/modules/auth/utils/businessManagerRoute';
import { resolveCurrentActiveBusinessId } from '@/modules/auth/utils/businessContext';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_NAME from '@/router/routes/routesName';
import { resolveOwnership } from './subscription.utils';
import { useSubscriptionActions } from './useSubscriptionActions';
import { useSubscriptionData } from './useSubscriptionData';
import {
  SubscriptionTabbedLayout,
  type SubscriptionTabbedLayoutItem,
} from './components/SubscriptionTabbedLayout';

const {
  ACCOUNT_SUBSCRIPTION_MANAGE,
  ACCOUNT_SUBSCRIPTION_PLANS,
  ACCOUNT_SUBSCRIPTION_BILLING,
  ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
  ACCOUNT_SUBSCRIPTION_SETTINGS,
} = ROUTES_NAME.SETTING_TERM;

const NAV_ITEMS: SubscriptionTabbedLayoutItem[] = [
  { path: ACCOUNT_SUBSCRIPTION_MANAGE, label: 'Resumen', icon: faChartPie },
  { path: ACCOUNT_SUBSCRIPTION_PLANS, label: 'Planes', icon: faLayerGroup },
  {
    path: ACCOUNT_SUBSCRIPTION_BILLING,
    label: 'Facturación',
    icon: faFileInvoiceDollar,
  },
  {
    path: ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
    label: 'Métodos de Pago',
    icon: faCreditCard,
  },
  { path: ACCOUNT_SUBSCRIPTION_SETTINGS, label: 'Configuración', icon: faGear },
] as const;

export const SubscriptionLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const business = useSelector(selectBusinessData);
  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const cartSettings = useSelector(SelectSettingCart);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const {
    loading,
    subscription,
    availablePlans,
    providersImplemented,
    limitRows,
    paymentRows,
    handleLoadOverview,
  } = useSubscriptionData(activeBusinessId, business);
  const ownership = resolveOwnership(business, user);
  const canManagePayments =
    ownership.isOwner || ownership.isAdmin || ownership.isPlatformDev;
  const billingSettings: CartSettings['billing'] = cartSettings?.billing || {
    billingMode: 'direct',
    invoiceGenerationTiming: 'first-payment',
    invoiceType: 'template1',
    authorizationFlowEnabled: false,
    enabledAuthorizationModules: {
      invoices: true,
      accountsReceivable: true,
      cashRegister: true,
    },
    subscriptionCheckoutProvider: null,
    isLoading: false,
    isError: null,
  };
  const { loadingAction, handleOpenCheckout, handleOpenPortal } =
    useSubscriptionActions(
      activeBusinessId,
      canManagePayments,
      location.pathname,
      billingSettings,
      providersImplemented,
    );

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(withBusinessManagerQuery(resolveDefaultHomeRoute(user)));
  }, [navigate, user]);

  const handleUpdateBillingSettings = useCallback(
    async (setting: Partial<CartSettings['billing']>) => {
      if (!user) {
        notification.error({
          message: 'Sesión no disponible',
          description: 'No se pudo identificar el usuario actual.',
        });
        return;
      }

      setSettingsSaving(true);
      try {
        await fbBillingSettings.setBillingSettings(user, setting);
        setSettingsSaving(false);
      } catch (error: unknown) {
        notification.error({
          message: 'No se pudieron guardar las preferencias',
          description:
            error instanceof Error ? error.message : 'Error inesperado.',
        });
        setSettingsSaving(false);
      }
    },
    [user],
  );

  return (
    <SubscriptionTabbedLayout
      sectionName="Suscripción"
      onBack={handleBack}
      items={NAV_ITEMS}
    >
      <Outlet
        context={{
          activeBusinessId,
          business,
          user,
          billingSettings,
          canManagePayments,
          loading,
          loadingAction,
          settingsSaving,
          subscription,
          availablePlans,
          providersImplemented,
          limitRows,
          paymentRows,
          handleLoadOverview,
          handleOpenCheckout,
          handleOpenPortal,
          handleUpdateBillingSettings,
        }}
      />
    </SubscriptionTabbedLayout>
  );
};

export default SubscriptionLayout;
