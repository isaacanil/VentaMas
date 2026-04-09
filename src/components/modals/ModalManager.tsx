import { AnimatePresence } from 'framer-motion';
import { Fragment, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';

import { OPERATION_MODES } from '@/constants/modes';
import { useDialog } from '@/Context/Dialog/useDialog';
import { selectAccountsReceivablePayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectARDetailsModal } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectActiveIngredientModal } from '@/features/activeIngredients/activeIngredientsSlice';
import { selectAppMode } from '@/features/appModes/appModeSlice';
import { SelectBarcodePrintModal } from '@/features/barcodePrintModalSlice/barcodePrintModalSlice';
import { selectCreditNoteModal } from '@/features/creditNote/creditNoteModalSlice';
import { selectFileCenter } from '@/features/files/fileSlice';
import { selectImageViewerShow } from '@/features/imageViewer/imageViewerSlice';
import { selectInvoice } from '@/features/invoice/invoiceFormSlice';
import {
  SelectAddClientModal,
  SelectUpdateProdModal,
  SelectSetCustomPizzaModal,
  SelectProviderModalData,
  SelectClientModalData,
  SelectViewOrdersNotesModalData,
  SelectAddProductOutflowModal,
  SelectFileListModal,
  toggleFileListModal,
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
import { selectModalOpen as selectProductExpiryModalOpen } from '@/features/warehouse/productExpirySelectionSlice';
import { selectRowShelfState } from '@/features/warehouse/rowShelfModalSlice';
import { selectSegmentState } from '@/features/warehouse/segmentModalSlice';
import { selectShelfState } from '@/features/warehouse/shelfModalSlice';
import { selectWarehouseModalState } from '@/features/warehouse/warehouseModalSlice';
import Loader from '@/components/ui/loader/Loader';

// === Lazy Load: Components previously imported statically ===

// Default Exports
const RowShelfForm = lazy(
  () =>
    import('@/modules/inventory/pages/Inventory/components/Warehouse/forms/RowShelfForm/RowShelfForm'),
);
const SegmentForm = lazy(
  () =>
    import('@/modules/inventory/pages/Inventory/components/Warehouse/forms/SegmentForm/SegmentForm'),
);
const Dialog = lazy(() => import('@/components/ui/Dialog/Dialog'));
const ImageViewer = lazy(
  () => import('@/components/ui/ImageViewer/ImageViewer'),
);
const NoteModal = lazy(() => import('@/components/ui/NoteModal/NoteModal'));
const ActiveIngredientModal = lazy(
  () => import('./ActiveIngredients/ActiveIngredientModal'),
);
const AddCategoryModal = lazy(() => import('./AddCategory/AddCategory'));
const ARSummaryModal = lazy(() => import('./ARInfoModal/ARSummaryModal'));
const ProductBrandModal = lazy(
  () => import('./ProductBrands/ProductBrandModal'),
);
const ProductExpirySelection = lazy(
  () => import('./ProductExpirySelection/ProductExpirySelection'),
);

// Named Exports
const DeleteProductStockModal = lazy(() =>
  import('@/modules/inventory/pages/Inventory/components/Warehouse/components/DeleteProductStock/DeleteProductStockModal').then(
    (module) => ({ default: module.DeleteProductStockModal }),
  ),
);
const ShelfForm = lazy(() =>
  import('@/modules/inventory/pages/Inventory/components/Warehouse/forms/ShelfForm/ShelfForm').then(
    (module) => ({ default: module.ShelfForm }),
  ),
);
const WarehouseForm = lazy(() =>
  import('@/modules/inventory/pages/Inventory/components/Warehouse/forms/WarehouseForm/WarehouseForm').then(
    (module) => ({ default: module.WarehouseForm }),
  ),
);
const SignUpModal = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/Users/components/UserForm').then(
    (module) => ({ default: module.SignUpModal }),
  ),
);
const MessageAlert = lazy(() =>
  import('@/components/ui/Alerts/MessageAlert').then((module) => ({
    default: module.MessageAlert,
  })),
);
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
const AddClientModal = lazy(() =>
  import('./addClient/AddClientModal').then((module) => ({
    default: module.AddClientModal,
  })),
);
const BarcodePrintModal = lazy(() =>
  import('./BarcodePrintModal/BarcodePrintModal').then((module) => ({
    default: module.BarcodePrintModal,
  })),
);
const CreditNoteModal = lazy(() =>
  import('./CreditNoteModal/CreditNoteModal').then((module) => ({
    default: module.CreditNoteModal,
  })),
);
const SetCustomProduct = lazy(() =>
  import('./CustomProduct/setCustomProduct/SetCustomProduct').then(
    (module) => ({ default: module.SetCustomProduct }),
  ),
);
const FileListModal = lazy(() =>
  import('./FileListModal/FileListModal').then((module) => ({
    default: module.FileListModal,
  })),
);
const ProductOutflowModal = lazy(() =>
  import('./ProductOutflowModal/ProductOutflowModal').then((module) => ({
    default: module.ProductOutflowModal,
  })),
);
const ConfirmationDialog = lazy(() =>
  import('./UserNotification/components/ConfirmationDialog/ConfirmationDialog').then(
    (module) => ({ default: module.ConfirmationDialog }),
  ),
);

