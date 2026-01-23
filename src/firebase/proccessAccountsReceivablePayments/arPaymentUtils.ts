import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import type { Transaction, WriteBatch } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { defaultInstallmentPaymentsAR } from '@/schema/accountsReceivable/installmentPaymentsAR';
import { defaultPaymentsAR } from '@/schema/accountsReceivable/paymentAR';
import type { InvoiceCreditNote, InvoiceData, InvoiceFirestoreDoc, InvoicePaymentMethod } from '@/types/invoice';
import type { UserWithBusiness } from '@/types/users';

import { THRESHOLD, roundToTwoDecimals } from './financeUtils';

export type FirestoreWriter = WriteBatch | Transaction;
type FirestoreData = Record<string, unknown>;
export type FirestoreDoc<T extends FirestoreData = FirestoreData> = T & { id: string };
export type UserWithBusinessAndUid = UserWithBusiness & { uid: string };

export interface AccountsReceivableInstallment extends FirestoreData {
  id: string;
  installmentBalance: number;
  installmentNumber?: number | string;
  installmentDate?: unknown;
  isActive?: boolean;
}

export interface AccountsReceivableAccount extends FirestoreData {
  id?: string;
  numberId?: string | number;
  invoiceId?: string | null;
  invoiceNumber?: string | number | null;
  totalInstallments?: number;
  paidInstallments?: string[];
  arBalance: number;
  isActive?: boolean;
  isClosed?: boolean;
}

export type CreditNotePayment = InvoiceCreditNote & { amountToUse?: number };

export interface PaymentDetails {
  totalPaid: number;
  paymentMethods: InvoicePaymentMethod[];
  comments?: string;
  clientId?: string | null;
  arId?: string | null;
  originType?: string | null;
  originId?: string | null;
  preorderId?: string | null;
  originStage?: string | null;
  createdFrom?: string | null;
  totalAmount?: number | string;
  creditNotePayment?: CreditNotePayment[];
}

export type InvoiceDataWithTotals = InvoiceData & {
  totalAmount?: number;
  totalPaid?: number;
  accumulatedPaid?: number;
  balanceDue?: number;
  paymentHistory?: Array<Record<string, unknown>>;
};

export type InvoiceLike = (InvoiceFirestoreDoc & { data?: InvoiceData }) | InvoiceData;

/**
 * Obtiene una cuenta por cobrar por su ID.
 */
export const getAccountReceivableById = async (
  businessId: string,
  arId: string,
): Promise<AccountsReceivableAccount> => {
  const accountRef = doc(
    db,
    'businesses',
    businessId,
    'accountsReceivable',
    arId,
  );
  const accountDoc = await getDoc(accountRef);
  if (!accountDoc.exists()) {
    throw new Error(`Account with ID ${arId} not found.`);
  }
  return accountDoc.data() as AccountsReceivableAccount;
};

/**
 * Obtiene todas las cuotas (activas o no) de una cuenta, ordenadas por fecha.
 * @param {string} businessId - ID del negocio
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Promise<Array>} Lista de cuotas con id y datos
 */
export const getAllInstallmentsByArId = async (
  businessId: string,
  arId: string,
): Promise<FirestoreDoc<AccountsReceivableInstallment>[]> => {
  const installmentsRef = collection(
    db,
    'businesses',
    businessId,
    'accountsReceivableInstallments',
  );
  const q = query(
    installmentsRef,
    where('arId', '==', arId),
    orderBy('installmentDate', 'asc'),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as AccountsReceivableInstallment),
  }));
};

/**
 * Obtiene cuotas activas de una cuenta, ordenadas por fecha
 * @param {Object} user - Usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Promise<Array>} Lista de cuotas activas
 */
export const getActiveInstallmentsByArId = async (
  user: UserWithBusiness,
  arId: string,
): Promise<FirestoreDoc<AccountsReceivableInstallment>[]> => {
  const installmentsRef = collection(
    db,
    'businesses',
    user.businessID,
    'accountsReceivableInstallments',
  );
  const q = query(
    installmentsRef,
    where('arId', '==', arId),
    where('isActive', '==', true),
    orderBy('installmentDate', 'asc'),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as AccountsReceivableInstallment),
  }));
};

/**
 * Obtiene todas las cuotas de una cuenta (para compatibilidad con código existente)
 * @param {Object} user - Usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Promise<Array>} Lista de todas las cuotas
 */
export const getInstallmentsByArId = async (
  user: UserWithBusiness,
  arId: string,
): Promise<FirestoreDoc<AccountsReceivableInstallment>[]> => {
  return await getAllInstallmentsByArId(user.businessID, arId);
};

/**
 * Crea el registro principal del pago (accountsReceivablePayments).
 * @param {object} writer - El objeto de transacción o batch de Firestore.
 * @returns {string} El ID del nuevo pago.
 */
