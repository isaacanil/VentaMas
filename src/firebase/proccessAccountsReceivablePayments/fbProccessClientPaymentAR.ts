import { fbConsumeCreditNotes } from '@/firebase/creditNotes/fbConsumeCreditNotes';
import type { UserWithBusiness } from '@/types/users';

import { fbApplyPartialPaymentToAccount } from './fbApplyPartialPaymentToAccount';
import { fbPayActiveInstallmentForAccount } from './fbPayActiveInstallmentForAccount';
import { fbPayAllInstallmentsForAccount } from './fbPayAllInstallmentsForAccount';
import { fbPayBalanceForAccounts } from './fbPayBalanceForAccounts';
import type { PaymentDetails } from './arPaymentUtils';

type PaymentReceipt =
  | Awaited<ReturnType<typeof fbPayBalanceForAccounts>>
  | Awaited<ReturnType<typeof fbPayActiveInstallmentForAccount>>
  | Awaited<ReturnType<typeof fbPayAllInstallmentsForAccount>>
  | Awaited<ReturnType<typeof fbApplyPartialPaymentToAccount>>;

export const fbProcessClientPaymentAR = async (
  user: UserWithBusiness,
  paymentDetails: PaymentDetails & {
    paymentScope: 'balance' | 'account';
    paymentOption?: 'installment' | 'balance' | 'partial';
    clientId: string;
    totalAmount?: number | string;
  },
  callback: (receipt: PaymentReceipt) => void,
): Promise<PaymentReceipt> => {
  const { paymentScope, paymentOption, clientId, totalAmount, paymentMethods } =
    paymentDetails;

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

  const paymentPayload = { user, paymentDetails };

  try {
    let receipt: PaymentReceipt;
    if (paymentScope === 'balance') {
      receipt = await fbPayBalanceForAccounts(paymentPayload);
    } else if (paymentScope === 'account') {
      switch (paymentOption) {
        case 'installment':
          receipt = await fbPayActiveInstallmentForAccount(paymentPayload);
          break;
        case 'balance':
          receipt = await fbPayAllInstallmentsForAccount(paymentPayload);
          break;
        case 'partial':
          receipt = await fbApplyPartialPaymentToAccount(paymentPayload);
          break;
        default:
          throw new Error('Invalid payment option.');
      }
    } else {
      throw new Error('Invalid payment scope.');
    }
    // Consumir notas de crédito si se aplicaron
    if (paymentDetails?.creditNotePayment?.length > 0) {
      try {
        // Para AR payments quizás no haya una sola factura; usaremos el primer invoiceId del receipt si existe
        const firstInvoiceId = receipt?.accounts?.[0]?.invoiceId || null;
        await fbConsumeCreditNotes(
          user,
          paymentDetails.creditNotePayment,
          firstInvoiceId,
          {
            source: 'AR_PAYMENT',
          },
        );
      } catch (e) {
        console.error('Error consuming credit notes in AR payment:', e);
      }
    }

    callback(receipt);
    return receipt;
  } catch (error) {
    const errorInfo =
      error && typeof error === 'object'
        ? (error as {
            message?: string;
            stack?: string;
            code?: string;
            details?: unknown;
          })
        : {};
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
    throw error; // Re-throw the error after logging it
  }
};
