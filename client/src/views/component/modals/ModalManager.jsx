import { Fragment } from "react"
import { AddClientModal } from "./addClient/AddClientModal"

import { UpdateProductModal } from "./UpdateProduct/UpdateProductModal"
import { SetCustomProduct } from "./CustomProduct/setCustomProduct/SetCustomProduct"

import { useSelector } from "react-redux"

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
} from "../../../features/modals/modalSlice"

import { ClientForm } from "../../pages/Contact/Client/components/ClientForm/ClientForm"
import { ProviderForm } from "../../pages/Contact/Provider/components/CreateContact/ProviderForm"
import { MessageAlert } from "../../templates/system/Alerts/MessageAlert"
import { Notification } from "../../templates/system/Notification/Notification"
import { SmallNotification } from "../../templates/system/Notification/SmallNotification"
import Loader from "../../templates/system/loader/Loader"
import ImageViewer from "../../templates/system/ImageViewer/ImageViewer"
import AddCategoryModal from "./AddCategory/AddCategory"
import { ProductOutflowModal } from "./ProductOutflowModal/ProductOutflowModal"
import { SelectProductOutflow } from "../../../features/productOutflow/productOutflow"
import { OPERATION_MODES } from "../../../constants/modes"
import { ConfirmationDialog } from "./UserNotification/components/ConfirmationDialog/ConfirmationDialog"
import { AnimatePresence } from "framer-motion"

import Dialog from "../../templates/system/Dialog/Dialog"
import NoteModal from "../../templates/system/NoteModal/NoteModal"
import ClientFormAnt from "../../pages/Contact/Client/components/ClientForm/ClientFormAnt"
import { ProductEditorModal } from "./ProductForm/ProductEditorModal"
import { InvoiceForm } from "../../component/modals/InvoiceForm/InvoiceForm"
import { FileListModal } from "./FileListModal/FileListModal"
import { BarcodePrintModal } from "./BarcodePrintModal/BarcodePrintModal"
<<<<<<< Updated upstream
import { selectCurrentNotification } from "../../../features/notification/NotificationSlice"
import { SignUpModal } from "../../pages/setting/subPage/Users/components/UserForm"
=======
import { selectCurrentNotification } from "../../../features/notification/notificationSlice"
>>>>>>> Stashed changes
import { InvoicePreview } from "../../pages/Registro/InvoicePreview/InvoicePreview"

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

  return (
    <Fragment>
      <AnimatePresence>
        {AddClientModalSelected && (
          <AddClientModal
            key={'modal-add-client'}
            isOpen={AddClientModalSelected}
          />
        )}
        {/* <BusinessEditModal /> */}
        {/* <UpdateProductModal
            key='modal-update-product'
            isOpen={UpdateProdModalSelected}
          /> */}
        <BarcodePrintModal />
        <InvoicePreview />
        <SignUpModal />
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
      </AnimatePresence>
      <NoteModal />
      <Loader />
      <Dialog />
      <ImageViewer />
      <SmallNotification />
      <ConfirmationDialog />

    </Fragment>
  )

}