export const createPaymentRecord = (
  writer: FirestoreWriter,
  { user, paymentDetails }: { user: UserWithBusiness; paymentDetails: PaymentDetails },
): string => {
  const {
    totalPaid,
    paymentMethods,
    comments,
    clientId,
    arId,
    originType,
    originId,
    preorderId,
    originStage,
    createdFrom,
  } = paymentDetails;
  const paymentId = nanoid();
  const paymentsRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivablePayments',
    paymentId,
  );

  const paymentData = {
    ...defaultPaymentsAR,
    id: paymentId,
    paymentMethods,
    paymentMethod: paymentMethods, // alias para compatibilidad con UI
    amount: totalPaid, // alias para listas de historial
    date: Timestamp.now(), // alias para UI que usa "date"
    arId: arId || null,
    totalPaid,
    clientId,
    comments,
    originType,
    originId,
    preorderId,
    originStage,
    createdFrom,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdUserId: user?.uid,
    updatedUserId: user?.uid,
    isActive: true,
  };

  writer.set(paymentsRef, paymentData);
  return paymentId;
};


/**
 * Aplica un monto a una cuota específica, actualizando su saldo y creando un registro de pago de cuota.
 * @param {object} writer - El objeto de transacción o batch de Firestore.
 */
export const applyPaymentToInstallment = (
  writer: FirestoreWriter,
  {
    user,
    installment,
    amountToApply,
    paymentId,
    clientId,
    arId,
  }: {
    user: UserWithBusinessAndUid;
    installment: AccountsReceivableInstallment;
    amountToApply: number;
    paymentId: string;
    clientId?: string | null;
    arId?: string | null;
  },
): { newInstallmentBalance: number } => {
  const newInstallmentBalance = roundToTwoDecimals(
    installment.installmentBalance - amountToApply,
  );

  // Actualiza la cuota
  const installmentRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivableInstallments',
    installment.id,
  );
  writer.update(installmentRef, {
    installmentBalance: newInstallmentBalance,
    isActive: newInstallmentBalance > THRESHOLD,
  });

  // Crea el registro del pago de la cuota
  const installmentPaymentRef = doc(
    collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallmentPayments',
    ),
  );
  writer.set(installmentPaymentRef, {
    ...defaultInstallmentPaymentsAR,
    id: installmentPaymentRef.id, // Firestore asigna el ID
    installmentId: installment.id,
    paymentId,
    paymentAmount: roundToTwoDecimals(amountToApply),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: user.uid,
    updatedBy: user.uid,
    isActive: true,
    clientId,
    arId,
  });

  return { newInstallmentBalance };
};

/**
 * Actualiza el estado de la cuenta por cobrar principal después de un pago.
 * @param {object} writer - El objeto de transacción o batch de Firestore.
 */
export const updateAccountReceivableState = (
  writer: FirestoreWriter,
  {
    businessId,
    arId,
    totalPaid,
    newArBalance,
    paidInstallmentIds,
    existingPaidInstallments = [],
  }: {
    businessId: string;
    arId: string;
    totalPaid: number;
    newArBalance: number;
    paidInstallmentIds: string[];
    existingPaidInstallments?: string[];
  },
): void => {
  const arRef = doc(db, 'businesses', businessId, 'accountsReceivable', arId);
  const allPaidInstallments = [
    ...new Set([...existingPaidInstallments, ...paidInstallmentIds]),
  ];

  writer.update(arRef, {
    arBalance: newArBalance,
    lastPaymentDate: Timestamp.now(),
    lastPayment: totalPaid,
    isActive: newArBalance > THRESHOLD,
    isClosed: newArBalance <= THRESHOLD,
    paidInstallments: allPaidInstallments,
  });
};

/**
 * Actualiza los totales y el estado de la factura relacionada.
 * @param {object} writer - El objeto de transacción o batch de Firestore.
 */
export const updateInvoiceOnPayment = async (
  writer: FirestoreWriter,
  {
    businessId,
    invoiceId,
    amountPaid,
  }: { businessId: string; invoiceId?: string | null; amountPaid: number },
): Promise<InvoiceDataWithTotals | null> => {
  if (!invoiceId) return null;

  const invoiceRef = doc(db, 'businesses', businessId, 'invoices', invoiceId);
  // Nota: runTransaction permite lecturas, pero si usamos batch, la factura debe leerse antes.
  // Para simplificar, asumimos que se puede leer dentro de una transacción o se ha leído antes para un batch.
  const invoiceDoc = await getDoc(invoiceRef); // Esta lectura es segura dentro de una transacción
  if (!invoiceDoc.exists()) {
    console.warn(`Invoice ${invoiceId} not found during payment update.`);
    return null;
  }

  const invoiceData = invoiceDoc.data() as InvoiceDataWithTotals;
  const newTotalPaid = roundToTwoDecimals(
    (invoiceData.totalPaid || 0) + amountPaid,
  );
  const newBalanceDue = roundToTwoDecimals(
    invoiceData.totalAmount - newTotalPaid,
  );

  writer.update(invoiceRef, {
    totalPaid: newTotalPaid,
    balanceDue: newBalanceDue,
    status: newBalanceDue <= THRESHOLD ? 'paid' : 'partial', // o el estado que corresponda
  });
  return { ...invoiceData, totalPaid: newTotalPaid, balanceDue: newBalanceDue };
};

/**
 * Obtiene una cuenta específica por su ID (similar a getClientAccountById en los archivos originales)
 * @param {Object} user - Objeto usuario con businessID
 * @param {string} accountId - ID de la cuenta
 * @returns {Object|null} Datos de la cuenta o null si no existe
 */
