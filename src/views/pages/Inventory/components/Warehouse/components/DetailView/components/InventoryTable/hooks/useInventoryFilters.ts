import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';

import type {
  DraftBatchOption,
  FilterDraft,
  ProductBatchMap,
  ProductOption,
} from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';

interface UseInventoryFiltersParams {
  productOptions: ProductOption[];
  productBatchMap: ProductBatchMap;
}

type FilterDraftUpdater = (previous: FilterDraft) => FilterDraft;

interface UseInventoryFiltersResult {
  showOnlyWithExpiration: boolean;
  selectedProductFilter: string | null;
  selectedBatches: string[];
  hasAdvancedFilters: boolean;
  filterDraft: FilterDraft;
  draftBatchOptions: DraftBatchOption[];
  isFilterModalOpen: boolean;
  openFilterModal: () => void;
  cancelFilterModal: () => void;
  applyFilterModal: () => void;
  resetFilterModal: () => void;
  updateFilterDraft: (updater: FilterDraftUpdater) => void;
  clearAdvancedFilters: () => void;
}

const DEFAULT_FILTER_DRAFT: FilterDraft = {
  showOnlyWithExpiration: false,
  batches: [],
  product: null,
};

export const useInventoryFilters = ({
  productOptions,
  productBatchMap,
}: UseInventoryFiltersParams): UseInventoryFiltersResult => {
  const [showOnlyWithExpiration, setShowOnlyWithExpiration] = useState(false);
  const [rawProductFilter, setRawProductFilter] = useState<string | null>(null);
  const [rawBatches, setRawBatches] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterDraft, setFilterDraft] =
    useState<FilterDraft>(DEFAULT_FILTER_DRAFT);

  // Validar producto seleccionado contra opciones disponibles durante render
  const selectedProductFilter = useMemo(() => {
    if (!rawProductFilter) return null;
    const validValues = new Set(productOptions.map((option) => option.value));
    return validValues.has(rawProductFilter) ? rawProductFilter : null;
  }, [productOptions, rawProductFilter]);

  // Validar batches seleccionados contra batches disponibles para el producto
  const selectedBatches = useMemo(() => {
    if (!selectedProductFilter || !rawBatches.length) return [];
    const batchesForProduct = productBatchMap.get(selectedProductFilter);
    if (!batchesForProduct || !batchesForProduct.size) return [];
    
    const validValues = new Set(
      Array.from(batchesForProduct.values()).map((option) => option.value),
    );
    return rawBatches.filter((value) => validValues.has(value));
  }, [productBatchMap, selectedProductFilter, rawBatches]);

  const hasAdvancedFilters =
    showOnlyWithExpiration ||
    !!selectedProductFilter ||
    selectedBatches.length > 0;

  const draftBatchOptions: DraftBatchOption[] = useMemo(() => {
    if (!filterDraft.product) return [];
    const batchesForProduct = productBatchMap.get(filterDraft.product);
    if (!batchesForProduct || !batchesForProduct.size) return [];

    return Array.from(batchesForProduct.values())
      .map((option) => ({
        ...option,
        displayLabel:
          option.label === 'Sin lote' ? 'Sin lote' : `# ${option.label}`,
        expirationText: option.expirationDateMillis
          ? `Vence ${DateTime.fromMillis(option.expirationDateMillis).toFormat(
            'dd/MM/yyyy',
          )}`
          : 'Sin fecha de vencimiento',
      }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [filterDraft.product, productBatchMap]);

  const openFilterModal = useCallback(() => {
    setFilterDraft({
      showOnlyWithExpiration,
      batches: [...selectedBatches],
      product: selectedProductFilter,
    });
    setIsFilterModalOpen(true);
  }, [selectedBatches, selectedProductFilter, showOnlyWithExpiration]);

  const cancelFilterModal = useCallback(() => {
    setFilterDraft({
      showOnlyWithExpiration,
      batches: [...selectedBatches],
      product: selectedProductFilter,
    });
    setIsFilterModalOpen(false);
  }, [selectedBatches, selectedProductFilter, showOnlyWithExpiration]);

  const applyFilterModal = useCallback(() => {
    setShowOnlyWithExpiration(filterDraft.showOnlyWithExpiration);
    setRawBatches([...filterDraft.batches]);
    setRawProductFilter(filterDraft.product);
    setIsFilterModalOpen(false);
  }, [filterDraft]);

  const resetFilterModal = useCallback(() => {
    setFilterDraft({ ...DEFAULT_FILTER_DRAFT });
    setShowOnlyWithExpiration(false);
    setRawBatches([]);
    setRawProductFilter(null);
  }, []);

  const updateFilterDraft = useCallback((updater: FilterDraftUpdater) => {
    setFilterDraft((previous) => updater(previous));
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    setShowOnlyWithExpiration(false);
    setRawBatches([]);
    setRawProductFilter(null);
    setFilterDraft({ ...DEFAULT_FILTER_DRAFT });
  }, []);

  return {
    showOnlyWithExpiration,
    selectedProductFilter,
    selectedBatches,
    hasAdvancedFilters,
    filterDraft,
    draftBatchOptions,
    isFilterModalOpen,
    openFilterModal,
    cancelFilterModal,
    applyFilterModal,
    resetFilterModal,
    updateFilterDraft,
    clearAdvancedFilters,
  };
};
