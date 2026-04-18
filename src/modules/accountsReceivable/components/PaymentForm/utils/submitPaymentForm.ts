import type { FormInstance } from 'antd';
import { nanoid } from 'nanoid';

import { fbProcessClientPaymentAR } from '@/firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR';
import type { UserIdentity } from '@/types/users';

import {
  isUserWithBusiness,
  shouldAutoCompletePreorder,
  toSubmitPaymentDetails,
} from './paymentFormHelpers';
import type {
  AutoCompleteTarget,
  FormValidationError,
  PaymentDetails,
  ProcessedPaymentReceipt,
} from './paymentFormTypes';

const PAYMENT_EPSILON = 0.001;
const submitPaymentIdempotencyKeys = new WeakMap<object, string>();

const resolveSubmitPaymentIdempotencyKey = (
  paymentDetails: PaymentDetails,
): string => {
  const cacheKey = paymentDetails as object;
  const existingKey = submitPaymentIdempotencyKeys.get(cacheKey);
  if (existingKey) {
    return existingKey;
  }

  const nextKey = nanoid(21);
  submitPaymentIdempotencyKeys.set(cacheKey, nextKey);
  return nextKey;
};

export interface SubmitPaymentFormArgs {
  form: FormInstance;
  onReceipt: (receipt: ProcessedPaymentReceipt | null) => void;
  paymentDetails: PaymentDetails;
  user: UserIdentity | null;
}

export interface SubmitPaymentFormResult {
  autoCompleteTarget: AutoCompleteTarget | null;
  receiptData: ProcessedPaymentReceipt | null;
  shouldAutoComplete: boolean;
}

export const isPaymentFormValidationError = (
  value: unknown,
): value is FormValidationError => {
  if (!value || typeof value !== 'object') return false;
  return (
    'errorFields' in value &&
    Array.isArray((value as FormValidationError).errorFields)
  );
};

export const validatePaymentSubmission = (paymentDetails: PaymentDetails) => {
  const totalAmount = Number(paymentDetails.totalAmount) || 0;
  const totalPaid = Number(paymentDetails.totalPaid) || 0;
  const thirdPartyWithholding = paymentDetails.thirdPartyWithholding ?? null;
  const itbisWithheld = Number(thirdPartyWithholding?.itbisWithheld) || 0;
  const incomeTaxWithheld =
    Number(thirdPartyWithholding?.incomeTaxWithheld) || 0;

  if (totalAmount <= 0) {
    throw new Error('El monto total debe ser mayor a cero.');
  }

  if (
    paymentDetails.paymentOption === 'installment' &&
    totalPaid + PAYMENT_EPSILON < totalAmount
  ) {
    throw new Error('Debe de pagar el monto total de la cuota seleccionada.');
  }

  const activeMethods = paymentDetails.paymentMethods.filter(
    (method) => method.status,
  );
  if (activeMethods.length === 0) {
    throw new Error('Debe seleccionar al menos un método de pago.');
  }

  for (const method of activeMethods) {
    if (
      method.method !== 'cash' &&
      method.method !== 'creditNote' &&
      !method.reference
    ) {
      throw new Error(
        `El método de pago ${method.method} requiere una referencia.`,
      );
    }

    if (method.value <= 0) {
      throw new Error(
        `El valor del método de pago ${method.method} debe ser mayor a cero.`,
      );
    }
  }

  if (paymentDetails.comments.length > 500) {
    throw new Error('Los comentarios no pueden exceder los 500 caracteres.');
  }

  if (itbisWithheld < 0 || incomeTaxWithheld < 0) {
    throw new Error('Las retenciones sufridas no pueden tener montos negativos.');
  }

  if (itbisWithheld > 0 || incomeTaxWithheld > 0) {
    if (!thirdPartyWithholding?.retentionDate?.trim()) {
      throw new Error(
        'Debe indicar la fecha de retención cuando existan retenciones sufridas.',
      );
    }
  }
};

export const submitPaymentForm = async ({
  form,
  onReceipt,
  paymentDetails,
  user,
}: SubmitPaymentFormArgs): Promise<SubmitPaymentFormResult> => {
  validatePaymentSubmission(paymentDetails);
  await form.validateFields();

  if (!isUserWithBusiness(user)) {
    throw new Error(
      'No se pudo validar el negocio del usuario para procesar el pago.',
    );
  }

  const submitPaymentDetails = toSubmitPaymentDetails(paymentDetails);
  const idempotencyKey = resolveSubmitPaymentIdempotencyKey(paymentDetails);
  const receiptData = await fbProcessClientPaymentAR(
    user,
    submitPaymentDetails,
    onReceipt,
    { idempotencyKey },
  );

  const autoCompleteTarget = shouldAutoCompletePreorder(
    paymentDetails,
    receiptData,
  );

  return {
    autoCompleteTarget,
    receiptData,
    shouldAutoComplete: Boolean(autoCompleteTarget),
  };
};