export const getClientAccountById = async (
  user: UserWithBusiness,
  accountId: string,
): Promise<FirestoreDoc<AccountsReceivableAccount> | null> => {
  try {
    const accountRef = doc(
      db,
      'businesses',
      user.businessID,
      'accountsReceivable',
      accountId,
    );
    const accountDoc = await getDoc(accountRef);
    if (accountDoc.exists()) {
      return {
        id: accountDoc.id,
        ...(accountDoc.data() as AccountsReceivableAccount),
      };
    } else {
      console.log('No account found with the specified ID.');
      return null;
    }
  } catch (error) {
    console.error('Error getting client account by ID:', error);
    throw error;
  }
};

/**
 * Obtiene la cuota activa más antigua de una cuenta específica
 * @param {Object} user - Objeto usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Object|null} Cuota activa más antigua o null
 */
export const getOldestActiveInstallmentByArId = async (
  user: UserWithBusiness,
  arId: string,
): Promise<FirestoreDoc<AccountsReceivableInstallment> | undefined> => {
  try {
    const installmentsRef = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallments',
    );
    const q = query(
      installmentsRef,
      where('arId', '==', arId),
      where('isActive', '==', true),
      orderBy('installmentDate', 'asc'),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as AccountsReceivableInstallment),
    }))[0];
  } catch (error) {
    console.error('Error getting oldest active installment by AR ID:', error);
    throw error;
  }
};

/**
 * Valida que los montos de pago sean correctos
 * @param {Object} paymentDetails - Detalles del pago
 * @returns {Object} Resultado de la validación { isValid, error, amounts }
 */
export const validatePaymentAmounts = (
  paymentDetails: Pick<
    PaymentDetails,
    'totalAmount' | 'totalPaid' | 'creditNotePayment'
  >,
): {
  isValid: boolean;
  error: string | null;
  amounts: {
    paymentAmountFloat: number;
    totalPaidFloat: number;
    creditNoteTotal: number;
    totalPaymentAndCredit?: number;
  };
} => {
  const { totalAmount, totalPaid, creditNotePayment = [] } = paymentDetails;

  const paymentAmountFloat = roundToTwoDecimals(
    parseFloat(String(totalAmount ?? 0)),
  );
  const totalPaidFloat = roundToTwoDecimals(parseFloat(String(totalPaid ?? 0)));

  // Calcular el total de notas de crédito aplicadas
  const creditNoteTotal = creditNotePayment.reduce(
    (sum, note) =>
      sum + parseFloat(String(note.amountUsed || note.amountToUse || 0)),
    0,
  );

  if (!paymentAmountFloat || paymentAmountFloat <= 0) {
    return {
      isValid: false,
      error: 'Invalid payment amount - must be greater than 0',
      amounts: { paymentAmountFloat, totalPaidFloat, creditNoteTotal },
    };
  }

  // Validar que el total pagado más las notas de crédito no excedan el monto total
  const totalPaymentAndCredit = roundToTwoDecimals(
    totalPaidFloat + creditNoteTotal,
  );
  if (totalPaymentAndCredit > paymentAmountFloat) {
    return {
      isValid: false,
      error: 'Total payment and credit notes exceed invoice amount',
      amounts: {
        paymentAmountFloat,
        totalPaidFloat,
        creditNoteTotal,
        totalPaymentAndCredit,
      },
    };
  }

  return {
    isValid: true,
    error: null,
    amounts: {
      paymentAmountFloat,
      totalPaidFloat,
      creditNoteTotal,
      totalPaymentAndCredit,
    },
  };

};
/**
 * Crea los datos base para un recibo de pago
 * @param {Object} params - Parámetros para crear el recibo
 * @returns {Object} Datos del recibo formateados
 */
export const createPaymentReceiptBase = ({
  paymentId,
  clientId,
  arId,
  user,
  totalAmount,
  paymentMethods,
  change = 0,
}: {
  paymentId: string;
  clientId: string;
  arId: string;
  user: UserWithBusinessAndUid;
  totalAmount: number;
  paymentMethods: InvoicePaymentMethod[];
  change?: number;
}): {
  receiptId: string;
  paymentId: string;
  clientId: string;
  arId: string;
  businessId: string;
  createdAt: ReturnType<typeof Timestamp.now>;
  createdBy: string;
  totalAmount: number;
  paymentMethod: InvoicePaymentMethod[];
  change: number;
} => {
  return {
    receiptId: nanoid(),
    paymentId,
    clientId,
    arId,
    businessId: user.businessID,
    createdAt: Timestamp.now(),
    createdBy: user.uid,
    totalAmount: roundToTwoDecimals(totalAmount),
    paymentMethod: paymentMethods,
    change: roundToTwoDecimals(change),
  };
};

/**
 * Crea los datos de una cuenta para el recibo de pago
 * @param {Object} params - Parámetros de la cuenta
 * @returns {Object} Datos de la cuenta para el recibo
 */
export type PaidInstallmentInfo = {
  number?: number | string;
  id: string;
  amount: number;
};

