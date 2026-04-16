import { DateTime } from 'luxon';

import type {
  AuthorizationFormValues,
  TaxReceiptDocumentWithAuthorizations,
  TaxReceiptUserWithBusiness,
} from '../types';
import type { TaxReceiptUser } from '@/types/taxReceipt';

export const hasBusinessId = (
  value: TaxReceiptUser | null,
): value is TaxReceiptUserWithBusiness =>
  typeof value?.businessID === 'string' && value.businessID.trim().length > 0;

export const resolveReceiptId = (
  receipt: TaxReceiptDocumentWithAuthorizations,
): string | null => {
  const resolvedId = receipt.id ?? receipt.data.id;
  if (typeof resolvedId !== 'string') return null;
  const trimmed = resolvedId.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const buildReceiptOptions = (
  taxReceipts: TaxReceiptDocumentWithAuthorizations[] | null | undefined,
) => {
  return (taxReceipts ?? []).filter((receipt) => !receipt.data.disabled);
};

export const buildDefaultExpirationDate = () => {
  return DateTime.now().plus({ years: 1 });
};

const parseIntegerValue = (value: number | string | null | undefined) => {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const resolveReceiptIncrease = (
  value?: number | string | null,
): number => {
  const parsed = parseIntegerValue(value);
  return parsed && parsed > 0 ? parsed : 1;
};

export const calculateNewEndSequence = (
  values: AuthorizationFormValues,
  increase = 1,
) => {
  if (!values.startSequence || !values.approvedQuantity) return null;

  const startNum = parseIntegerValue(values.startSequence);
  const quantity = parseIntegerValue(values.approvedQuantity);
  const safeIncrease = resolveReceiptIncrease(increase);

  if (startNum === null || quantity === null || quantity <= 0) return null;

  return startNum + safeIncrease * (quantity - 1);
};

export const calculateStoredSequenceFromAuthorization = (
  startSequence: number | string,
  increase = 1,
) => {
  const startNum = parseIntegerValue(startSequence);
  const safeIncrease = resolveReceiptIncrease(increase);

  if (startNum === null || startNum < safeIncrease) return null;

  return startNum - safeIncrease;
};
