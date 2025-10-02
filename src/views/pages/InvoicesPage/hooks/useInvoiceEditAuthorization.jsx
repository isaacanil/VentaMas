import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
import { getActiveApprovedAuthorizationForInvoice, markAuthorizationUsed } from '../../../../firebase/authorizations/invoiceEditAuthorizations';
import { fbCashCountStatus } from '../../../../firebase/cashCount/fbCashCountStatus';
import RequestInvoiceEditAuthorization from '../../../component/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization';

const PRIVILEGED_ROLES = new Set(['admin', 'owner', 'dev', 'manager']);
const SECONDS_IN_DAY = 86400;

const extractTimestampSeconds = (value) => {
  if (!value) return null;
  if (typeof value === 'number') {
    // Si el valor es muy grande asumimos que ya está en milisegundos
    return value > 1e12 ? value / 1000 : value;
  }
  if (value instanceof Date) {
    return value.getTime() / 1000;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds;
  }
  return null;
};

const buildReasons = ({ isOlderThan24h, cashCountOpen }) => {
  const reasons = [];
  if (isOlderThan24h) {
    reasons.push('La factura tiene más de 24 horas.');
  }
  if (cashCountOpen === false) {
    reasons.push('El cuadre de caja relacionado no está abierto.');
  }
  if (cashCountOpen === null) {
    reasons.push('No se encontró el cuadre de caja relacionado.');
  }
  if (!reasons.length) {
    reasons.push('Se requiere autorización de un supervisor para editar esta factura.');
  }
  return reasons;
};

export const useInvoiceEditAuthorization = ({ invoice, onAuthorized }) => {
  const user = useSelector(selectUser);
  const settings = useSelector(SelectSettingCart) || {};
  const authorizationFlowEnabled = Boolean(settings?.billing?.authorizationFlowEnabled);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const seconds = useMemo(() => extractTimestampSeconds(invoice?.date), [invoice?.date]);
  const isOlderThan24h = useMemo(() => {
    if (!seconds) return false;
    return seconds < (Date.now() / 1000) - SECONDS_IN_DAY;
  }, [seconds]);

  const proceed = useCallback(() => {
    if (typeof onAuthorized === 'function') {
      onAuthorized();
    }
  }, [onAuthorized]);

  const handleEdit = useCallback(async () => {
    if (!invoice) return;

    if (!authorizationFlowEnabled) {
      proceed();
      return;
    }

    if (PRIVILEGED_ROLES.has(user?.role)) {
      proceed();
      return;
    }

    setIsProcessing(true);
    try {
      let cashCountOpen = null;
      if (invoice?.cashCountId && user?.businessID) {
        try {
          cashCountOpen = await fbCashCountStatus(user, invoice.cashCountId, 'open');
        } catch (statusError) {
          console.warn('No se pudo verificar el estado del cuadre de caja', statusError);
          cashCountOpen = null;
        }
      }

      if (!isOlderThan24h && cashCountOpen) {
        proceed();
        return;
      }

      const approved = await getActiveApprovedAuthorizationForInvoice(user, invoice);
      if (approved) {
        try {
          await markAuthorizationUsed(user, approved.id, user);
        } catch (markError) {
          console.warn('No se pudo marcar la autorización como usada', markError);
        }
        proceed();
        return;
      }

      setReasons(buildReasons({ isOlderThan24h, cashCountOpen }));
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error validando autorización de edición de factura', error);
      message.error(error?.message || 'No se pudo validar la autorización. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  }, [invoice, user, proceed, isOlderThan24h, authorizationFlowEnabled]);

  useEffect(() => {
    if (!authorizationFlowEnabled && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [authorizationFlowEnabled, isModalOpen]);

  const authorizationModal = authorizationFlowEnabled ? (
    <RequestInvoiceEditAuthorization
      isOpen={isModalOpen}
      setIsOpen={setIsModalOpen}
      invoice={invoice}
      reasons={reasons}
      onRequested={() => {}}
    />
  ) : null;

  return {
    handleEdit,
    authorizationModal,
    isProcessing,
  };
};

export default useInvoiceEditAuthorization;