export const createAccountReceiptData = ({
  account,
  invoice,
  paidInstallments,
  totalPaid,
  newBalance,
}: {
  account: AccountsReceivableAccount;
  invoice?: InvoiceLike | null;
  paidInstallments: PaidInstallmentInfo[];
  totalPaid: number;
  newBalance: number;
}): {
  arNumber: string | number | null | undefined;
  arId: string | null | undefined;
  invoiceNumber: string;
  invoiceId: string | number | null;
  paidInstallments: Array<{
    number?: number | string;
    id: string;
    amount: number;
    status: string;
  }>;
  remainingInstallments: number;
  totalInstallments: number;
  totalPaid: number;
  arBalance: number;
} => {
  const safeString = (val: unknown) =>
    val !== undefined && val !== null ? val : null;

  const invoiceNumber =
    (invoice as InvoiceData | undefined)?.numberID ||
    (invoice as InvoiceFirestoreDoc | undefined)?.data?.numberID;

  const totalInstallments = safeNumber(account.totalInstallments);
  const paidInstallmentsCount = Array.isArray(account.paidInstallments)
    ? account.paidInstallments.length
    : 0;

  return {
    arNumber: account.numberId,
    arId: account.id,
    invoiceNumber: invoiceNumber ? String(invoiceNumber) : 'N/A',
    invoiceId: safeString(
      (invoice as InvoiceData | undefined)?.id ||
        (invoice as InvoiceFirestoreDoc | undefined)?.data?.id,
    ),
    paidInstallments: paidInstallments.map((installmentInfo) => ({
      number: installmentInfo.number,
      id: installmentInfo.id,
      amount: roundToTwoDecimals(installmentInfo.amount),
      status: 'paid',
    })),
    remainingInstallments:
      totalInstallments -
      paidInstallmentsCount -
      paidInstallments.length,
    totalInstallments,
    totalPaid: roundToTwoDecimals(totalPaid),
    arBalance: roundToTwoDecimals(newBalance),
  };
};

/**
 * Maneja valores seguros para evitar undefined/null en cálculos
 * @param {number} val - Valor a validar
 * @returns {number} Valor seguro para cálculos
 */
export const safeNumber = (val: unknown): number =>
  typeof val === 'number' && !isNaN(val) ? val : 0;

/**
 * Maneja valores seguros para strings que pueden ser null
 * @param {any} val - Valor a validar
 * @returns {string|null} Valor seguro para strings
 */
export const safeString = (val: unknown): string | null =>
  val !== undefined && val !== null ? String(val) : null;

/**
 * Obtiene las cuentas por cobrar de un cliente ordenadas por fecha de creación
 * @param {Object} user - Usuario con businessID
 * @param {string} clientId - ID del cliente
 * @returns {Array} Lista de cuentas ordenadas
 */
export const getSortedClientAccountsAR = async (
  user: UserWithBusiness,
  clientId: string,
): Promise<FirestoreDoc<AccountsReceivableAccount>[]> => {
  const accountsRef = collection(
    db,
    'businesses',
    user.businessID,
    'accountsReceivable',
  );
  const q = query(
    accountsRef,
    where('clientId', '==', clientId),
    orderBy('createdAt', 'asc'),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as AccountsReceivableAccount),
  }));
};

/**
 * Procesa el pago de una cuota individual, actualizando saldos y creando registros
 * @param {Object} writer - Batch o transacción de Firestore
 * @param {Object} params - Parámetros del pago
 * @returns {Object} Resultado del procesamiento { amountToApply, newInstallmentBalance, newAccountBalance }
 */
export const processInstallmentPayment = (
  writer: FirestoreWriter,
  {
    user,
    installment,
    remainingAmount,
    paymentId,
    clientId,
    arId,
  }: {
    user: UserWithBusinessAndUid;
    installment: AccountsReceivableInstallment;
    remainingAmount: number;
    paymentId: string;
    clientId?: string | null;
    arId?: string | null;
  },
): {
  amountToApply: number;
  newInstallmentBalance: number;
  isPaid: boolean;
} => {
  const amountToApply = Math.min(
    remainingAmount,
    installment.installmentBalance,
  );
  const newInstallmentBalance = roundToTwoDecimals(
    installment.installmentBalance - amountToApply,
  );

  // Actualizar la cuota
  const installmentRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivableInstallments',
    installment.id,
  );
  writer.update(installmentRef, {
    installmentBalance: newInstallmentBalance,
    isActive: newInstallmentBalance > THRESHOLD,
  });

  // Crear el registro del pago de cuota
  const installmentPaymentRef = doc(
    collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallmentPayments',
    ),
  );
  writer.set(installmentPaymentRef, {
    ...defaultInstallmentPaymentsAR,
    id: nanoid(),
    installmentId: installment.id,
    paymentId,
    paymentAmount: roundToTwoDecimals(amountToApply),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: user.uid,
    updatedBy: user.uid,
    isActive: true,
    clientId,
    arId,
  });

  return {
    amountToApply: roundToTwoDecimals(amountToApply),
    newInstallmentBalance,
    isPaid: newInstallmentBalance <= THRESHOLD,
  };
};

/**
 * Actualiza los totals de la factura después de un pago
 * @param {Object} writer - Batch o transacción de Firestore
 * @param {Object} params - Parámetros de actualización
 */
const isPaymentMethodWithKey = (
  method: InvoicePaymentMethod | null | undefined,
): method is InvoicePaymentMethod & { method: string } =>
  typeof method?.method === 'string' && method.method.trim().length > 0;

