import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceProduct } from '@/types/invoice';

export type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };
export type CreditNoteMode = 'create' | 'edit' | 'view';

export interface CreditNoteSelectionState {
  selectedItems: Array<string | undefined>;
  itemQuantities: Record<string, number>;
  selectAll: boolean;
}

interface BuildInitialSelectionArgs {
  isOpen: boolean;
  mode: CreditNoteMode;
  creditNoteData: CreditNoteRecord | null;
  selectedInvoiceId: string | null | undefined;
  availableInvoiceItems: CreditNoteProduct[];
  existingItemQuantities: Record<string, number>;
  clientsLoading: boolean;
  invoicesLoading: boolean;
}

interface SelectionTargetKeyArgs {
  isOpen: boolean;
  mode: CreditNoteMode;
  creditNoteData: CreditNoteRecord | null;
  selectedInvoiceId: string | null | undefined;
}

export const createEmptyCreditNoteSelection = (): CreditNoteSelectionState => ({
  selectedItems: [],
  itemQuantities: {},
  selectAll: false,
});

export const getCreditNoteItemInitialQuantity = (
  itemId: string | undefined,
  item: CreditNoteProduct | undefined,
  existingItemQuantities: Record<string, number>,
): number =>
  existingItemQuantities[String(itemId)] || item?.maxAvailableQty || 1;

export const buildCreditNoteSelectionFromInvoiceItems = (
  items: CreditNoteProduct[],
  existingItemQuantities: Record<string, number>,
): CreditNoteSelectionState => {
  const selectedItems = items.map((item) => item.id);
  const itemQuantities: Record<string, number> = {};

  items.forEach((item) => {
    itemQuantities[String(item.id)] = getCreditNoteItemInitialQuantity(
      item.id,
      item,
      existingItemQuantities,
    );
  });

  return {
    selectedItems,
    itemQuantities,
    selectAll:
      selectedItems.length > 0 && selectedItems.length === items.length,
  };
};

export const buildCreditNoteSelectionFromCreditNote = (
  creditNoteData: CreditNoteRecord,
): CreditNoteSelectionState => {
  const items = creditNoteData.items || [];
  const selectedItems = items.map((item) => item.id);
  const itemQuantities: Record<string, number> = {};

  items.forEach((item) => {
    itemQuantities[String(item.id)] =
      typeof item.amountToBuy === 'number' ? item.amountToBuy : 1;
  });

  return {
    selectedItems,
    itemQuantities,
    selectAll: false,
  };
};

export const buildInitialCreditNoteSelection = ({
  isOpen,
  mode,
  creditNoteData,
  selectedInvoiceId,
  availableInvoiceItems,
  existingItemQuantities,
  clientsLoading,
  invoicesLoading,
}: BuildInitialSelectionArgs): CreditNoteSelectionState => {
  if (!isOpen || !selectedInvoiceId) {
    return createEmptyCreditNoteSelection();
  }

  if (mode !== 'create' && creditNoteData) {
    return buildCreditNoteSelectionFromCreditNote(creditNoteData);
  }

  if (clientsLoading || invoicesLoading || mode !== 'create') {
    return createEmptyCreditNoteSelection();
  }

  return buildCreditNoteSelectionFromInvoiceItems(
    availableInvoiceItems,
    existingItemQuantities,
  );
};

export const createCreditNoteSelectionTargetKey = ({
  isOpen,
  mode,
  creditNoteData,
  selectedInvoiceId,
}: SelectionTargetKeyArgs): string => {
  if (!isOpen) return 'closed';

  const noteKey = creditNoteData
    ? [
        creditNoteData.id,
        creditNoteData.invoiceId,
        creditNoteData.ncf,
        creditNoteData.numberID,
        creditNoteData.number,
      ]
        .map((value) => (value == null ? '' : String(value)))
        .join('|')
    : 'no-note';

  return [mode, selectedInvoiceId ?? 'no-invoice', noteKey].join(':');
};
