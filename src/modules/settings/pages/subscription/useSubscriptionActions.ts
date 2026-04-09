import { useCallback, useState } from 'react';
import { notification } from 'antd';

import {
  requestBillingPortalUrl,
  requestSubscriptionCheckoutUrl,
} from '@/firebase/billing/subscriptionPortal';
import type { CartSettings } from '@/features/cart/types';
import { isSameOriginCheckoutProxyUrl } from './subscription.utils';
import type { ActionKey } from './subscription.types';

export const useSubscriptionActions = (
  activeBusinessId: string | null,
  canManagePayments: boolean,
  currentPathname: string,
  _billingSettings?: CartSettings['billing'] | null,
  _providersImplemented?: string[] | null,
) => {
  const [loadingAction, setLoadingAction] = useState<ActionKey>(null);

  const openExternalUrl = useCallback((url: string) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const openCheckoutUrl = useCallback((url: string) => {
    if (typeof window === 'undefined') return;
    if (isSameOriginCheckoutProxyUrl(url, window.location.origin)) {
      window.location.assign(url);
      return;
    }
    openExternalUrl(url);
  }, [openExternalUrl]);

  const handleOpenCheckout = useCallback(async (planCode?: string | null) => {
    if (!canManagePayments) {
      notification.warning({
        message: 'Acceso restringido',
        description: 'Solo owner/admin puede ejecutar pagos.',
      });
      return false;
    }
    if (!activeBusinessId) {
      notification.error({
        message: 'Negocio no disponible',
        description: 'No se pudo resolver el negocio activo.',
      });
      return false;
    }
    setLoadingAction('checkout');
    try {
      const url = await requestSubscriptionCheckoutUrl(
        activeBusinessId,
        currentPathname,
        planCode,
      );
      openCheckoutUrl(url);
      return true;
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo abrir checkout',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
      return false;
    } finally {
      setLoadingAction(null);
    }
  }, [
    activeBusinessId,
    canManagePayments,
    currentPathname,
    openCheckoutUrl,
  ]);

  const handleOpenPortal = useCallback(async () => {
    if (!canManagePayments) {
      notification.warning({
        message: 'Acceso restringido',
        description: 'Solo owner/admin puede administrar facturación.',
      });
      return false;
    }
    if (!activeBusinessId) {
      notification.error({
        message: 'Negocio no disponible',
        description: 'No se pudo resolver el negocio activo.',
      });
      return false;
    }
    setLoadingAction('portal');
    try {
      const url = await requestBillingPortalUrl(
        activeBusinessId,
        currentPathname,
      );
      openExternalUrl(url);
      return true;
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo abrir el portal',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
      return false;
    } finally {
      setLoadingAction(null);
    }
  }, [
    activeBusinessId,
    canManagePayments,
    currentPathname,
    openExternalUrl,
  ]);

  return { loadingAction, handleOpenCheckout, handleOpenPortal };
};