export const mergePaymentMethods = (
  existingMethods: InvoicePaymentMethod[] = [],
  newMethods: InvoicePaymentMethod[] = [],
): InvoicePaymentMethod[] => {
  const sanitizedExisting = Array.isArray(existingMethods)
    ? existingMethods
        .filter(isPaymentMethodWithKey)
        .map((m) => ({
          ...m,
          value: roundToTwoDecimals(Number(m.value) || 0),
          status: Boolean(m.status) && (Number(m.value) || 0) > 0,
        }))
    : [];

  const incomingMethods = Array.isArray(newMethods)
    ? newMethods
        .filter((m) => isPaymentMethodWithKey(m) && m.status === true)
        .map((m) => ({
          ...m,
          value: roundToTwoDecimals(Number(m.value) || 0),
          status: Boolean(m.status) && (Number(m.value) || 0) > 0,
        }))
    : [];

  const methodMap = new Map<string, InvoicePaymentMethod>();

  sanitizedExisting.forEach((method) => {
    methodMap.set(method.method, method);
  });

  incomingMethods.forEach((method) => {
    const previous = methodMap.get(method.method) || {
      method: method.method,
      value: 0,
      status: false,
    };
    const combinedValue = roundToTwoDecimals(
      (Number(previous.value) || 0) + (Number(method.value) || 0),
    );

    methodMap.set(method.method, {
      ...previous,
      ...method,
      value: combinedValue,
      status: combinedValue > 0,
    });
  });

  return Array.from(methodMap.values());
};

export const updateInvoiceTotals = (
  writer: FirestoreWriter,
  {
    businessId,
    invoiceId,
    amountPaid,
    invoice,
    paymentMethods = [],
  }: {
    businessId: string;
    invoiceId?: string | null;
    amountPaid: number;
    invoice?: InvoiceLike | null;
    paymentMethods?: InvoicePaymentMethod[];
  },
): InvoiceDataWithTotals | undefined => {
  if (!invoice || !invoiceId) return;

  const invoiceRef = doc(db, 'businesses', businessId, 'invoices', invoiceId);
  const invoiceData =
    (('data' in invoice && invoice.data) ? invoice.data : invoice) as InvoiceDataWithTotals;

  const invoiceTotal = roundToTwoDecimals(
    invoiceData.totalAmount ??
      invoiceData.totalPurchase?.value ??
      ('totalAmount' in invoice ? invoice.totalAmount : undefined) ??
      ('totalPurchase' in invoice ? invoice.totalPurchase?.value : undefined) ??
      0,
  );

  // Double Truth Logic:
  // accumulatedPaid starts at totalPaid (initial) if not present.
  const currentAccumulated =
    invoiceData.accumulatedPaid ?? invoiceData.totalPaid ?? 0;
  const newAccumulatedPaid = roundToTwoDecimals(currentAccumulated + amountPaid);
  const newBalanceDue = roundToTwoDecimals(invoiceTotal - newAccumulatedPaid);

  const newPaymentHistoryEntry = {
    date: Timestamp.now(),
    amount: amountPaid,
    methods: paymentMethods,
    type: 'ar_payment',
  };

  const baseUpdate = {
    accumulatedPaid: newAccumulatedPaid,
    balanceDue: newBalanceDue,
    'data.accumulatedPaid': newAccumulatedPaid,
    'data.balanceDue': newBalanceDue,
    paymentHistory: arrayUnion(newPaymentHistoryEntry),
    'data.paymentHistory': arrayUnion(newPaymentHistoryEntry),
  };

  const isPreorder =
    invoiceData?.type === 'preorder' ||
    invoiceData?.preorderDetails?.isOrWasPreorder === true ||
    invoice?.data?.preorderDetails?.isOrWasPreorder === true;

  if (isPreorder) {
    const paymentStatus =
      newBalanceDue <= THRESHOLD
        ? 'paid'
        : newAccumulatedPaid > 0
          ? 'partial'
          : 'unpaid';

    const invoiceUpdate = {
      ...baseUpdate,
      'preorderDetails.paymentStatus': paymentStatus,
      'data.preorderDetails.paymentStatus': paymentStatus,
      'preorderDetails.balanceDue': newBalanceDue,
      'data.preorderDetails.balanceDue': newBalanceDue,
      'preorderDetails.accumulatedPaid': newAccumulatedPaid,
      'data.preorderDetails.accumulatedPaid': newAccumulatedPaid,
    };

    writer.update(invoiceRef, invoiceUpdate);

    return {
      ...invoiceData,
      accumulatedPaid: newAccumulatedPaid,
      balanceDue: newBalanceDue,
      preorderDetails: {
        ...(invoiceData?.preorderDetails ?? {}),
        paymentStatus,
        balanceDue: newBalanceDue,
        accumulatedPaid: newAccumulatedPaid,
      },
      paymentHistory: [newPaymentHistoryEntry],
    };
  }

  const invoiceUpdate = {
    ...baseUpdate,
    status: newBalanceDue <= THRESHOLD ? 'paid' : 'partial',
    'data.status': newBalanceDue <= THRESHOLD,
  };

  // NOTE: We deliberately DO NOT update 'totalPaid', 'paymentMethod', or 'change'.
  // These fields represent the immutable snapshot of the initial transaction.

  writer.update(invoiceRef, invoiceUpdate);

  return {
    ...invoiceData,
    accumulatedPaid: newAccumulatedPaid,
    balanceDue: newBalanceDue,
    paymentHistory: [newPaymentHistoryEntry],
  };
};



