import { useEffect, useState } from 'react';

import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceProduct } from '@/types/invoice';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };

interface UseCreditNoteSelectionArgs {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  creditNoteData: CreditNoteRecord | null;
  selectedInvoiceId: string | null | undefined;
  availableInvoiceItems: CreditNoteProduct[];
  existingItemQuantities: Record<string, number>;
  clientsLoading: boolean;
  invoicesLoading: boolean;
}

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
  const [selectedItems, setSelectedItems] = useState<Array<string | undefined>>(
    [],
  );
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(
    {},
  );
  const [selectAll, setSelectAll] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<CreditNoteProduct[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'create' && creditNoteData) {
      const ids = creditNoteData.items?.map((i) => i.id) || [];
      setSelectedItems(ids);
      const qtyMap: Record<string, number> = {};
      (creditNoteData.items || []).forEach((it) => {
        qtyMap[String(it.id)] =
          typeof it.amountToBuy === 'number' ? it.amountToBuy : 1;
      });
      setItemQuantities(qtyMap);
      setSelectAll(false);
    } else {
      setSelectedItems([]);
      setItemQuantities({});
      setSelectAll(false);
    }
  }, [isOpen, mode, creditNoteData]);

  useEffect(() => {
    if (!selectedInvoiceId || clientsLoading || invoicesLoading) {
      if (!selectedInvoiceId) {
        setSelectedItems([]);
        setItemQuantities({});
        setSelectAll(false);
        setFilteredProducts([]);
      }
      return;
    }

    // Si estamos en modo edición, no reseteamos la selección inicial
    // ya que fue cargada desde la nota de crédito existe en el otro effect
    if (mode === 'edit') {
      setFilteredProducts(availableInvoiceItems);
      setSearchText('');
      setCurrentPage(1);
      return;
    }

    const initialSelection = availableInvoiceItems.map((item) => item.id);
    setSelectedItems(initialSelection);
    const qtyMap: Record<string, number> = {};
    availableInvoiceItems.forEach((it) => {
      qtyMap[String(it.id)] =
        existingItemQuantities[String(it.id)] || it.maxAvailableQty || 1;
    });
    setItemQuantities(qtyMap);
    setSelectAll(
      initialSelection.length > 0 &&
        initialSelection.length === availableInvoiceItems.length,
    );
    setFilteredProducts(availableInvoiceItems);
    setSearchText('');
    setCurrentPage(1);
  }, [
    selectedInvoiceId,
    availableInvoiceItems,
    existingItemQuantities,
    clientsLoading,
    invoicesLoading,
    mode,
  ]);

  useEffect(() => {
    const baseList = availableInvoiceItems;

    if (!searchText.trim()) {
      setFilteredProducts(baseList);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const filtered = baseList.filter((item) =>
      item.name?.toLowerCase().includes(searchLower),
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchText, availableInvoiceItems]);

  const handleSearchTextChange = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const ids = filteredProducts.map((item) => item.id);
      setSelectedItems(ids);
      const qtyMap: Record<string, number> = {};
      filteredProducts.forEach((item) => {
        qtyMap[String(item.id)] =
          existingItemQuantities[String(item.id)] || item.maxAvailableQty || 1;
      });
      setItemQuantities(qtyMap);
    } else {
      setSelectedItems([]);
      setItemQuantities({});
    }
  };

  const handleItemChange = (itemId: string | undefined, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
      const item = availableInvoiceItems.find((it) => it.id === itemId);
      const defaultQty =
        existingItemQuantities[String(itemId)] || item?.maxAvailableQty || 1;
      setItemQuantities((prev) => ({ ...prev, [String(itemId)]: defaultQty }));
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      setItemQuantities((prev) => {
        const { [String(itemId)]: _, ...rest } = prev;
        return rest;
      });
      setSelectAll(false);
    }
  };

  const resetSelection = () => {
    setSelectedItems([]);
    setItemQuantities({});
    setSelectAll(false);
    setFilteredProducts([]);
    setSearchText('');
    setCurrentPage(1);
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
