import { AnimatePresence } from "framer-motion"
import { Fragment } from "react"
import { useSelector } from "react-redux"

import { DeveloperModal } from "../../../components/modals/DeveloperModal/DeveloperModal"
import { OPERATION_MODES } from "../../../constants/modes"
import {
  SelectAddClientModal,
  SelectUpdateProdModal,
  SelectSetCustomPizzaModal,
  handleModalSetCustomPizza,
  SelectProviderModalData,
  SelectClientModalData,
  SelectViewOrdersNotesModalData,
  SelectAddCategoryModal,
  SelectAddProductOutflowModal,
  SelectFileListModal,
  toggleFileListModal,
  SelectDeveloperModal,
} from "../../../features/modals/modalSlice"
import { selectCurrentNotification } from "../../../features/notification/notificationSlice"
import { SelectProductOutflow } from "../../../features/productOutflow/productOutflow"
import { InvoiceForm } from "../../component/modals/InvoiceForm/InvoiceForm"
import ClientFormAnt from "../../pages/Contact/Client/components/ClientForm/ClientFormAnt"
import { ProviderForm } from "../../pages/Contact/Provider/components/CreateContact/ProviderForm"
import { DeleteProductStockModal } from "../../pages/Inventory/components/Warehouse/components/DeleteProductStock/DeleteProductStockModal"
import { ProductStockForm } from "../../pages/Inventory/components/Warehouse/forms/ProductStockForm/ProductStockForm"
import RowShelfForm from "../../pages/Inventory/components/Warehouse/forms/RowShelfForm/RowShelfForm"
import SegmentForm from "../../pages/Inventory/components/Warehouse/forms/SegmentForm/SegmentForm"
import { ShelfForm } from "../../pages/Inventory/components/Warehouse/forms/ShelfForm/ShelfForm"
import { WarehouseForm } from "../../pages/Inventory/components/Warehouse/forms/WarehouseForm/WarehouseForm"
import { InvoicePreview } from "../../pages/InvoicesPage/InvoicePreview/InvoicePreview"
import EvidenceUploadDrawer from "../../pages/OrderAndPurchase/PurchaseManagement/components/EvidenceUploadDrawer/EvidenceUploadDrawer"
import { SignUpModal } from "../../pages/setting/subPage/Users/components/UserForm"
import { MessageAlert } from "../../templates/system/Alerts/MessageAlert"
import Dialog from "../../templates/system/Dialog/Dialog"
import ImageViewer from "../../templates/system/ImageViewer/ImageViewer"
import Loader from "../../templates/system/loader/Loader"
import NoteModal from "../../templates/system/NoteModal/NoteModal"
import { Notification } from "../../templates/system/Notification/Notification"
import { TestModeIndicator } from "../../templates/system/Notification/TestModeIndicator"
import { PaymentForm } from "../forms/PaymentForm/PaymentForm"

import ActiveIngredientModal from "./ActiveIngredients/ActiveIngredientModal"
import AddCategoryModal from "./AddCategory/AddCategory"
import { AddClientModal } from "./addClient/AddClientModal"
import ARSummaryModal from "./ARInfoModal/ARSummaryModal"
import { BarcodePrintModal } from "./BarcodePrintModal/BarcodePrintModal"
import { CreditNoteModal } from "./CreditNoteModal/CreditNoteModal"
import { SetCustomProduct } from "./CustomProduct/setCustomProduct/SetCustomProduct"
import { FileListModal } from "./FileListModal/FileListModal"
import ProductExpirySelection from "./ProductExpirySelection/ProductExpirySelection"
import { ProductEditorModal } from "./ProductForm/ProductEditorModal"
import { ProductOutflowModal } from "./ProductOutflowModal/ProductOutflowModal"
import { ConfirmationDialog } from "./UserNotification/components/ConfirmationDialog/ConfirmationDialog"