// === Lazy Load: Already Lazy in original file (Preserved) ===
const DeveloperModal = lazy(() =>
  import('./DeveloperModal/DeveloperModal').then((module) => ({
    default: module.DeveloperModal,
  })),
);
const InvoiceForm = lazy(() =>
  import('./InvoiceForm/InvoiceForm').then((module) => ({
    default: module.InvoiceForm,
  })),
);
const ClientFormAnt = lazy(() =>
  import('@/modules/contacts/pages/Contact/Client/components/ClientForm/ClientFormAnt').then(
    (module) => ({ default: module.default }),
  ),
);
const ProviderForm = lazy(() =>
  import('@/modules/contacts/pages/Contact/Provider/components/CreateContact/ProviderForm').then(
    (module) => ({ default: module.ProviderForm }),
  ),
);
const ProductStockForm = lazy(() =>
  import('@/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/ProductStockForm').then(
    (module) => ({ default: module.ProductStockForm }),
  ),
);
const InvoicePreview = lazy(() =>
  import('@/modules/invoice/pages/InvoicesPage/InvoicePreview/InvoicePreview').then(
    (module) => ({ default: module.InvoicePreview }),
  ),
);
const EvidenceUploadDrawer = lazy(() =>
  import('@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/EvidenceUploadDrawer/EvidenceUploadDrawer').then(
    (module) => ({ default: module.default }),
  ),
);
const PaymentForm = lazy(() =>
  import('@/modules/accountsReceivable/components/PaymentForm/PaymentForm').then(
    (module) => ({
      default: module.PaymentForm,
    }),
  ),
);
const ProductEditorModal = lazy(() =>
  import('./ProductForm/ProductEditorModal').then((module) => ({
    default: module.ProductEditorModal,
  })),
);

export const ModalManager = () => {
  const update = OPERATION_MODES.UPDATE.id;
  // --- Modals from modalSlice ---
  const AddClientModalSelected = useSelector(SelectAddClientModal);
  const UpdateProdModalSelected = useSelector(SelectUpdateProdModal);
  const SetCustomPizzaSelected = useSelector(SelectSetCustomPizzaModal);
  const ClientModalDataSelected = useSelector(SelectClientModalData);
  const ProviderModalDataSelected = useSelector(SelectProviderModalData);
  const ViewOrdersNotesModalDataSelected = useSelector(
    SelectViewOrdersNotesModalData,
  );
  const AddProductOutflowModalSelected = useSelector(
    SelectAddProductOutflowModal,
  );
  const ProductOutflowSelected = useSelector(SelectProductOutflow);
  const FileListSelected = useSelector(SelectFileListModal);
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
  const isProductExpirySelectionOpen = useSelector(
    selectProductExpiryModalOpen,
  );

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

          {isSignUpModalOpen.isOpen && <SignUpModal key={'sign-up-modal'} />}

          {UpdateProdModalSelected && (
            <ProductEditorModal
              key={'modal-form-product'}
              isOpen={UpdateProdModalSelected}
            />
          )}

          {FileListSelected && (
            <FileListModal
              key={'modal-file-list'}
              data={FileListSelected}
              onClose={toggleFileListModal}
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
          {ViewOrdersNotesModalDataSelected.isOpen && (
            <MessageAlert
              key={'modal-view-orders-notes'}
              isOpen={ViewOrdersNotesModalDataSelected.isOpen}
              data={ViewOrdersNotesModalDataSelected.data}
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
        {isProductExpirySelectionOpen && <ProductExpirySelection />}
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
