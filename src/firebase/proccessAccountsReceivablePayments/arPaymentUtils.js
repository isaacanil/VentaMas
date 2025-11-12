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
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { defaultInstallmentPaymentsAR } from '../../schema/accountsReceivable/installmentPaymentsAR';
import { defaultPaymentsAR } from '../../schema/accountsReceivable/paymentAR';
import { db } from '../firebaseconfig';

import { THRESHOLD, roundToTwoDecimals } from './financeUtils';

/**
 * Obtiene una cuenta por cobrar por su ID.
 */
export const getAccountReceivableById = async (businessId, arId) => {
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
  return accountDoc.data();
};

/**
 * Obtiene todas las cuotas (activas o no) de una cuenta, ordenadas por fecha.
 * @param {string} businessId - ID del negocio
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Promise<Array>} Lista de cuotas con id y datos
 */
export const getAllInstallmentsByArId = async (businessId, arId) => {
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
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Obtiene cuotas activas de una cuenta, ordenadas por fecha
 * @param {Object} user - Usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Promise<Array>} Lista de cuotas activas
 */
export const getActiveInstallmentsByArId = async (user, arId) => {
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
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Obtiene todas las cuotas de una cuenta (para compatibilidad con código existente)
 * @param {Object} user - Usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Promise<Array>} Lista de todas las cuotas
 */
export const getInstallmentsByArId = async (user, arId) => {
  return await getAllInstallmentsByArId(user.businessID, arId);
};

/**
 * Crea el registro principal del pago (accountsReceivablePayments).
 * @param {object} writer - El objeto de transacción o batch de Firestore.
 * @returns {string} El ID del nuevo pago.
 */
