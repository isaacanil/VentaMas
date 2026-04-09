import { message } from 'antd';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import RequestInvoiceEditAuthorization from '@/components/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization';
import { hasAuthorizationApproveAccess } from '@/utils/access/authorizationAccess';
import {
  MAX_EDIT_WINDOW_SECONDS,
  resolveInvoiceEditAuthorization,
  resolveInvoiceTimestamp,
} from './utils/resolveInvoiceEditAuthorization';

type InvoiceEditAuthorizationOptions = {
  invoice?: InvoiceData | null;
  onAuthorized?: (authorization?: Record<string, unknown> | null) => void;
};

type CartSettings = {
  billing?: {
    authorizationFlowEnabled?: boolean;
  };
};

export const useInvoiceEditAuthorization = ({
  invoice,
  onAuthorized,
}: InvoiceEditAuthorizationOptions) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const settings = useSelector(SelectSettingCart) as CartSettings | null;
  const authorizationFlowEnabled = Boolean(
    settings?.billing?.authorizationFlowEnabled,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const invoiceSeconds = useMemo(() => resolveInvoiceTimestamp(invoice), [invoice]);

  const proceed = useCallback(
    (authorization?: AuthorizationRequest | null) => {
      if (typeof onAuthorized === 'function') {
        onAuthorized(authorization);
      }
    },
    [onAuthorized],
  );

  const handleEdit = useCallback(() => {
    if (!invoice) return;
    const isOlderThan48h = invoiceSeconds
      ? invoiceSeconds < Date.now() / 1000 - MAX_EDIT_WINDOW_SECONDS
      : false;

    if (!authorizationFlowEnabled) {
      proceed();
      return;
    }

    if (hasAuthorizationApproveAccess(user)) {
      proceed();
      return;
    }

    setIsProcessing(true);
    void resolveInvoiceEditAuthorization({
      invoice,
      isOlderThan48h,
      user,
    }).then(
      (result) => {
        if (result.type === 'approved') {
          proceed(result.authorization);
          setIsProcessing(false);
          return;
        }

        if (result.type === 'blocked') {
          message.warning(result.message);
          setIsProcessing(false);
          return;
        }

        setReasons(result.reasons);
        setIsModalOpen(true);
        setIsProcessing(false);
      },
      (error) => {
        console.error(
          'Error validando autorización de edición de factura',
          error,
        );
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo validar la autorización. Intenta nuevamente.';
        message.error(errorMessage);
        setIsProcessing(false);
      },
    );
  }, [invoice, user, proceed, invoiceSeconds, authorizationFlowEnabled]);

  const authorizationModal = authorizationFlowEnabled ? (
    <RequestInvoiceEditAuthorization
      isOpen={isModalOpen}
      setIsOpen={setIsModalOpen}
      invoice={invoice}
      reasons={reasons}
      onRequested={() => undefined}
    />
  ) : null;

  return {
    handleEdit,
    authorizationModal,
    isProcessing,
  };
};

export default useInvoiceEditAuthorization;
