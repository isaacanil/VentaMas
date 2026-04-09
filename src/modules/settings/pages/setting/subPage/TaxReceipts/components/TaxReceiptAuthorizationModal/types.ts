import type { DateTime } from 'luxon';

import type {
  TaxReceiptData,
  TaxReceiptDocument,
  TaxReceiptUser,
} from '@/types/taxReceipt';

export interface TaxReceiptAuthorizationEntry {
  authorizationNumber: string;
  requestNumber: string;
  startSequence: string;
  endSequence: string;
  approvedQuantity: string;
  expirationDate: string;
  authorizationDate: string;
}

export type TaxReceiptWithAuthorizations = TaxReceiptData & {
  authorizations?: TaxReceiptAuthorizationEntry[];
};

export type TaxReceiptDocumentWithAuthorizations = Omit<
  TaxReceiptDocument,
  'data'
> & {
  data: TaxReceiptWithAuthorizations;
};

export interface AuthorizationFormValues {
  receiptId?: string;
  authorizationNumber: string;
  requestNumber: string;
  startSequence: string;
  approvedQuantity: string;
  expirationDate: DateTime;
}

export interface TaxReceiptAuthorizationModalProps {
  visible: boolean;
  onCancel: () => void;
  taxReceipts?: TaxReceiptDocumentWithAuthorizations[] | null;
  onAuthorizationAdded: (updatedReceipt: TaxReceiptWithAuthorizations) => void;
}

export type TaxReceiptUserWithBusiness = TaxReceiptUser & {
  businessID: string;
};
