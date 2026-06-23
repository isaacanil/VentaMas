import { httpsCallable } from 'firebase/functions';
import { nanoid } from 'nanoid';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { CreditNotePayment as CreditNotePaymentInput } from '@/types/creditNote';
import type { UserWithBusiness } from '@/types/users';
import {
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
import type { PaymentDetails, UserWithBusinessAndUid } from './arPaymentUtils';

type PaymentReceipt = {
  accounts?: Array<{
    invoiceId?: string | number | null;
    arBalance?: number;
  }>;
  [key: string]: unknown;
};

type ProcessAccountsReceivablePaymentDetails = Omit<
  PaymentDetails,
  'creditNotePayment'
> & {
  paymentScope: 'balance' | 'account';
  paymentOption?: 'installment' | 'balance' | 'partial';
  clientId: string;
  totalAmount?: number | string;
  creditNotePayment?: CreditNotePaymentInput[];
};

type ProcessAccountsReceivablePaymentResponse = {
  ok?: boolean;
  receipt?: PaymentReceipt;
  creditNoteApplicationIds?: string[];
};

type ProcessClientPaymentOptions = {
  idempotencyKey?: string;
};

const sanitizeCallableErrorMessage = (value: unknown): string => {
  if (typeof value !== 'string') {
    return 'No se pudo procesar el cobro.';
  }

  const sanitized = value
    .replace(/^functions\/[a-z-]+:\s*/i, '')
    .replace(/^firebase:\s*/i, '')
    .trim();

  return sanitized || 'No se pudo procesar el cobro.';
};

const normalizePaymentProcessingError = (error: unknown): Error => {
  const errorInfo =
    error && typeof error === 'object'
      ? (error as {
          message?: string;
          code?: string;
          details?: unknown;
          stack?: string;
        })
      : {};
  const message = sanitizeCallableErrorMessage(errorInfo.message);

  return Object.assign(new Error(message), errorInfo, {
    message,
    originalError: error,
  });
};

const hasUserUid = (value: UserWithBusiness): value is UserWithBusinessAndUid =>
  typeof value.uid === 'string' && value.uid.trim().length > 0;

const resolveArId = (details: PaymentDetails): string => {
  const arId = details.arId;
  if (typeof arId === 'string' && arId.trim().length > 0) {
    return arId;
  }
  throw new Error('arId requerido para este tipo de pago.');
};

const resolveTotalAmount = (details: PaymentDetails): number | string => {
  if (details.totalAmount !== undefined && details.totalAmount !== null) {
    return details.totalAmount;
  }
  return details.totalPaid;
};

const normalizeCreditNotePayments = (
  creditNotes: PaymentDetails['creditNotePayment'],
): CreditNotePaymentInput[] => {
  if (!Array.isArray(creditNotes)) return [];

  return creditNotes
    .map((note) => {
      const rawId = note?.id;
      const id =
        typeof rawId === 'string' || typeof rawId === 'number'
          ? String(rawId)
          : '';
      if (!id) return null;

      const amountCandidate = Number(note.amountUsed);

      const payment: CreditNotePaymentInput = {
        id,
        amountUsed: Number.isFinite(amountCandidate) ? amountCandidate : 0,
      };
      if (typeof note.ncf === 'string') {
        payment.ncf = note.ncf;
      }
      if (
        typeof (note as { originalAmount?: unknown }).originalAmount ===
        'number'
      ) {
        payment.originalAmount = (note as { originalAmount: number }).originalAmount;
      }
      return payment;
    })
    .filter((note): note is CreditNotePaymentInput => note !== null);
};

const assertBackendConfirmedCreditNoteApplications = ({
  requestedCreditNotes,
  applicationIds,
}: {
  requestedCreditNotes: CreditNotePaymentInput[];
  applicationIds: unknown;
}) => {
  if (!requestedCreditNotes.length) return;

  const confirmedApplicationIds = Array.isArray(applicationIds)
    ? applicationIds.filter(
        (applicationId): applicationId is string =>
          typeof applicationId === 'string' && applicationId.trim().length > 0,
      )
    : [];

  if (confirmedApplicationIds.length >= requestedCreditNotes.length) {
    return;
  }

  throw new Error(
    'El cobro fue confirmado, pero no se pudo verificar la aplicación de las notas de crédito. Reabra la cuenta y confirme si la nota quedó aplicada antes de registrar otro cobro; si no aparece aplicada, escale el pago para conciliación manual.',
  );
};

export const fbProcessClientPaymentAR = async (
  user: UserWithBusiness,
  paymentDetails: PaymentDetails & {
    paymentScope: 'balance' | 'account';
    paymentOption?: 'installment' | 'balance' | 'partial';
    clientId: string;
    totalAmount?: number | string;
  },
  callback: (receipt: PaymentReceipt) => void,
  options: ProcessClientPaymentOptions = {},
): Promise<PaymentReceipt> => {
  const { paymentScope, paymentOption, clientId, totalAmount, paymentMethods } =
    paymentDetails;
  const idempotencyKey = options.idempotencyKey || nanoid(21);

  // Debug logging para ver qué datos llegan
  console.log('🔍 Debug - Processing AR payment with details:', {
    paymentScope,
    paymentOption,
    clientId,
    totalAmount,
    paymentMethodsLength: paymentMethods?.length,
    arId: paymentDetails.arId,
    totalPaid: paymentDetails.totalPaid,
    hasCreditNotes: paymentDetails.creditNotePayment?.length > 0,
  });

  try {
    if (paymentScope !== 'balance' && paymentScope !== 'account') {
      throw new Error('Invalid payment scope.');
    }
    if (paymentScope === 'account' && paymentOption === 'installment' && !hasUserUid(user)) {
      throw new Error('Usuario sin uid para pago por cuota.');
    }

    const resolvedMonetary = await resolveMonetarySnapshotForBusiness({
      businessId: user.businessID,
      monetary: paymentDetails.monetary,
      source: paymentDetails,
      totals: {
        total: resolveTotalAmount(paymentDetails),
        paid: paymentDetails.totalPaid,
        balance: 0,
      },
      capturedBy: hasUserUid(user) ? user.uid : null,
    });
    const creditNotesToApply = normalizeCreditNotePayments(
      paymentDetails.creditNotePayment,
    );

    const { sessionToken } = getStoredSession();
    const processAccountsReceivablePaymentCallable = httpsCallable<
      {
        businessId: string;
        idempotencyKey: string;
        paymentDetails: ProcessAccountsReceivablePaymentDetails;
        sessionToken?: string;
      },
      ProcessAccountsReceivablePaymentResponse
    >(functions, 'processAccountsReceivablePayment');

    const response = await processAccountsReceivablePaymentCallable({
      businessId: user.businessID,
      idempotencyKey,
      paymentDetails: {
        ...paymentDetails,
        monetary: resolvedMonetary,
        creditNotePayment: creditNotesToApply,
        ...(paymentScope === 'account'
          ? {
              arId: resolveArId(paymentDetails),
              totalAmount: resolveTotalAmount(paymentDetails),
            }
          : {}),
      },
      ...(sessionToken ? { sessionToken } : {}),
    });
    const receipt = response.data?.receipt;
    if (!receipt) {
      throw new Error('No se recibio comprobante del backend.');
    }

    assertBackendConfirmedCreditNoteApplications({
      requestedCreditNotes: creditNotesToApply,
      applicationIds: response.data?.creditNoteApplicationIds,
    });

    callback(receipt);
    return receipt;
  } catch (error) {
    const normalizedError = normalizePaymentProcessingError(error);
    const errorInfo =
      normalizedError as Error & {
        stack?: string;
        code?: string;
        details?: unknown;
      };
    console.error('❌ Error processing AR payment:', {
      error: errorInfo.message ?? String(error),
      stack: errorInfo.stack,
      paymentScope,
      paymentOption,
      clientId,
      arId: paymentDetails.arId,
      totalPaid: paymentDetails.totalPaid,
      errorCode: errorInfo.code,
      errorDetails: errorInfo.details,
    });
    throw normalizedError;
  }
};