/**
 * Crea el recibo de pago completo con datos formateados
 * @param {Object} params - Parámetros del recibo
 * @returns {Object} Recibo de pago completo
 */
type PaymentReceiptAccount = {
  arNumber?: string | number | null;
  arId?: string | null;
  invoiceNumber?: string | null;
  invoiceId?: string | number | null;
  paidInstallments?: PaidInstallmentInfo[];
  remainingInstallments?: number;
  totalInstallments?: number;
  totalPaid?: number;
  arBalance?: number;
};

export const createFullPaymentReceipt = ({
  paymentId,
  clientId,
  arId,
  user,
  totalAmount,
  paymentMethods,
  accounts = [],
  change = 0,
}: {
  paymentId: string;
  clientId: string;
  arId: string;
  user?: UserWithBusiness | null;
  totalAmount: number;
  paymentMethods: InvoicePaymentMethod[];
  accounts?: PaymentReceiptAccount[];
  change?: number;
}): {
  receiptId: string;
  paymentId: string | null;
  clientId: string | null;
  arId: string | null;
  businessId: string | null;
  createdAt: ReturnType<typeof Timestamp.now>;
  createdBy: string | null;
  accounts: Array<{
    arNumber: string | null;
    arId: string | null;
    invoiceNumber: string | null;
    invoiceId: string | null;
    paidInstallments: PaidInstallmentInfo[];
    remainingInstallments: number;
    totalInstallments: number;
    totalPaid: number;
    arBalance: number;
  }>;
  totalAmount: number;
  paymentMethod: InvoicePaymentMethod[];
  change: number;
} => {
  // Validar que todos los campos requeridos existan
  const receiptData = {
    receiptId: nanoid(),
    paymentId: safeString(paymentId),
    clientId: safeString(clientId),
    arId: safeString(arId),
    businessId: safeString(user?.businessID),
    createdAt: Timestamp.now(),
    createdBy: safeString(user?.uid),
    accounts: Array.isArray(accounts)
      ? accounts.map((account) => ({
        arNumber: safeString(account.arNumber),
        arId: safeString(account.arId),
        invoiceNumber: safeString(account.invoiceNumber),
        invoiceId: safeString(account.invoiceId),
        paidInstallments: Array.isArray(account.paidInstallments)
          ? (account.paidInstallments as PaidInstallmentInfo[])
          : [],
        remainingInstallments: safeNumber(account.remainingInstallments),
        totalInstallments: safeNumber(account.totalInstallments),
        totalPaid: safeNumber(account.totalPaid),
        arBalance: safeNumber(account.arBalance),
      }))
      : [],
    totalAmount: safeNumber(totalAmount),
    paymentMethod: Array.isArray(paymentMethods) ? paymentMethods : [],
    change: safeNumber(change),
  };

  // Debug logging para verificar que no hay undefined
  const undefinedFields = Object.entries(receiptData).filter(
    ([_key, value]) => value === undefined,
  );
  if (undefinedFields.length > 0) {
    console.error(
      'âŒ Undefined fields found in payment receipt:',
      undefinedFields,
    );
    console.error('âŒ Full receipt data:', receiptData);
    throw new Error(
      `Payment receipt has undefined fields: ${undefinedFields.map(([key]) => key).join(', ')}`,
    );
  }

  return receiptData;
};

/**
 * Obtiene la información de cuotas pagadas formateada para el recibo
 * @param {Array} paidInstallmentIds - IDs de cuotas pagadas
 * @param {Array} allInstallments - Todas las cuotas de la cuenta
 * @returns {Array} Información de cuotas pagadas formateada
 */
export const formatPaidInstallments = (
  paidInstallmentIds: string[],
  allInstallments: AccountsReceivableInstallment[],
): PaidInstallmentInfo[] => {
  return paidInstallmentIds.map((id) => {
    const installment = allInstallments.find((inst) => inst.id === id);
    return {
      number: installment?.installmentNumber,
      id,
      amount: roundToTwoDecimals(installment?.installmentBalance || 0),
      status: 'paid',
    };
  });
};

/**
 * Valida los parámetros básicos de un pago
 * @param {Object} params - Parámetros a validar
 * @returns {Object} Resultado de validación
 */
export const validateBasicPaymentParams = ({
  user,
  clientId,
  totalPaid,
  paymentMethods,
}: {
  user?: UserWithBusiness | null;
  clientId?: string | null;
  totalPaid: number | string;
  paymentMethods?: InvoicePaymentMethod[] | null;
}): { isValid: boolean; error?: string; totalPaidFloat?: number } => {
  if (!user || !user.businessID) {
    return { isValid: false, error: 'User or business ID missing' };
  }

  if (!clientId) {
    return { isValid: false, error: 'Client ID is required' };
  }

  const totalPaidFloat = parseFloat(String(totalPaid));
  if (isNaN(totalPaidFloat) || totalPaidFloat <= 0) {
    return { isValid: false, error: 'Invalid total paid amount' };
  }

  if (!paymentMethods || !Array.isArray(paymentMethods)) {
    return { isValid: false, error: 'Payment methods are required' };
  }

  return { isValid: true, totalPaidFloat };
};

