import { MoreOutlined } from '@/constants/icons/antd';
import { Dropdown } from 'antd';

import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import BatchViewModal from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/BatchViewModal';
import { ProductMovementModal } from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/ProductMovementModal';

import { AdvancedFilterModal } from './components/AdvancedFilterModal';
import { SearchControls } from './components/SearchControls';
import { useInventoryColumns } from './hooks/useInventoryColumns';
import { useInventoryTableController } from './hooks/useInventoryTableController';
import {
  Container,
  Title,
  TitleActions,
  TitleSection,
  ToolbarButton,
} from './styles';
import type { InventoryTableProps } from './types';

export const InventoryTable: React.FC<InventoryTableProps> = ({
  currentNode,
  searchTerm,
  setSearchTerm,
  setDateRange,
  location,
}) => {
  const {
    loading,
    inventoryData,
    dateFilter,
    dateRangePresets,
    batchModalVisible,
    handleClearFilters,
    handleDateRangeChange,
    handleMoveSubmit,
    handleToolbarMenuClick,
    getActionMenu,
    moveModalVisible,
    productOptions,
    selectedBatch,
    selectedProduct,
    sortMenuItems,
    syncingBatches,
    toolbarMenuItems,
    filters,
    closeBatchModal,
    closeMoveModal,
    handleViewBatch,
  } = useInventoryTableController({
    searchTerm,
    setSearchTerm,
    setDateRange,
    location,
  });

  const columns = useInventoryColumns({
    onViewBatch: (batchId) => void handleViewBatch(batchId),
    getActionMenu,
  });

  return (
    <>
      <Container>
        <TitleSection>
          <Title>Gestión de Inventario</Title>
          <TitleActions>
            <Dropdown
              trigger={['click']}
              menu={{
                items: toolbarMenuItems,
                onClick: handleToolbarMenuClick,
              }}
              placement="bottomRight"
            >
              <ToolbarButton
                aria-label="Acciones avanzadas"
                icon={<MoreOutlined />}
                loading={syncingBatches}
              />
            </Dropdown>
          </TitleActions>
        </TitleSection>

        <SearchControls
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          dateFilter={dateFilter}
          onDateRangeChange={handleDateRangeChange}
          dateRangePresets={dateRangePresets}
          sortMenuItems={sortMenuItems}
          onOpenAdvancedFilters={filters.openFilterModal}
          hasAdvancedFilters={filters.hasAdvancedFilters}
          onClearFilters={handleClearFilters}
        />

        <AdvancedTable
          columns={columns}
          data={inventoryData}
          loading={loading}
          numberOfElementsPerPage={8}
          emptyText="No hay registros para mostrar"
        />

        <AdvancedFilterModal
          open={filters.isFilterModalOpen}
          filterDraft={filters.filterDraft}
          onCancel={filters.cancelFilterModal}
          onReset={filters.resetFilterModal}
          onApply={filters.applyFilterModal}
          onToggleExpiration={(checked) =>
            filters.updateFilterDraft((prev) => ({
              ...prev,
              showOnlyWithExpiration: checked,
            }))
          }
          productOptions={productOptions}
          onProductChange={(value) =>
            filters.updateFilterDraft((prev) => ({
              ...prev,
              product: value,
              batches: [],
            }))
          }
          draftBatchOptions={filters.draftBatchOptions}
          onToggleBatch={(batchValue, checked) =>
            filters.updateFilterDraft((prev) => ({
              ...prev,
              batches: checked
                ? [...prev.batches, batchValue]
                : prev.batches.filter((value) => value !== batchValue),
            }))
          }
        />
      </Container>

      <ProductMovementModal
        visible={moveModalVisible}
        onCancel={closeMoveModal}
        onOk={handleMoveSubmit}
        product={selectedProduct}
        currentNode={currentNode}
      />

      <BatchViewModal
        visible={batchModalVisible}
        onClose={closeBatchModal}
        batchData={selectedBatch}
      />
    </>
  );
};
