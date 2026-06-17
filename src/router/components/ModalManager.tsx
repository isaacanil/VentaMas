import { AnimatePresence } from 'framer-motion';
import { Fragment, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';

import { OPERATION_MODES } from '@/constants/modes';
import { useDialog } from '@/context/Dialog/useDialog';
import { selectAccountsReceivablePayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectARDetailsModal } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectActiveIngredientModal } from '@/features/activeIngredients/activeIngredientsSlice';
import { selectAppMode } from '@/features/appModes/appModeSlice';
import { SelectBarcodePrintModal } from '@/features/barcodePrintModalSlice/barcodePrintModalSlice';
import { selectCreditNoteModal } from '@/features/creditNote/creditNoteModalSlice';
import { selectFileCenter } from '@/features/files/fileSlice';
import { selectImageViewerShow } from '@/features/imageViewer/imageViewerSlice';
import { selectInvoice } from '@/features/invoice/invoiceFormSlice';
import { selectInvoiceWorkspaceModal } from '@/features/invoice/invoiceWorkspaceModalSlice';
import {
  SelectAddClientModal,
  SelectUpdateProdModal,
  SelectSetCustomPizzaModal,
  SelectProviderModalData,
  SelectClientModalData,
  SelectAddProductOutflowModal,
  SelectSignUpUserModal,
  SelectDeveloperModal,
} from '@/features/modals/modalSlice';
import { selectNote } from '@/features/noteModal/noteModalSlice';
import { selectCurrentNotification } from '@/features/notification/notificationSlice';
import { selectProductBrandModal } from '@/features/productBrands/productBrandSlice';
import { SelectProductOutflow } from '@/features/productOutflow/productOutflow';
import { selectDeleteModalState } from '@/features/productStock/deleteProductStockSlice';
import { selectProductStock } from '@/features/productStock/productStockSlice';
import { selectCurrentUserNotification } from '@/features/UserNotification/UserNotificationSlice';
import { selectRowShelfState } from '@/features/warehouse/rowShelfModalSlice';
import { selectSegmentState } from '@/features/warehouse/segmentModalSlice';
import { selectShelfState } from '@/features/warehouse/shelfModalSlice';
import { selectWarehouseModalState } from '@/features/warehouse/warehouseModalSlice';
import Loader from '@/components/ui/loader/Loader';
import {
  loadAccountReceivableSummaryModal,
  loadAccountsReceivablePaymentForm,
} from '@/modules/accountsReceivable/public';
import {
  loadClientFormModal,
  loadLegacyAddClientModal,
  loadProviderFormModal,
} from '@/modules/contacts/public';
import { loadDeveloperConsoleModal } from '@/modules/dev/public';
import {
  loadDeleteProductStockModal,
  loadBarcodePrintModal,
  loadProductOutflowModal,
  loadProductStockForm,
  loadRowShelfForm,
  loadSegmentForm,
  loadShelfForm,
  loadWarehouseForm,
} from '@/modules/inventory/public';
import {
  loadCreditNoteModal,
  loadInvoiceFormModal,
  loadInvoicePreviewModal,
  loadInvoiceWorkspaceModal,
} from '@/modules/invoice/public';
import { loadEvidenceUploadDrawer } from '@/modules/orderAndPurchase/public';
import {
  loadActiveIngredientModal,
  loadProductEditorModal,
  loadProductBrandModal,
} from '@/modules/products/public';
import { loadSetCustomProductModal } from '@/modules/sales/public';
import { loadSignUpUserModal } from '@/modules/settings/public';

// === Lazy Load: Components previously imported statically ===

// Default Exports
const RowShelfForm = lazy(loadRowShelfForm);
const SegmentForm = lazy(loadSegmentForm);
const Dialog = lazy(() => import('@/components/ui/Dialog/Dialog'));
const ImageViewer = lazy(
  () => import('@/components/ui/ImageViewer/ImageViewer'),
);
const NoteModal = lazy(() => import('@/router/components/modals/NoteModal'));
const ActiveIngredientModal = lazy(loadActiveIngredientModal);
const AddCategoryModal = lazy(() =>
  import('@/context/CategoryContext/components/AddCategoryModal/AddCategoryModal'),
);
const ARSummaryModal = lazy(loadAccountReceivableSummaryModal);
const ProductBrandModal = lazy(loadProductBrandModal);

