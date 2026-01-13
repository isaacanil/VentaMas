import { message } from 'antd';
import type { CashCountState } from '@/utils/cashCount/types';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { getActiveApprovedAuthorizationForInvoice } from '@/firebase/authorizations/invoiceEditAuthorizations';
import { fbGetCashCountState } from '@/firebase/cashCount/fbCashCountStatus';
import RequestInvoiceEditAuthorization from '@/components/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization';

type AuthorizationRequest = Record<string, unknown>;

type CashCountStatusResult = {
  exists: boolean;
  state: CashCountState | null;
};

type InvoiceEditAuthorizationOptions = {
  invoice?: InvoiceData | null;
  onAuthorized?: (authorization?: AuthorizationRequest | null) => void;
};

type CartSettings = {
  billing?: {
    authorizationFlowEnabled?: boolean;
  };
};

const PRIVILEGED_ROLES = new Set(['admin', 'owner', 'dev', 'manager']);
const MAX_EDIT_WINDOW_SECONDS = 48 * 60 * 60;

const extractTimestampSeconds = (value: unknown) => {
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
  if (typeof value === 'object' && value !== null) {
    const record = value as { seconds?: unknown; toMillis?: unknown };
    if (typeof record.seconds === 'number') {
      return record.seconds;
    }
    if (typeof record.toMillis === 'function') {
      return (record.toMillis as () => number)() / 1000;
    }
  }
  return null;
};

const resolveInvoiceTimestamp = (invoice: InvoiceData | null | undefined) =>
  extractTimestampSeconds(invoice?.date) ??
  extractTimestampSeconds(invoice?.createdAt) ??
  extractTimestampSeconds(invoice?.created_at) ??
  extractTimestampSeconds(invoice?.created);

const buildValidationFailures = ({
  isOlderThan48h,
  hasCashCount,
  cashCountInfo,
}: {
  isOlderThan48h: boolean;
  hasCashCount: boolean;
  cashCountInfo: CashCountStatusResult | null;
}) => {
  const reasons = [];
  if (isOlderThan48h) {
    reasons.push(
      'La factura supera el lÃ­mite de 48 horas para solicitar la ediciÃ³n.',
    );
  }

  if (!hasCashCount) {
    return reasons;
  }

  if (!cashCountInfo) {
    reasons.push(
      'No se pudo verificar el estado del cuadre de caja relacionado.',
    );
    return reasons;
  }

  if (!cashCountInfo.exists) {
    reasons.push('No se encontrÃ³ el cuadre de caja relacionado.');
    return reasons;
  }

  if (cashCountInfo.state && cashCountInfo.state !== 'open') {
    if (cashCountInfo.state === 'closed') {
      reasons.push('El cuadre de caja relacionado ya estÃ¡ cerrado.');
    } else {
      reasons.push('El cuadre de caja relacionado no estÃ¡ abierto.');
    }
  }

  return reasons;
};

const buildRequestReasons = () => [
  'Se requiere autorizaciÃ³n de un supervisor para editar esta factura.',
  'La solicitud serÃ¡ revisada desde la pantalla de autorizaciones.',
];

export const useInvoiceEditAuthorization = ({ invoice, onAuthorized }: InvoiceEditAuthorizationOptions) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const settings = useSelector(SelectSettingCart) as CartSettings | null;
  const authorizationFlowEnabled = Boolean(
    settings?.billing?.authorizationFlowEnabled,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const invoiceSeconds = useMemo(
    () => resolveInvoiceTimestamp(invoice),
    [invoice],
  );
  const isOlderThan48h = useMemo(() => {
    if (!invoiceSeconds) return false;
    return invoiceSeconds < Date.now() / 1000 - MAX_EDIT_WINDOW_SECONDS;
  }, [invoiceSeconds]);

  const proceed = useCallback(
    (authorization?: AuthorizationRequest | null) => {
      if (typeof onAuthorized === 'function') {
        onAuthorized(authorization);
      }
    },
    [onAuthorized],
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
      const cashCountIdRaw = invoice?.cashCountId ?? invoice?.cashCountID ?? null;
      const cashCountId =
        typeof cashCountIdRaw === 'string' && cashCountIdRaw.trim()
          ? cashCountIdRaw
          : null;
      const hasCashCount = Boolean(cashCountId);
      let cashCountInfo: CashCountStatusResult | null = null;

      if (cashCountId && user?.businessID) {
        try {
          cashCountInfo = await fbGetCashCountState(user, cashCountId);
        } catch (statusError) {
          console.warn(
            'No se pudo verificar el estado del cuadre de caja',
            statusError,
          );
          cashCountInfo = null;
        }
      }

      const validationFailures = buildValidationFailures({
        isOlderThan48h,
        hasCashCount,
        cashCountInfo,
      });

      const approved = (await getActiveApprovedAuthorizationForInvoice(
        user,
        invoice,
      )) as AuthorizationRequest | null;
      if (approved) {
        proceed(approved);
        return;
      }

      if (validationFailures.length) {
        message.warning(
          `No puedes solicitar la ediciÃ³n de esta factura. ${validationFailures.join(' ')}`,
        );
        return;
      }

      setReasons(buildRequestReasons());
      setIsModalOpen(true);
    } catch (error) {
      console.error(
        'Error validando autorizaciÃ³n de ediciÃ³n de factura',
        error,
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo validar la autorizaciÃ³n. Intenta nuevamente.';
      message.error(errorMessage);
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

