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

export const calculateNewEndSequence = (
  values: AuthorizationFormValues,
) => {
  if (!values.startSequence || !values.approvedQuantity) return null;

  const startNum = parseInt(String(values.startSequence), 10);
  const quantity = parseInt(String(values.approvedQuantity), 10);

  if (Number.isNaN(startNum) || Number.isNaN(quantity)) return null;

  return startNum + quantity - 1;
};