export const createPaymentRecord = (writer, { user, paymentDetails }) => {
  const { totalPaid, paymentMethods, comments, clientId } = paymentDetails;
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
    clientId,
    comments,
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
  writer,
  { user, installment, amountToApply, paymentId, clientId, arId },
) => {
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
  writer,
  {
    businessId,
    arId,
    totalPaid,
    newArBalance,
    paidInstallmentIds,
    existingPaidInstallments = [],
  },
) => {
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
  writer,
  { businessId, invoiceId, amountPaid },
) => {
  if (!invoiceId) return null;

  const invoiceRef = doc(db, 'businesses', businessId, 'invoices', invoiceId);
  // Nota: runTransaction permite lecturas, pero si usamos batch, la factura debe leerse antes.
  // Para simplificar, asumimos que se puede leer dentro de una transacción o se ha leído antes para un batch.
  const invoiceDoc = await getDoc(invoiceRef); // Esta lectura es segura dentro de una transacción
  if (!invoiceDoc.exists()) {
    console.warn(`Invoice ${invoiceId} not found during payment update.`);
    return null;
  }

  const invoiceData = invoiceDoc.data();
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
export const getClientAccountById = async (user, accountId) => {
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
      return { id: accountDoc.id, ...accountDoc.data() };
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
export const getOldestActiveInstallmentByArId = async (user, arId) => {
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
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))[0];
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
export const validatePaymentAmounts = (paymentDetails) => {
  const { totalAmount, totalPaid, creditNotePayment = [] } = paymentDetails;

  const paymentAmountFloat = roundToTwoDecimals(parseFloat(totalAmount || 0));
  const totalPaidFloat = roundToTwoDecimals(parseFloat(totalPaid || 0));

  // Calcular el total de notas de crédito aplicadas
  const creditNoteTotal = creditNotePayment.reduce(
    (sum, note) => sum + parseFloat(note.amountUsed || note.amountToUse || 0),
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
}) => {
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
export const createAccountReceiptData = ({
  account,
  invoice,
  paidInstallments,
  totalPaid,
  newBalance,
}) => {
  const safeString = (val) => (val !== undefined && val !== null ? val : null);

  return {
    arNumber: account.numberId,
    arId: account.id,
    invoiceNumber: safeString(invoice?.numberID || invoice?.data?.numberID),
    invoiceId: safeString(invoice?.id || invoice?.data?.id),
    paidInstallments: paidInstallments.map((installmentInfo) => ({
      number: installmentInfo.number,
      id: installmentInfo.id,
      amount: roundToTwoDecimals(installmentInfo.amount),
      status: 'paid',
    })),
    remainingInstallments:
      account.totalInstallments -
      (account.paidInstallments?.length || 0) -
      paidInstallments.length,
    totalInstallments: account.totalInstallments,
    totalPaid: roundToTwoDecimals(totalPaid),
    arBalance: roundToTwoDecimals(newBalance),
  };
};

/**
 * Maneja valores seguros para evitar undefined/null en cálculos
 * @param {number} val - Valor a validar
 * @returns {number} Valor seguro para cálculos
 */
export const safeNumber = (val) =>
  typeof val === 'number' && !isNaN(val) ? val : 0;

/**
 * Maneja valores seguros para strings que pueden ser null
 * @param {any} val - Valor a validar
 * @returns {string|null} Valor seguro para strings
 */
export const safeString = (val) =>
  val !== undefined && val !== null ? String(val) : null;

/**
 * Obtiene las cuentas por cobrar de un cliente ordenadas por fecha de creación
 * @param {Object} user - Usuario con businessID
 * @param {string} clientId - ID del cliente
 * @returns {Array} Lista de cuentas ordenadas
 */
export const getSortedClientAccountsAR = async (user, clientId) => {
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
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Procesa el pago de una cuota individual, actualizando saldos y creando registros
 * @param {Object} writer - Batch o transacción de Firestore
 * @param {Object} params - Parámetros del pago
 * @returns {Object} Resultado del procesamiento { amountToApply, newInstallmentBalance, newAccountBalance }
 */
export const processInstallmentPayment = (
  writer,
  { user, installment, remainingAmount, paymentId, clientId, arId },
) => {
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
export const updateInvoiceTotals = (
  writer,
  { businessId, invoiceId, amountPaid, invoice },
) => {
  if (!invoice || !invoiceId) return;

  const invoiceRef = doc(db, 'businesses', businessId, 'invoices', invoiceId);
  const invoiceData = invoice.data || invoice;
  const previousPaid = invoiceData.totalPaid || 0;
  const newTotalPaid = roundToTwoDecimals(previousPaid + amountPaid);
  const newBalanceDue = roundToTwoDecimals(
    invoiceData.totalAmount - newTotalPaid,
  );

  writer.update(invoiceRef, {
    totalPaid: newTotalPaid,
    balanceDue: newBalanceDue,
    status: newBalanceDue <= THRESHOLD,
  });

  return { newTotalPaid, newBalanceDue };
};

/**
 * Crea el recibo de pago completo con datos formateados
 * @param {Object} params - Parámetros del recibo
 * @returns {Object} Recibo de pago completo
 */
export const createFullPaymentReceipt = ({
  paymentId,
  clientId,
  arId,
  user,
  totalAmount,
  paymentMethods,
  accounts = [],
  change = 0,
}) => {
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
            ? account.paidInstallments
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
      '❌ Undefined fields found in payment receipt:',
      undefinedFields,
    );
    console.error('❌ Full receipt data:', receiptData);
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
export const formatPaidInstallments = (paidInstallmentIds, allInstallments) => {
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
}) => {
  if (!user || !user.businessID) {
    return { isValid: false, error: 'User or business ID missing' };
  }

  if (!clientId) {
    return { isValid: false, error: 'Client ID is required' };
  }

  const totalPaidFloat = parseFloat(totalPaid);
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
export const validatePaymentMethods = (paymentMethods, totalAmount) => {
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

  const expectedTotal = roundToTwoDecimals(totalAmount);
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
  writer,
  { user, account, totalPaid },
) => {
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
export const createPaymentWithSetDoc = async (user, paymentDetails) => {
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
export const extractCreditNoteInfo = (paymentDetails) => {
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
export const adjustPaymentAmountsForCreditNotes = (paymentDetails) => {
  const { totalPaid, totalAmount } = paymentDetails;
  const { totalCreditAmount } = extractCreditNoteInfo(paymentDetails);

  const baseTotalPaid = roundToTwoDecimals(parseFloat(totalPaid || 0));
  const baseInvoiceAmount = roundToTwoDecimals(parseFloat(totalAmount || 0));

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
export const cleanFirestoreData = (obj) => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(cleanFirestoreData)
      .filter((item) => item !== null && item !== undefined);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned = {};
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
export const validateFirestoreData = (data, context = 'data') => {
  const cleanedData = cleanFirestoreData(data);

  // Verificar recursivamente que no haya undefined
  const hasUndefined = (obj, path = '') => {
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
      `❌ Undefined field found in ${context} at path: ${undefinedPath}`,
    );
    console.error(`❌ Original data:`, data);
    console.error(`❌ Cleaned data:`, cleanedData);
    throw new Error(
      `Cannot save ${context} to Firestore: undefined field at ${undefinedPath}`,
    );
  }

  return cleanedData;
};

/**
 * Valida que una cuenta tenga balance pendiente antes de procesar pagos
 * @param {Object} user - Usuario con businessID
 * @param {string} arId - ID de la cuenta por cobrar
 * @returns {Object} Resultado de validación con información de la cuenta
 */
export const validateAccountHasPendingBalance = async (user, arId) => {
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

    const accountData = accountDoc.data();
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
      error: `Error validating account: ${error.message}`,
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
export const validatePaymentAmount = (paymentAmount, accountBalance) => {
  const payment = safeNumber(paymentAmount);
  const balance = safeNumber(accountBalance);

  if (payment <= 0) {
    return {
      isValid: false,
      error: 'Payment amount must be greater than 0',
      adjustedAmount: 0,
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