/**
 * Valida que la estructura de métodos de pago sea correcta
 * @param {Array} paymentMethods - Array de métodos de pago
 * @param {number} totalAmount - Monto total esperado
 * @returns {Object} Resultado de validación
 */
export const validatePaymentMethods = (
  paymentMethods: InvoicePaymentMethod[],
  totalAmount: number | string,
): {
  isValid: boolean;
  error?: string;
  totals?: { expected: number; actual: number };
  totalFromMethods?: number;
} => {
  if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
    return {
      isValid: false,
      error: 'Payment methods must be a non-empty array',
    };
  }

  // Calcular total de métodos de pago activos
  const totalFromMethods = paymentMethods
    .filter((method) => method.status === true)
    .reduce((sum, method) => sum + (parseFloat(method.value) || 0), 0);

  const expectedTotal = roundToTwoDecimals(Number(totalAmount));
  const actualTotal = roundToTwoDecimals(totalFromMethods);

  // Permitir una pequeña diferencia por redondeo
  if (Math.abs(expectedTotal - actualTotal) > 0.01) {
    return {
      isValid: false,
      error: `Payment methods total (${actualTotal}) doesn't match expected amount (${expectedTotal})`,
      totals: { expected: expectedTotal, actual: actualTotal },
    };
  }

  return { isValid: true, totalFromMethods: actualTotal };
};

/**
 * Actualiza los datos de una cuenta después de procesar pagos
 * @param {Object} writer - Batch o transacción de Firestore
 * @param {Object} params - Parámetros de actualización
 */
export const updateAccountAfterPayment = (
  writer: FirestoreWriter,
  { user, account, totalPaid }: {
  user: UserWithBusinessAndUid;
    account: AccountsReceivableAccount;
    totalPaid: number;
  },
): void => {
  const accountRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivable',
    account.id,
  );

  writer.update(accountRef, {
    arBalance: account.arBalance,
    lastPaymentDate: Timestamp.now(),
    lastPayment: totalPaid,
    isActive: account.arBalance > THRESHOLD,
    isClosed: account.arBalance <= THRESHOLD,
  });
};

/**
 * Crea un registro de pago usando setDoc (para casos donde no se use transacción)
 * @param {Object} user - Usuario
 * @param {Object} paymentDetails - Detalles del pago
 * @returns {string} ID del pago creado
 */
export const createPaymentWithSetDoc = async (
  user: UserWithBusiness,
  paymentDetails: PaymentDetails,
): Promise<string> => {
  const { totalPaid, paymentMethods, comments } = paymentDetails;
  const paymentId = nanoid();
  const paymentsRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivablePayments',
    paymentId,
  );
  const paymentData = {
    ...defaultPaymentsAR,
    id: paymentId,
    paymentMethods,
    totalPaid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    comments,
    createdUserId: user?.uid,
    updatedUserId: user?.uid,
    isActive: true,
  };
  await setDoc(paymentsRef, paymentData);
  return paymentId;
};

/**
 * Extrae y valida las notas de crédito de los detalles de pago
 * @param {Object} paymentDetails - Detalles del pago
 * @returns {Object} Información procesada de notas de crédito
 */
export const extractCreditNoteInfo = (
  paymentDetails: Pick<PaymentDetails, 'creditNotePayment'>,
): {
  hasCreditNotes: boolean;
  creditNotes: CreditNotePayment[];
  totalCreditAmount: number;
} => {
  const { creditNotePayment = [] } = paymentDetails;

  if (!Array.isArray(creditNotePayment) || creditNotePayment.length === 0) {
    return {
      hasCreditNotes: false,
      creditNotes: [],
      totalCreditAmount: 0,
    };
  }

  const validCreditNotes = creditNotePayment.filter(
    (note) => note && (note.amountUsed > 0 || note.amountToUse > 0),
  );

  const totalCreditAmount = validCreditNotes.reduce(
    (sum, note) => sum + (note.amountUsed || note.amountToUse || 0),
    0,
  );

  return {
    hasCreditNotes: validCreditNotes.length > 0,
    creditNotes: validCreditNotes,
    totalCreditAmount: roundToTwoDecimals(totalCreditAmount),
  };
};

/**
 * Ajusta el monto total del pago considerando notas de crédito
 * @param {Object} paymentDetails - Detalles del pago
 * @returns {Object} Montos ajustados para el procesamiento
 */
export const adjustPaymentAmountsForCreditNotes = (
  paymentDetails: Pick<PaymentDetails, 'totalPaid' | 'totalAmount' | 'creditNotePayment'>,
): {
  originalTotalPaid: number;
  originalInvoiceAmount: number;
  totalCreditAmount: number;
  effectiveAmountToPay: number;
  hasValidCreditNotes: boolean;
} => {
  const { totalPaid, totalAmount } = paymentDetails;
  const { totalCreditAmount } = extractCreditNoteInfo(paymentDetails);

  const baseTotalPaid = roundToTwoDecimals(parseFloat(String(totalPaid ?? 0)));
  const baseInvoiceAmount = roundToTwoDecimals(
    parseFloat(String(totalAmount ?? 0)),
  );

  // El monto efectivo a pagar es el total menos las notas de crédito
  const effectiveAmountToPay = roundToTwoDecimals(
    baseInvoiceAmount - totalCreditAmount,
  );

  return {
    originalTotalPaid: baseTotalPaid,
    originalInvoiceAmount: baseInvoiceAmount,
    totalCreditAmount,
    effectiveAmountToPay: Math.max(0, effectiveAmountToPay), // No puede ser negativo
    hasValidCreditNotes: totalCreditAmount > 0,
  };
};

