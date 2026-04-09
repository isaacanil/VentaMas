import { useCallback, useState } from 'react';

import { autoCompletePreorderInvoice } from '@/services/invoice/autoCompletePreorderInvoice';
import type { UserIdentity } from '@/types/users';

import type {
  AutoCompleteClient,
  AutoCompleteModalState,
  AutoCompleteTarget,
} from '../utils/paymentFormTypes';

type TriggerAutoCompleteOptions = {
  client?: AutoCompleteClient | null;
  ncfType?: string | null;
  taxReceiptEnabled?: boolean;
};

type UseAutoCompletePreorderParams = {
  user: UserIdentity | null;
  taxReceiptEnabled: boolean;
  ncfType: string | null;
  isTestMode: boolean;
};

export const useAutoCompletePreorder = ({
  user,
  taxReceiptEnabled,
  ncfType,
  isTestMode,
}: UseAutoCompletePreorderParams) => {
  const [autoCompleting, setAutoCompleting] = useState(false);
  const [autoCompleteModalState, setAutoCompleteModalState] =
    useState<AutoCompleteModalState | null>(null);

  const resetAutoCompleteState = useCallback(() => {
    setAutoCompleting(false);
    setAutoCompleteModalState(null);
  }, []);

  const triggerAutoCompletePreorder = useCallback(
    async (
      target: AutoCompleteTarget,
      options?: TriggerAutoCompleteOptions,
    ) => {
      if (!user?.businessID || !user?.uid) {
        setAutoCompleteModalState({
          success: false,
          errorCode: null,
          preorderId: target.preorderId,
          arNumber: target.arNumber,
          sourceDocumentLabel: target.sourceDocumentLabel,
          sourceDocumentNumber: target.sourceDocumentNumber,
          paidAmount: target.paidAmount,
          error: 'No se pudo validar el usuario actual para generar la factura.',
        });
        return;
      }

      setAutoCompleting(true);

      try {
        const result = await autoCompletePreorderInvoice({
          businessId: user.businessID,
          userId: user.uid,
          preorderId: target.preorderId,
          client: options?.client ?? null,
          taxReceiptEnabled: Boolean(
            options?.taxReceiptEnabled ?? taxReceiptEnabled,
          ),
          ncfType: options?.ncfType ?? ncfType,
          isTestMode: Boolean(isTestMode),
        });

        if (result.success) {
          setAutoCompleteModalState({
            success: true,
            errorCode: null,
            preorderId: target.preorderId,
            arNumber: target.arNumber,
            sourceDocumentLabel: target.sourceDocumentLabel,
            sourceDocumentNumber: target.sourceDocumentNumber,
            invoiceId: result.invoiceId,
            invoiceNumber: result.invoice?.numberID ?? null,
            invoiceNcf:
              typeof result.invoice?.NCF === 'string' ? result.invoice.NCF : null,
            paidAmount: target.paidAmount,
            invoice: result.invoice ?? null,
          });
        } else {
          setAutoCompleteModalState({
            success: false,
            errorCode: result.errorCode ?? null,
            preorderId: target.preorderId,
            arNumber: target.arNumber,
            sourceDocumentLabel: target.sourceDocumentLabel,
            sourceDocumentNumber: target.sourceDocumentNumber,
            paidAmount: target.paidAmount,
            error:
              result.error ||
              'Puedes completar la preventa manualmente desde la lista de preventas.',
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setAutoCompleteModalState({
          success: false,
          errorCode: null,
          preorderId: target.preorderId,
          arNumber: target.arNumber,
          sourceDocumentLabel: target.sourceDocumentLabel,
          sourceDocumentNumber: target.sourceDocumentNumber,
          paidAmount: target.paidAmount,
          error: `${errorMessage}. Puedes completarla manualmente.`,
        });
      } finally {
        setAutoCompleting(false);
      }
    },
    [user, taxReceiptEnabled, ncfType, isTestMode],
  );

  return {
    autoCompleting,
    autoCompleteModalState,
    resetAutoCompleteState,
    triggerAutoCompletePreorder,
  };
};
