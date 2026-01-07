// @ts-nocheck
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
import { mergePaymentMethods } from '@/firebase/proccessAccountsReceivablePayments/arPaymentUtils';
import { THRESHOLD, roundToTwoDecimals } from '@/firebase/proccessAccountsReceivablePayments/financeUtils';

const parseAmountFromPayment = (payment) => {
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

const collectPaymentsByAccount = async ({ businessId, arIds }) => {
  const payments = [];

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

export const syncInvoicePaymentsFromAR = async (user, invoiceId) => {
  if (!user?.businessID) {
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

  const invoiceData = invoiceSnap.data();

  const arRef = collection(db, 'businesses', user.businessID, 'accountsReceivable');
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
    throw new Error('No se encontraron pagos registrados en cuentas por cobrar.');
  }

  let totalPaid = 0;
  let aggregatedMethods = [];

  payments.forEach((payment) => {
    totalPaid += parseAmountFromPayment(payment);
    aggregatedMethods = mergePaymentMethods(
      aggregatedMethods,
      payment.paymentMethods || payment.paymentMethod || [],
    );
  });

  totalPaid = roundToTwoDecimals(totalPaid);

  const totalInvoice = roundToTwoDecimals(
    Number(
      invoiceData?.data?.totalPurchase?.value ??
        invoiceData?.totalPurchase?.value ??
        invoiceData?.data?.totalAmount ??
        invoiceData?.totalAmount ??
        0,
    ),
  );

  const balanceDue = roundToTwoDecimals(Math.max(totalInvoice - totalPaid, 0));
  const changeValue = roundToTwoDecimals(totalPaid - totalInvoice);
  const isPaid = balanceDue <= THRESHOLD;

  const paymentInfo = invoiceData?.data?.payment || invoiceData?.payment || {};
  const changeInfo = invoiceData?.data?.change || invoiceData?.change || {};

  const batch = writeBatch(db);

  const updatePayload = {
    totalPaid,
    balanceDue,
    status: isPaid,
    payment: { ...paymentInfo, value: totalPaid },
    change: { ...changeInfo, value: changeValue },
    'data.totalPaid': totalPaid,
    'data.balanceDue': balanceDue,
    'data.status': isPaid,
    'data.payment': { ...paymentInfo, value: totalPaid },
    'data.change': { ...changeInfo, value: changeValue },
  };

  if (aggregatedMethods.length > 0) {
    updatePayload.paymentMethod = aggregatedMethods;
    updatePayload['data.paymentMethod'] = aggregatedMethods;
  }

  batch.update(invoiceRef, updatePayload);
  await batch.commit();

  return { totalPaid, balanceDue, paymentMethod: aggregatedMethods, totalInvoice };
};
