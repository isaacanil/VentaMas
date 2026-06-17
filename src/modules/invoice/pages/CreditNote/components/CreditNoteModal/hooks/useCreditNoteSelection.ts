import { useMemo, useState } from 'react';

import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceProduct } from '@/types/invoice';
import {
  buildCreditNoteSelectionFromInvoiceItems,
  buildInitialCreditNoteSelection,
  createCreditNoteSelectionTargetKey,
  createEmptyCreditNoteSelection,
  getCreditNoteItemInitialQuantity,
} from './useCreditNoteSelection.helpers';
import type {
  CreditNoteMode,
  CreditNoteSelectionState,
} from './useCreditNoteSelection.helpers';
import type { Dispatch, SetStateAction } from 'react';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };

interface UseCreditNoteSelectionArgs {
  isOpen: boolean;
  mode: CreditNoteMode;
  creditNoteData: CreditNoteRecord | null;
  selectedInvoiceId: string | null | undefined;
  availableInvoiceItems: CreditNoteProduct[];
  existingItemQuantities: Record<string, number>;
  clientsLoading: boolean;
  invoicesLoading: boolean;
}

type CreditNoteSelectionDraft = CreditNoteSelectionState & {
  targetKey: string | null;
  searchText: string;
  currentPage: number;
};

const createCreditNoteSelectionDraft = (
  targetKey: string | null,
  selection: CreditNoteSelectionState,
): CreditNoteSelectionDraft => ({
  targetKey,
  ...selection,
  searchText: '',
  currentPage: 1,
});

const resolveSetStateAction = <T>(
  value: SetStateAction<T>,
  previousValue: T,
): T =>
  typeof value === 'function'
    ? (value as (prev: T) => T)(previousValue)
    : value;

export const useCreditNoteSelection = ({
  isOpen,
  mode,
  creditNoteData,
  selectedInvoiceId,
  availableInvoiceItems,
  existingItemQuantities,
  clientsLoading,
  invoicesLoading,
}: UseCreditNoteSelectionArgs) => {
  const [draft, setDraft] = useState<CreditNoteSelectionDraft>(() =>
    createCreditNoteSelectionDraft(null, createEmptyCreditNoteSelection()),
  );

  const targetKey = useMemo(
    () =>
      createCreditNoteSelectionTargetKey({
        isOpen,
        mode,
        creditNoteData,
        selectedInvoiceId,
      }),
    [creditNoteData, isOpen, mode, selectedInvoiceId],
  );

  const initialSelection = useMemo(
    () =>
      buildInitialCreditNoteSelection({
        isOpen,
        mode,
        creditNoteData,
        selectedInvoiceId,
        availableInvoiceItems,
        existingItemQuantities,
        clientsLoading,
        invoicesLoading,
      }),
    [
      availableInvoiceItems,
      clientsLoading,
      creditNoteData,
      existingItemQuantities,
      invoicesLoading,
      isOpen,
      mode,
      selectedInvoiceId,
    ],
  );

  const activeDraft =
    draft.targetKey === targetKey
      ? draft
      : createCreditNoteSelectionDraft(targetKey, initialSelection);

  const updateDraft = (
    updater: (previous: CreditNoteSelectionDraft) => CreditNoteSelectionDraft,
  ) => {
    setDraft((previous) => {
      const previousForTarget =
        previous.targetKey === targetKey
          ? previous
          : createCreditNoteSelectionDraft(targetKey, initialSelection);

      return updater(previousForTarget);
    });
  };

  const { selectedItems, itemQuantities, selectAll, searchText, currentPage } =
    activeDraft;

  const filteredProducts = useMemo(() => {
    if (!selectedInvoiceId) return [];

    const searchLower = searchText.toLowerCase().trim();
    if (!searchLower) return availableInvoiceItems;

    return availableInvoiceItems.filter((item) =>
      item.name?.toLowerCase().includes(searchLower),
    );
  }, [availableInvoiceItems, searchText, selectedInvoiceId]);

  const handleSearchTextChange = (value: string) => {
    updateDraft((previous) => ({
      ...previous,
      searchText: value,
      currentPage: 1,
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const nextSelection = buildCreditNoteSelectionFromInvoiceItems(
        filteredProducts,
        existingItemQuantities,
      );
      updateDraft((previous) => ({
        ...previous,
        selectedItems: nextSelection.selectedItems,
        itemQuantities: nextSelection.itemQuantities,
        selectAll: checked,
      }));
    } else {
      updateDraft((previous) => ({
        ...previous,
        ...createEmptyCreditNoteSelection(),
      }));
    }
  };

  const handleItemChange = (itemId: string | undefined, checked: boolean) => {
    if (checked) {
      const item = availableInvoiceItems.find((it) => it.id === itemId);
      const defaultQty = getCreditNoteItemInitialQuantity(
        itemId,
        item,
        existingItemQuantities,
      );
      updateDraft((previous) => ({
        ...previous,
        selectedItems: [...previous.selectedItems, itemId],
        itemQuantities: {
          ...previous.itemQuantities,
          [String(itemId)]: defaultQty,
        },
      }));
    } else {
      updateDraft((previous) => {
        const { [String(itemId)]: _, ...rest } = previous.itemQuantities;
        return {
          ...previous,
          selectedItems: previous.selectedItems.filter((id) => id !== itemId),
          itemQuantities: rest,
          selectAll: false,
        };
      });
    }
  };

  const resetSelection = () => {
    setDraft(
      createCreditNoteSelectionDraft(null, createEmptyCreditNoteSelection()),
    );
  };

  const setCurrentPage: Dispatch<SetStateAction<number>> = (value) => {
    updateDraft((previous) => ({
      ...previous,
      currentPage: resolveSetStateAction(value, previous.currentPage),
    }));
  };

  const setItemQuantities: Dispatch<SetStateAction<Record<string, number>>> = (
    value,
  ) => {
    updateDraft((previous) => ({
      ...previous,
      itemQuantities: resolveSetStateAction(value, previous.itemQuantities),
    }));
  };

  const setSelectedItems: Dispatch<
    SetStateAction<Array<string | undefined>>
  > = (value) => {
    updateDraft((previous) => ({
      ...previous,
      selectedItems: resolveSetStateAction(value, previous.selectedItems),
    }));
  };

  const setSelectAll: Dispatch<SetStateAction<boolean>> = (value) => {
    updateDraft((previous) => ({
      ...previous,
      selectAll: resolveSetStateAction(value, previous.selectAll),
    }));
  };

  return {
    selectedItems,
    itemQuantities,
    selectAll,
    searchText,
    filteredProducts,
    currentPage,
    setCurrentPage,
    handleSearchTextChange,
    handleSelectAll,
    handleItemChange,
    resetSelection,
    setItemQuantities,
    setSelectedItems,
    setSelectAll,
  };
};
