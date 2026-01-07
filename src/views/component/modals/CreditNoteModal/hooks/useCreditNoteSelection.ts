// @ts-nocheck
import { useEffect, useState } from 'react';

export const useCreditNoteSelection = ({
  isOpen,
  mode,
  creditNoteData,
  selectedInvoiceId,
  availableInvoiceItems,
  existingItemQuantities,
  clientsLoading,
  invoicesLoading,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemQuantities, setItemQuantities] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'create' && creditNoteData) {
      const ids = creditNoteData.items?.map((i) => i.id) || [];
      setSelectedItems(ids);
      const qtyMap = {};
      (creditNoteData.items || []).forEach((it) => {
        qtyMap[it.id] = it.amountToBuy || 1;
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
    const qtyMap = {};
    availableInvoiceItems.forEach((it) => {
      qtyMap[it.id] = existingItemQuantities[it.id] || it.maxAvailableQty;
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

  const handleSearchTextChange = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const ids = filteredProducts.map((item) => item.id);
      setSelectedItems(ids);
      const qtyMap = {};
      filteredProducts.forEach((item) => {
        qtyMap[item.id] =
          existingItemQuantities[item.id] || item.maxAvailableQty;
      });
      setItemQuantities(qtyMap);
    } else {
      setSelectedItems([]);
      setItemQuantities({});
    }
  };

  const handleItemChange = (itemId, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
      const item = availableInvoiceItems.find((it) => it.id === itemId);
      const defaultQty =
        existingItemQuantities[itemId] || item?.maxAvailableQty || 1;
      setItemQuantities((prev) => ({ ...prev, [itemId]: defaultQty }));
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      setItemQuantities((prev) => {
        const { [itemId]: _, ...rest } = prev;
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