// Named Exports
const DeleteProductStockModal = lazy(loadDeleteProductStockModal);
const ShelfForm = lazy(loadShelfForm);
const WarehouseForm = lazy(loadWarehouseForm);
const SignUpModal = lazy(loadSignUpUserModal);
const Notification = lazy(() =>
  import('@/components/ui/Notification/Notification').then((module) => ({
    default: module.Notification,
  })),
);
const TestModeIndicator = lazy(() =>
  import('@/components/ui/Notification/TestModeIndicator').then((module) => ({
    default: module.TestModeIndicator,
  })),
);
const AddClientModal = lazy(loadLegacyAddClientModal);
const BarcodePrintModal = lazy(loadBarcodePrintModal);
const CreditNoteModal = lazy(loadCreditNoteModal);
const SetCustomProduct = lazy(loadSetCustomProductModal);
const ProductOutflowModal = lazy(loadProductOutflowModal);
const ConfirmationDialog = lazy(() =>
  import(
    '@/features/UserNotification/components/ConfirmationDialog/ConfirmationDialog'
  ).then((module) => ({ default: module.ConfirmationDialog })),
);

// === Lazy Load: Already Lazy in original file (Preserved) ===
const DeveloperModal = lazy(() =>
  loadDeveloperConsoleModal().then((module) => ({
    default: module.DeveloperModal,
  })),
);
const InvoiceForm = lazy(loadInvoiceFormModal);
const ClientFormAnt = lazy(loadClientFormModal);
const ProviderForm = lazy(loadProviderFormModal);
const ProductStockForm = lazy(loadProductStockForm);
const InvoicePreview = lazy(loadInvoicePreviewModal);
const InvoiceWorkspaceModal = lazy(loadInvoiceWorkspaceModal);
const EvidenceUploadDrawer = lazy(loadEvidenceUploadDrawer);
const PaymentForm = lazy(loadAccountsReceivablePaymentForm);
const ProductEditorModal = lazy(loadProductEditorModal);

