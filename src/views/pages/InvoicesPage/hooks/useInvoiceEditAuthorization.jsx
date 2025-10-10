import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
import { getActiveApprovedAuthorizationForInvoice } from '../../../../firebase/authorizations/invoiceEditAuthorizations';
import { fbGetCashCountState } from '../../../../firebase/cashCount/fbCashCountStatus';
import RequestInvoiceEditAuthorization from '../../../component/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization';

const PRIVILEGED_ROLES = new Set(['admin', 'owner', 'dev', 'manager']);
const MAX_EDIT_WINDOW_SECONDS = 48 * 60 * 60;

const extractTimestampSeconds = (value) => {
  if (!value) return null;
  if (typeof value === 'number') {
    return value > 1e12 ? value / 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed > 1e12 ? parsed / 1000 : parsed;
  }
  if (value instanceof Date) {
    return value.getTime() / 1000;
  }
  if (typeof value === 'object') {
    if (typeof value.seconds === 'number') {
      return value.seconds;
    }
    if (typeof value.toMillis === 'function') {
      return value.toMillis() / 1000;
    }
  }
  return null;
};

const resolveInvoiceTimestamp = (invoice) => (
  extractTimestampSeconds(invoice?.date) ??
  extractTimestampSeconds(invoice?.createdAt) ??
  extractTimestampSeconds(invoice?.created_at) ??
  extractTimestampSeconds(invoice?.created)
);

const buildValidationFailures = ({ isOlderThan48h, hasCashCount, cashCountInfo }) => {
  const reasons = [];
  if (isOlderThan48h) {
    reasons.push('La factura supera el límite de 48 horas para solicitar la edición.');
  }

  if (!hasCashCount) {
    return reasons;
  }

  if (!cashCountInfo) {
    reasons.push('No se pudo verificar el estado del cuadre de caja relacionado.');
    return reasons;
  }

  if (!cashCountInfo.exists) {
    reasons.push('No se encontró el cuadre de caja relacionado.');
    return reasons;
  }

  if (cashCountInfo.state && cashCountInfo.state !== 'open') {
    if (cashCountInfo.state === 'closed') {
      reasons.push('El cuadre de caja relacionado ya está cerrado.');
    } else {
      reasons.push('El cuadre de caja relacionado no está abierto.');
    }
  }

  return reasons;
};

const buildRequestReasons = () => [
  'Se requiere autorización de un supervisor para editar esta factura.',
  'La solicitud será revisada desde la pantalla de autorizaciones.',
];

export const useInvoiceEditAuthorization = ({ invoice, onAuthorized }) => {
  const user = useSelector(selectUser);
  const settings = useSelector(SelectSettingCart) || {};
  const authorizationFlowEnabled = Boolean(settings?.billing?.authorizationFlowEnabled);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const invoiceSeconds = useMemo(() => resolveInvoiceTimestamp(invoice), [invoice]);
  const isOlderThan48h = useMemo(() => {
    if (!invoiceSeconds) return false;
    return invoiceSeconds < (Date.now() / 1000) - MAX_EDIT_WINDOW_SECONDS;
  }, [invoiceSeconds]);

  const proceed = useCallback(
    (authorization) => {
      if (typeof onAuthorized === 'function') {
        onAuthorized(authorization);
      }
    },
    [onAuthorized]
  );

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
      const cashCountId = invoice?.cashCountId ?? invoice?.cashCountID ?? null;
      const hasCashCount = Boolean(cashCountId);
      let cashCountInfo = null;

      if (hasCashCount && user?.businessID) {
        try {
          cashCountInfo = await fbGetCashCountState(user, cashCountId);
        } catch (statusError) {
          console.warn('No se pudo verificar el estado del cuadre de caja', statusError);
          cashCountInfo = null;
        }
      }

      const validationFailures = buildValidationFailures({
        isOlderThan48h,
        hasCashCount,
        cashCountInfo,
      });

      const approved = await getActiveApprovedAuthorizationForInvoice(user, invoice);
      if (approved) {
        proceed(approved);
        return;
      }

      if (validationFailures.length) {
        message.warning(`No puedes solicitar la edición de esta factura. ${validationFailures.join(' ')}`);
        return;
      }

      setReasons(buildRequestReasons());
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error validando autorización de edición de factura', error);
      message.error(error?.message || 'No se pudo validar la autorización. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  }, [invoice, user, proceed, isOlderThan48h, authorizationFlowEnabled]);

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
