import { Form } from 'antd';
import styled from 'styled-components';

import Loader from '@/components/common/Loader/Loader';
import PurchaseCompletionSummary from '@/components/Purchase/PurchaseCompletionSummary';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { PageShell } from '@/components/layout/PageShell';
import { PurchaseManagementActions } from './components/PurchaseManagementActions';
import GeneralForm from './components/GeneralForm/GeneralForm';
import PurchaseReceiptForm from './components/PurchaseReceiptForm/PurchaseReceiptForm';
import { PurchaseWarehouseModal } from './components/PurchaseWarehouseModal';
import { usePurchaseManagementController } from './hooks/usePurchaseManagementController';

const Container = styled(PageShell)`
  display: grid;
  grid-template-rows: 1fr min-content;
  overflow: hidden;
`;

const Body = styled.div`
  width: 100%;
  max-width: 1440px;
  padding: 1em;
  margin: 0 auto;
  overflow-y: auto;
`;

const PurchaseManagement = () => {
  const {
    attachmentUrls,
    backOrderAssociationId,
    canSubmit,
    completedPurchase,
    clearPurchaseError,
    errors,
    handleAddFiles,
    handleCancel,
    handleCloseSummary,
    handleConfirmWarehouse,
    handleRemoveFile,
    handleSelectedWarehouseChange,
    handleSubmit,
    handleWarehouseModalCancel,
    initialReceivedMap,
    isWarehouseModalOpen,
    loading,
    localFiles,
    mode,
    purchaseLoading,
    sectionName,
    selectedWarehouseId,
    showSummary,
    warehouseOptions,
    warehousesLoading,
  } = usePurchaseManagementController();
  const isReceiptMode = mode === 'complete';

  return (
    <>
      <MenuApp showBackButton={false} sectionName={sectionName} />
      <Container>
        <Loader loading={purchaseLoading} minHeight="200px">
          <Body>
            <Form layout="vertical">
              {isReceiptMode ? (
                <PurchaseReceiptForm initialReceivedMap={initialReceivedMap} />
              ) : (
                <GeneralForm
                  files={localFiles}
                  attachmentUrls={attachmentUrls}
                  onAddFiles={handleAddFiles}
                  onRemoveFiles={handleRemoveFile}
                  onClearError={clearPurchaseError}
                  errors={errors}
                  backOrderAssociationId={backOrderAssociationId}
                  mode={mode}
                />
              )}
            </Form>
          </Body>
        </Loader>

        <PurchaseManagementActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          loading={loading}
          mode={mode}
          disabled={!canSubmit}
        />

        <PurchaseWarehouseModal
          open={isWarehouseModalOpen}
          onConfirm={handleConfirmWarehouse}
          onCancel={handleWarehouseModalCancel}
          loading={loading}
          selectedWarehouseId={selectedWarehouseId}
          onWarehouseChange={handleSelectedWarehouseChange}
          warehouseOptions={warehouseOptions}
          warehousesLoading={warehousesLoading}
        />

        <PurchaseCompletionSummary
          visible={showSummary}
          onClose={handleCloseSummary}
          purchase={completedPurchase}
        />
      </Container>
    </>
  );
};

export default PurchaseManagement;
