import DateUtils from './date/dateUtils';
import { roundDecimals } from './pricing';
import { isReference } from './refereceUtils';
import { buildPaymentState } from '@/utils/payments/paymentState';

export function getInvoicePaymentInfo(invoice) {
  const accumulatedPaidRaw = Number(invoice?.accumulatedPaid);
  const hasAccumulatedPaid = Number.isFinite(accumulatedPaidRaw);

  const paymentGross = Number(invoice?.payment?.value ?? 0);
  const changeGross = Number(invoice?.change?.value ?? 0);
  const paidFromSnapshot = Number.isFinite(paymentGross)
    ? Math.max(0, paymentGross - (Number.isFinite(changeGross) ? changeGross : 0))
    : 0;

  const paidAmount = hasAccumulatedPaid ? accumulatedPaidRaw : paidFromSnapshot;

  const totalPurchase = Number(
    invoice?.totalPurchase?.value ?? invoice?.totalAmount ?? 0,
  );

  const safePaid = Number.isFinite(paidAmount) ? paidAmount : 0;
  const safeTotal = Number.isFinite(totalPurchase) ? totalPurchase : 0;
  const pending = Math.max(safeTotal - safePaid, 0);

  return {
    paid: safePaid,
    total: safeTotal,
    pending,
    isPaidInFull:
      safeTotal === 0 ? safePaid === safeTotal : safePaid >= safeTotal - 0.01, // Tolerance
  };
}

export function isInvoicePaidInFull(invoice) {
  return getInvoicePaymentInfo(invoice).isPaidInFull;
}

export function getInvoicePaymentState(invoice) {
  const paymentInfo = getInvoicePaymentInfo(invoice);
  const paymentHistory = Array.isArray(invoice?.paymentHistory)
    ? invoice.paymentHistory
    : Array.isArray(invoice?.data?.paymentHistory)
      ? invoice.data.paymentHistory
      : [];
  const lastPaymentEntry =
    paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1] : null;

  return buildPaymentState({
    total: paymentInfo.total,
    paid: paymentInfo.paid,
    balance: paymentInfo.pending,
    paymentCount: paymentHistory.length,
    lastPaymentAt: lastPaymentEntry?.date ?? null,
  });
}

export function getActivePaymentMethods(invoice) {
  // Initialize an array to hold the names of active payment methods
  const activeMethods = [];

  // Loop through each payment method in the invoice
  invoice.paymentMethod.forEach((method) => {
    // If the payment method is active, add its name to the array
    if (method.status) {
      activeMethods.push(method.method);
    }
  });

  // Join the names of active payment methods into a single string
  return activeMethods.join(', ') || '';
}

export function translatePaymentMethods(methodsString) {
  // Mapa de traducciones de los métodos de pago del inglés al español
  const translations = {
    cash: 'efectivo',
    card: 'tarjeta',
    transfer: 'transferencia',
  };

  // Dividir la cadena de métodos de pago en un arreglo
  const methodsArray = methodsString.split(', ');

  // Traducir cada método de pago utilizando el mapa de traducciones
  const translatedMethodsArray = methodsArray.map(
    (method) => translations[method] || method,
  );

  // Unir los métodos traducidos en una sola cadena y retornar
  return translatedMethodsArray.join(', ');
}

export function abbreviatePaymentMethods(methodsArray) {
  // Mapa de abreviaturas específicas para cada método de pago en español
  const abbreviations = {
    cash: 'Efectivo', // O "Efec"
    card: 'TC', // O "Tjta"
    transfer: 'Transf', // O "Trans"
  };

  // Generar abreviaturas específicas para cada método de pago
  const abbreviatedMethodsArray = methodsArray.map(
    (method) => abbreviations[method.toLowerCase()] || method,
  );

  // Unir los métodos abreviados en una sola cadena y retornar
  return abbreviatedMethodsArray.join(', ');
}

export function calculateInvoicesTotal(invoices) {
  return invoices.reduce(
    (total, invoice) => total + invoice.data.totalPurchase.value,
    0,
  );
}
export function countInvoices(invoices) {
  return invoices.length;
}

export const normalizeInvoiceChange = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 0;

  const rounded = roundDecimals(numericValue, 2);
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

export const calculateInvoiceChange = (invoice) => {
  const snapshotChange = Number(invoice?.change?.value);

  if (Number.isFinite(snapshotChange)) {
    return normalizeInvoiceChange(snapshotChange);
  }

  const payment = Number(invoice?.payment?.value ?? 0);
  const totalPurchase = Number(
    invoice?.totalPurchase?.value ?? invoice?.totalAmount ?? 0,
  );

  return normalizeInvoiceChange(payment - totalPurchase);
};

const isFirestoreTimestampLike = (value) =>
  typeof value === 'object' &&
  value !== null &&
  typeof value.seconds === 'number' &&
  typeof value.nanoseconds === 'number';

export const normalizeInvoiceTimestamp = (input) => {
  if (!input) return null;
  if (typeof input === 'number') {
    return input > 1e12 ? input : input * 1000;
  }
  if (typeof input === 'string') {
    const numeric = Number(input);
    if (Number.isFinite(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const dateFromString = new Date(input);
    if (!Number.isNaN(dateFromString.getTime())) {
      return dateFromString.getTime();
    }
  }
  if (input instanceof Date) {
    return input.getTime();
  }
  if (typeof input?.toMillis === 'function') {
    const millis = input.toMillis();
    return Number.isFinite(millis) ? millis : null;
  }
  if (isFirestoreTimestampLike(input)) {
    return DateUtils.convertTimestampToMillis(input);
  }
  return null;
};

const sanitizeForRedux = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === 'function') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForRedux).filter((item) => item !== undefined);
  }

  if (isReference(value)) {
    return {
      path: value.path,
      id: value.id,
    };
  }

  if (isFirestoreTimestampLike(value)) {
    return DateUtils.convertTimestampToMillis(value);
  }

  if (typeof value === 'object') {
    const result = {};
    Object.entries(value).forEach(([key, entryValue]) => {
      const sanitized = sanitizeForRedux(entryValue);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    });
    return result;
  }

  return value;
};

export const prepareInvoiceForEdit = (invoice) => {
  if (!invoice) return null;

  const activePayment = Array.isArray(invoice.paymentMethod)
    ? invoice.paymentMethod.find((method) => method.status === true)
    : null;

  const normalized = {
    ...invoice,
    date: normalizeInvoiceTimestamp(invoice.date),
    updateAt: normalizeInvoiceTimestamp(invoice.updateAt),
    payWith: activePayment?.value ?? activePayment?.method ?? null,
    cancel: invoice?.cancel
      ? {
          ...invoice.cancel,
          cancelledAt: normalizeInvoiceTimestamp(invoice.cancel.cancelledAt),
        }
      : null,
  };

  return sanitizeForRedux(normalized);
};

export const convertInvoiceDateToMillis = normalizeInvoiceTimestamp;