/**
 * Limpia un objeto eliminando campos undefined y null de forma recursiva
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} Objeto limpio sin campos undefined/null
 */
export const cleanFirestoreData = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(cleanFirestoreData)
      .filter((item) => item !== null && item !== undefined);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        const cleanedValue = cleanFirestoreData(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  return obj;
};

/**
 * Valida que un objeto no tenga campos undefined antes de guardar en Firestore
 * @param {Object} data - Datos a validar
 * @param {string} context - Contexto para el mensaje de error
 * @returns {Object} Datos validados y limpios
 */
export const validateFirestoreData = <T>(
  data: T,
  context = 'data',
): T => {
  const cleanedData = cleanFirestoreData(data);

  // Verificar recursivamente que no haya undefined
  const hasUndefined = (obj: unknown, path = ''): string | null => {
    if (obj === undefined) {
      return path || 'root';
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = hasUndefined(obj[i], `${path}[${i}]`);
        if (result) return result;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const result = hasUndefined(value, path ? `${path}.${key}` : key);
        if (result) return result;
      }
    }

    return null;
  };

  const undefinedPath = hasUndefined(cleanedData);
  if (undefinedPath) {
    console.error(
      `âŒ Undefined field found in ${context} at path: ${undefinedPath}`,
    );
    console.error(`âŒ Original data:`, data);
    console.error(`âŒ Cleaned data:`, cleanedData);
    throw new Error(
      `Cannot save ${context} to Firestore: undefined field at ${undefinedPath}`,
    );
  }

  return cleanedData as T;
};

/**
 * Valida que una cuenta tenga balance pendiente antes de procesar pagos
 * @param {Object} user - Usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Object} Resultado de validación con información de la cuenta
 */
export const validateAccountHasPendingBalance = async (
  user: UserWithBusiness | null | undefined,
  arId: string,
): Promise<{
  isValid: boolean;
  error: string | null;
  account: AccountsReceivableAccount | null;
  balance?: number;
}> => {
  try {
    if (!user?.businessID) {
      return {
        isValid: false,
        error: 'User or business ID missing',
        account: null,
      };
    }

    if (!arId) {
      return {
        isValid: false,
        error: 'Account ID is required',
        account: null,
      };
    }

    // Obtener los datos de la cuenta
    const accountRef = doc(
      db,
      'businesses',
      user.businessID,
      'accountsReceivable',
      arId,
    );
    const accountDoc = await getDoc(accountRef);

    if (!accountDoc.exists()) {
      return {
        isValid: false,
        error: 'Account not found',
        account: null,
      };
    }

    const accountData = accountDoc.data() as AccountsReceivableAccount;
    const currentBalance = safeNumber(accountData.arBalance);

    // Validar que la cuenta esté activa
    if (accountData.isClosed === true) {
      return {
        isValid: false,
        error: 'Account is already closed',
        account: accountData,
        balance: currentBalance,
      };
    }

    // Validar que tenga balance pendiente
    if (currentBalance <= THRESHOLD) {
      return {
        isValid: false,
        error: `Account has no pending balance (current: ${currentBalance})`,
        account: accountData,
        balance: currentBalance,
      };
    }

    // Validar que la cuenta esté activa
    if (accountData.isActive === false) {
      return {
        isValid: false,
        error: 'Account is inactive',
        account: accountData,
        balance: currentBalance,
      };
    }

    return {
      isValid: true,
      error: null,
      account: accountData,
      balance: currentBalance,
    };
  } catch (error) {
    console.error('Error validating account balance:', error);
    return {
      isValid: false,
      error: `Error validating account: ${
        error instanceof Error ? error.message : String(error)
      }`,
      account: null,
    };
  }
};

/**
 * Valida que el monto del pago no exceda el balance de la cuenta
 * @param {number} paymentAmount - Monto a pagar
 * @param {number} accountBalance - Balance actual de la cuenta
 * @returns {Object} Resultado de validación
 */
export const validatePaymentAmount = (
  paymentAmount: unknown,
  accountBalance: unknown,
): {
  isValid: boolean;
  error: string | null;
  adjustedAmount: number;
  exceedsBalance: boolean;
} => {
  const payment = safeNumber(paymentAmount);
  const balance = safeNumber(accountBalance);

  if (payment <= 0) {
    return {
      isValid: false,
      error: 'Payment amount must be greater than 0',
      adjustedAmount: 0,
      exceedsBalance: false,
    };
  }

  if (payment > balance) {
    return {
      isValid: false,
      error: `Payment amount (${payment}) exceeds account balance (${balance})`,
      adjustedAmount: balance,
      exceedsBalance: true,
    };
  }

  return {
    isValid: true,
    error: null,
    adjustedAmount: payment,
    exceedsBalance: false,
  };
};