export const ModalManager = () => {

  const update = OPERATION_MODES.UPDATE.id;
  const AddClientModalSelected = useSelector(SelectAddClientModal)
  const UpdateProdModalSelected = useSelector(SelectUpdateProdModal)
  const SetCustomPizzaSelected = useSelector(SelectSetCustomPizzaModal)
  const ClientModalDataSelected = useSelector(SelectClientModalData)
  const ProviderModalDataSelected = useSelector(SelectProviderModalData)
  const AddCategoryModalSelected = useSelector(SelectAddCategoryModal)
  const ViewOrdersNotesModalDataSelected = useSelector(SelectViewOrdersNotesModalData)
  const AddProductOutflowModalSelected = useSelector(SelectAddProductOutflowModal)
  const ProductOutflowSelected = useSelector(SelectProductOutflow)
  const currentNotification = useSelector(selectCurrentNotification)
  const FileListSelected = useSelector(SelectFileListModal)
  const DeveloperModalSelected = useSelector(SelectDeveloperModal)
  {/* <BusinessEditModal /> */ }

  {/* <ARInfoModal
                key={'modal-ar-info-modal'}
             /> */}

  return (
    <Fragment>
      <AnimatePresence>
        {AddClientModalSelected && (
          <AddClientModal
            key={'modal-add-client'}
            isOpen={AddClientModalSelected}
          />
        )}
        <BarcodePrintModal
          key={'modal-barcode-print'}
        />
        <InvoicePreview key={'invoice-preview'} />
        <SignUpModal key={'sign-up-modal'} />
        {UpdateProdModalSelected && (
          <ProductEditorModal
            key={'modal-form-product'}
            isOpen={UpdateProdModalSelected} />
        )}
        <FileListModal
          key={'modal-file-list'}
          data={FileListSelected} onClose={toggleFileListModal} />
        <InvoiceForm
          key={'modal-invoice'}

        />
        {SetCustomPizzaSelected && (
          <SetCustomProduct
            key={'modal-set-custom-pizza'}
            isOpen={SetCustomPizzaSelected}
            handleOpen={handleModalSetCustomPizza}
          />
        )}
        {ClientModalDataSelected.isOpen && (
          <ClientFormAnt
            key={'modal-client'}
            isOpen={ClientModalDataSelected.isOpen}
            mode={ClientModalDataSelected.mode}
            addClientToCart={ClientModalDataSelected.addClientToCart}
            data={ClientModalDataSelected.mode === update ? ClientModalDataSelected.data : null}
          />
        )}
        <PaymentForm
          key={'modal-payment-form'}
        />

        {ProviderModalDataSelected.isOpen && (
          <ProviderForm
            key={'modal-provider'}
            isOpen={ProviderModalDataSelected.isOpen}
            mode={ProviderModalDataSelected.mode}
            data={ProviderModalDataSelected.mode === update ? ProviderModalDataSelected.data : null}
          />
        )}
        {currentNotification.visible && (
          <Notification
            key={'notification'}
          />
        )}

        <ProductStockForm
          key={'modal-product-stock-form'}
        />

        <AddCategoryModal
          key={'modal-add-category'}
          isOpen={AddCategoryModalSelected.isOpen}
          categoryToUpdate={AddCategoryModalSelected.data}
        />

        {AddProductOutflowModalSelected.isOpen && (
          <ProductOutflowModal
            key={'modal-product-outflow'}
            isOpen={AddProductOutflowModalSelected.isOpen}
            mode={ProductOutflowSelected.mode}
          />
        )}
        {ViewOrdersNotesModalDataSelected.isOpen && (
          <MessageAlert
            key={'modal-view-orders-notes'}
            isOpen={ViewOrdersNotesModalDataSelected.isOpen}
            data={ViewOrdersNotesModalDataSelected.data}
          />
        )}

        <EvidenceUploadDrawer
          key={'modal-evidence-upload-drawer'}
        />
        <DeleteProductStockModal
          key={'modal-delete-product-stock'}  
        />
        <DeveloperModal
          key={'modal-developer'}
        />
        <CreditNoteModal
          key={'modal-credit-note'}
        />
      </AnimatePresence>
      <NoteModal />
      <Loader />
      <Dialog />
      <ProductExpirySelection />
      <ActiveIngredientModal />
      <ARSummaryModal />
      <ShelfForm />
      <RowShelfForm />      
      <SegmentForm />
      <WarehouseForm />
      <ImageViewer />
      <TestModeIndicator />
      <ConfirmationDialog />
    </Fragment>
  )

}