import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import {
  THRESHOLD,
  roundToTwoDecimals,
} from '@/firebase/proccessAccountsReceivablePayments/financeUtils';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser, type InvoiceDoc } from './types';

type AccountsReceivablePayment = {
  amount?: number | string;
  totalPaid?: number | string;
  totalAmount?: number | string;
  paymentAmount?: number | string;
} & Record<string, unknown>;

type MonetaryValue = { value?: number | string | null };

const resolveNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const resolveMonetaryValue = (value: unknown): MonetaryValue => {
  if (value && typeof value === 'object' && 'value' in value) {
    return { value: (value as MonetaryValue).value };
  }
  return {};
};

const parseAmountFromPayment = (payment: AccountsReceivablePayment): number => {
  const candidates = [
    payment?.amount,
    payment?.totalPaid,
    payment?.totalAmount,
    payment?.paymentAmount,
  ];

  for (const value of candidates) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && Math.abs(numeric) > 0) {
      return numeric;
    }
  }
  return 0;
};

const collectPaymentsByAccount = async ({
  businessId,
  arIds,
}: {
  businessId: string;
  arIds: string[];
}): Promise<AccountsReceivablePayment[]> => {
  const payments: AccountsReceivablePayment[] = [];

  for (const arId of arIds) {
    const paymentsRef = collection(
      db,
      'businesses',
      businessId,
      'accountsReceivablePayments',
    );
    const paymentsQuery = query(paymentsRef, where('arId', '==', arId));
    const snap = await getDocs(paymentsQuery);
    snap.forEach((docSnap) => payments.push(docSnap.data()));
  }

  return payments;
};

const resolvePaymentStatus = ({
  accumulatedPaid,
  balanceDue,
}: {
  accumulatedPaid: number;
  balanceDue: number;
}): 'unpaid' | 'partial' | 'paid' => {
  if (balanceDue <= THRESHOLD) return 'paid';
  if (accumulatedPaid > 0) return 'partial';
  return 'unpaid';
};

export const syncInvoicePaymentsFromAR = async (
  user: UserIdentity | null | undefined,
  invoiceId: string,
): Promise<{
  arPaid: number;
  posPaid: number;
  accumulatedPaid: number;
  balanceDue: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  totalInvoice: number;
}> => {
  if (!isInvoiceUser(user)) {
    throw new Error('Sin empresa activa para actualizar la factura.');
  }
  if (!invoiceId) {
    throw new Error('Falta el ID de la factura.');
  }

  const invoiceRef = doc(
    db,
    'businesses',
    user.businessID,
    'invoices',
    invoiceId,
  );

  const invoiceSnap = await getDoc(invoiceRef);
  if (!invoiceSnap.exists()) {
    throw new Error('Factura no encontrada.');
  }

  const invoiceData = invoiceSnap.data() as InvoiceDoc;

  const arRef = collection(
    db,
    'businesses',
    user.businessID,
    'accountsReceivable',
  );
  const arQuery = query(arRef, where('invoiceId', '==', invoiceId));
  const arSnap = await getDocs(arQuery);

  if (arSnap.empty) {
    throw new Error('No hay cuentas por cobrar asociadas a esta factura.');
  }

  const arIds = arSnap.docs.map((docSnap) => docSnap.id);

  const payments = await collectPaymentsByAccount({
    businessId: user.businessID,
    arIds,
  });

  if (!payments.length) {
    throw new Error(
      'No se encontraron pagos registrados en cuentas por cobrar.',
    );
  }

  let arPaid = 0;
  payments.forEach((payment) => {
    arPaid += parseAmountFromPayment(payment);
  });
  arPaid = roundToTwoDecimals(arPaid);

  const totalPurchaseInfo = resolveMonetaryValue(
    invoiceData?.data?.totalPurchase ?? invoiceData?.totalPurchase,
  );
  const totalInvoice = roundToTwoDecimals(
    resolveNumber(
      totalPurchaseInfo.value ??
        invoiceData?.data?.totalAmount ??
        invoiceData?.totalAmount ??
        0,
    ),
  );

  // POS snapshot: payment/change represent what was collected at the moment of issuing the invoice.
  // AR payments are handled separately and must never overwrite paymentMethod/payment/change snapshots.
  const paymentInfo = resolveMonetaryValue(invoiceData?.data?.payment);
  const changeInfo = resolveMonetaryValue(invoiceData?.data?.change);
  const paymentGross = resolveNumber(paymentInfo.value);
  const changeGross = resolveNumber(changeInfo.value);
  const posPaid = roundToTwoDecimals(Math.max(0, paymentGross - changeGross));

  const accumulatedPaid = roundToTwoDecimals(posPaid + arPaid);
  const balanceDue = roundToTwoDecimals(
    Math.max(totalInvoice - accumulatedPaid, 0),
  );
  const paymentStatus = resolvePaymentStatus({ accumulatedPaid, balanceDue });

  const batch = writeBatch(db);

  const updatePayload: Record<string, unknown> = {
    accumulatedPaid,
    balanceDue,
    paymentStatus,
    'data.balanceDue': balanceDue,
    'data.accumulatedPaid': accumulatedPaid,
    'data.paymentStatus': paymentStatus,
  };

  const isPreorder =
    invoiceData?.data?.type === 'preorder' ||
    invoiceData?.data?.preorderDetails?.isOrWasPreorder === true;
  if (isPreorder) {
    updatePayload['preorderDetails.paymentStatus'] = paymentStatus;
    updatePayload['data.preorderDetails.paymentStatus'] = paymentStatus;
    updatePayload['preorderDetails.balanceDue'] = balanceDue;
    updatePayload['data.preorderDetails.balanceDue'] = balanceDue;
    updatePayload['preorderDetails.accumulatedPaid'] = accumulatedPaid;
    updatePayload['data.preorderDetails.accumulatedPaid'] = accumulatedPaid;
  }

  batch.update(invoiceRef, updatePayload);
  await batch.commit();

  return {
    arPaid,
    posPaid,
    accumulatedPaid,
    balanceDue,
    paymentStatus,
    totalInvoice,
  };
};