export const ModalManager = () => {
  const update = OPERATION_MODES.UPDATE.id;
  // --- Modals from modalSlice ---
  const AddClientModalSelected = useSelector(SelectAddClientModal);
  const UpdateProdModalSelected = useSelector(SelectUpdateProdModal);
  const SetCustomPizzaSelected = useSelector(SelectSetCustomPizzaModal);
  const ClientModalDataSelected = useSelector(SelectClientModalData);
  const ProviderModalDataSelected = useSelector(SelectProviderModalData);
  const AddProductOutflowModalSelected = useSelector(
    SelectAddProductOutflowModal,
  );
  const ProductOutflowSelected = useSelector(SelectProductOutflow);
  const isSignUpModalOpen = useSelector(SelectSignUpUserModal);
  const isDeveloperModalOpen = useSelector(SelectDeveloperModal);

  // --- Modals from other slices ---
  const currentNotification = useSelector(selectCurrentNotification);
  const { isOpen: isShelfOpen } = useSelector(selectShelfState);
  const { isOpen: isRowShelfOpen } = useSelector(selectRowShelfState);
  const { isOpen: isSegmentOpen } = useSelector(selectSegmentState);
  const { isOpen: isWarehouseOpen } = useSelector(selectWarehouseModalState);
  const { isOpen: isDeleteProductStockOpen } = useSelector(
    selectDeleteModalState,
  );
  const { isOpen: isNoteModalOpen } = useSelector(selectNote);
  const { dialog } = useDialog(); // Dialog uses Context, not Redux directly here
  const isDialogContextOpen = dialog.isOpen;
  const isImageViewerOpen = useSelector(selectImageViewerShow);
  const { isOpen: isConfirmationDialogOpen } = useSelector(
    selectCurrentUserNotification,
  );
  const { isOpen: isProductBrandModalOpen } = useSelector(
    selectProductBrandModal,
  );
  const { isOpen: isProductStockFormOpen } = useSelector(selectProductStock);
  const { isOpen: isBarcodePrintModalOpen } = useSelector(
    SelectBarcodePrintModal,
  );
  const { modal } = useSelector(selectInvoice); // Assumed 'isOpen' based on pattern
  const isInvoiceFormOpen = modal?.isOpen;
  const { isOpen: isInvoiceWorkspaceModalOpen } = useSelector(
    selectInvoiceWorkspaceModal,
  );
  const { isOpen: isPaymentFormOpen } = useSelector(
    selectAccountsReceivablePayment,
  );
  const { open: isEvidenceUploadDrawerOpen } = useSelector(selectFileCenter);
  const { isOpen: isCreditNoteModalOpen } = useSelector(selectCreditNoteModal);
  const { isOpen: isActiveIngredientModalOpen } = useSelector(
    selectActiveIngredientModal,
  );
  const { isOpen: isARSummaryModalOpen } = useSelector(selectARDetailsModal);
  const isTestMode = useSelector(selectAppMode);

  return (
    <Fragment>
      <Suspense fallback={null}>
        <AnimatePresence>
          {AddClientModalSelected && (
            <AddClientModal
              key={'modal-add-client'}
              isOpen={AddClientModalSelected}
            />
          )}

          {isBarcodePrintModalOpen && (
            <BarcodePrintModal key={'modal-barcode-print'} />
          )}

          <InvoicePreview key={'invoice-preview'} />

          {isInvoiceWorkspaceModalOpen && (
            <InvoiceWorkspaceModal key={'invoice-workspace'} />
          )}

          {isSignUpModalOpen.isOpen && <SignUpModal key={'sign-up-modal'} />}

          {UpdateProdModalSelected && (
            <ProductEditorModal
              key={'modal-form-product'}
              isOpen={UpdateProdModalSelected}
            />
          )}

          {isInvoiceFormOpen && <InvoiceForm key={'modal-invoice'} />}

          {SetCustomPizzaSelected && (
            <SetCustomProduct
              key={'modal-set-custom-pizza'}
              isOpen={SetCustomPizzaSelected}
            />
          )}
          {ClientModalDataSelected.isOpen && (
            <ClientFormAnt
              key={'modal-client'}
              isOpen={ClientModalDataSelected.isOpen}
              mode={ClientModalDataSelected.mode}
              addClientToCart={ClientModalDataSelected.addClientToCart}
              data={
                ClientModalDataSelected.mode === update
                  ? ClientModalDataSelected.data
                  : null
              }
            />
          )}

          {isPaymentFormOpen && (
            <Suspense fallback={null}>
              <PaymentForm key={'modal-payment-form'} />
            </Suspense>
          )}

          {ProviderModalDataSelected.isOpen && (
            <ProviderForm
              key={'modal-provider'}
            />
          )}
          {currentNotification.visible && <Notification key={'notification'} />}

          {isProductStockFormOpen && (
            <ProductStockForm key={'modal-product-stock-form'} />
          )}

          <AddCategoryModal
            key={'modal-add-category'}
          />

          {AddProductOutflowModalSelected.isOpen && (
            <ProductOutflowModal
              key={'modal-product-outflow'}
              isOpen={AddProductOutflowModalSelected.isOpen}
              mode={
                ProductOutflowSelected.mode === 'update' ? 'update' : 'create'
              }
            />
          )}
          {isEvidenceUploadDrawerOpen && (
            <EvidenceUploadDrawer key={'modal-evidence-upload-drawer'} />
          )}

          {isDeleteProductStockOpen && (
            <DeleteProductStockModal key={'modal-delete-product-stock'} />
          )}

          {isDeveloperModalOpen && <DeveloperModal key={'modal-developer'} />}

          {isCreditNoteModalOpen && (
            <CreditNoteModal key={'modal-credit-note'} />
          )}
        </AnimatePresence>

        {isNoteModalOpen && <NoteModal />}
        <Loader />
        {isDialogContextOpen && <Dialog />}
        {isActiveIngredientModalOpen && <ActiveIngredientModal />}
        {isARSummaryModalOpen && <ARSummaryModal />}
        {isShelfOpen && <ShelfForm />}
        {isRowShelfOpen && <RowShelfForm />}
        {isSegmentOpen && <SegmentForm />}
        {isWarehouseOpen && <WarehouseForm />}
        {isImageViewerOpen && <ImageViewer />}
        {isTestMode && <TestModeIndicator />}
        {isConfirmationDialogOpen && <ConfirmationDialog />}
        {isProductBrandModalOpen && <ProductBrandModal />}
      </Suspense>
    </Fragment>
  );
};
